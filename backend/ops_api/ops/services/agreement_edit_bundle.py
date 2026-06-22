"""Atomic-edit orchestrator for agreement, services components, and budget line items.

Used by the ``PATCH /agreements/<id>/edit-bundle`` endpoint to apply every change in a
single SQLAlchemy transaction. If any step raises, the entire bundle is rolled back so
no partial writes survive.

The orchestrator delegates to the existing per-resource services with their new
``commit=False`` flag so individual writes flush (to assign ids and surface integrity
errors immediately) without committing.
"""

from dataclasses import dataclass, field
from types import SimpleNamespace
from typing import Any

from loguru import logger
from marshmallow import EXCLUDE
from sqlalchemy.exc import IntegrityError

from models import Agreement
from ops_api.ops.resources.agreements_constants import (
    AGREEMENT_TYPE_TO_CLASS_MAPPING,
    AGREEMENT_TYPE_TO_DATACLASS_MAPPING,
)
from ops_api.ops.schemas.budget_line_items import (
    NestedBudgetLineItemRequestSchema,
    PATCHRequestBodySchema,
)
from ops_api.ops.schemas.services_component import (
    NestedServicesComponentRequestSchema,
    ServicesComponentUpdateSchema,
)
from ops_api.ops.services.agreements import AgreementsService
from ops_api.ops.services.budget_line_items import BudgetLineItemService
from ops_api.ops.services.change_requests import ChangeRequestService
from ops_api.ops.services.ops_service import ResourceNotFoundError, ValidationError
from ops_api.ops.services.services_component import ServicesComponentService


@dataclass
class BundleResult:
    """What the orchestrator returns to the caller for the API response."""

    agreement_updated: bool = False
    services_components_created: int = 0
    services_components_updated: int = 0
    services_components_deleted: int = 0
    budget_line_items_created: int = 0
    budget_line_items_updated: int = 0
    budget_line_items_deleted: int = 0
    change_request_ids: list[int] = field(default_factory=list)


class AgreementEditBundleService:
    """Orchestrates an atomic agreement / SC / BLI / change-request edit."""

    def __init__(self, db_session):
        self.db_session = db_session
        self._agreements = AgreementsService(db_session)
        self._scs = ServicesComponentService(db_session)
        self._blis = BudgetLineItemService(db_session)
        self._change_requests = ChangeRequestService(db_session)

    def update(self, agreement_id: int, payload: dict[str, Any]) -> BundleResult:
        """Apply every section of ``payload`` to ``agreement_id`` atomically.

        Order of operations matters: SCs are created before BLIs so new BLIs can
        reference newly-created SCs by ``services_component_ref``. Deletes run last
        so referencing rows are gone before their parents.
        """
        agreement = self.db_session.get(Agreement, agreement_id)
        if not agreement:
            raise ResourceNotFoundError("Agreement", agreement_id)

        result = BundleResult()
        # Change requests created without commit must have reviewers notified after the
        # bundle commit succeeds — never before, or we'd notify on a rolled-back tx.
        deferred_notifications: list = []

        try:
            # 1. Agreement-level update (optional)
            agreement_data = payload.get("agreement")
            if agreement_data:
                self._apply_agreement_update(agreement, agreement_data)
                result.agreement_updated = True

            sc_payload = payload.get("services_components") or {}
            bli_payload = payload.get("budget_line_items") or {}

            # 2. SC creates → flush to populate IDs so later BLI creates can resolve
            #    services_component_ref to the new SC ids.
            sc_ref_map, created_sc_count = self._create_services_components(
                agreement_id, sc_payload.get("create", []) or []
            )
            result.services_components_created = created_sc_count

            # 3. SC updates
            result.services_components_updated = self._update_services_components(
                sc_payload.get("update", []) or []
            )

            # 4. BLI creates (resolves services_component_ref using sc_ref_map)
            result.budget_line_items_created = self._create_budget_line_items(
                agreement, bli_payload.get("create", []) or [], sc_ref_map
            )

            # 5. BLI updates — may produce change requests; collected for post-commit notify
            updated_count, change_request_ids = self._update_budget_line_items(
                bli_payload.get("update", []) or []
            )
            result.budget_line_items_updated = updated_count
            result.change_request_ids.extend(change_request_ids)
            deferred_notifications.extend(change_request_ids)

            # 6. BLI deletes (before SC deletes — BLIs reference SCs)
            result.budget_line_items_deleted = self._delete_budget_line_items(
                bli_payload.get("delete", []) or []
            )

            # 7. SC deletes
            result.services_components_deleted = self._delete_services_components(
                sc_payload.get("delete", []) or []
            )

            # 8. Commit the entire bundle
            self.db_session.commit()
            logger.info(
                f"Agreement edit bundle committed for agreement_id={agreement_id}: {result}"
            )

        except IntegrityError as e:
            self.db_session.rollback()
            logger.error(f"Bundle rollback (integrity error) agreement_id={agreement_id}: {e}")
            if "ix_agreement_name_type_lower" in str(e):
                raise ValidationError(
                    {
                        "name": [
                            "An agreement with this name and type already exists. "
                            "Agreement names must be unique (case-insensitive) within each agreement type."
                        ]
                    }
                )
            raise
        except Exception:
            self.db_session.rollback()
            logger.exception(f"Bundle rollback agreement_id={agreement_id}")
            raise

        # Post-commit: notify division reviewers for any deferred change requests.
        # If notification fails, the data is already saved — we just log; the user can
        # trigger a re-notification by re-saving.
        for cr_id in deferred_notifications:
            try:
                cr = self._change_requests.get(cr_id)
                self._change_requests._notify_division_reviewers(cr)
            except Exception:
                logger.exception(f"Failed to notify reviewers for change_request_id={cr_id}")

        return result

    # ------------------------------------------------------------------
    # Agreement
    # ------------------------------------------------------------------

    def _apply_agreement_update(self, agreement: Agreement, agreement_data: dict[str, Any]) -> None:
        schema = AGREEMENT_TYPE_TO_DATACLASS_MAPPING.get(agreement.agreement_type)()
        # Defensive: nested arrays are not allowed in the agreement section — they
        # belong in the bundle's services_components / budget_line_items keys instead.
        agreement_data = {
            k: v for k, v in agreement_data.items() if k not in ("budget_line_items", "services_components")
        }
        loaded = schema.load(agreement_data, unknown=EXCLUDE, partial=True)
        loaded.pop("budget_line_items", None)
        loaded.pop("services_components", None)
        loaded["agreement_cls"] = AGREEMENT_TYPE_TO_CLASS_MAPPING.get(agreement.agreement_type)
        self._agreements.update(agreement.id, loaded, partial=True, commit=False)

    # ------------------------------------------------------------------
    # Services Components
    # ------------------------------------------------------------------

    def _create_services_components(
        self, agreement_id: int, items: list[dict[str, Any]]
    ) -> tuple[dict[str, int], int]:
        sc_ref_map: dict[str, int] = {}
        sc_create_schema = NestedServicesComponentRequestSchema()
        for idx, sc_data in enumerate(items):
            loaded = sc_create_schema.load(sc_data, unknown=EXCLUDE)
            temp_ref = loaded.pop("ref", None) or str(idx)
            loaded["agreement_id"] = agreement_id
            new_sc = self._scs.create(loaded, commit=False)
            sc_ref_map[temp_ref] = new_sc.id
        return sc_ref_map, len(items)

    def _update_services_components(self, items: list[dict[str, Any]]) -> int:
        sc_update_schema = ServicesComponentUpdateSchema()
        for sc_data in items:
            sc_id = sc_data.get("id")
            if sc_id is None:
                raise ValidationError({"services_components.update": "Each item requires an 'id'."})
            data_to_load = {k: v for k, v in sc_data.items() if k != "id"}
            loaded = sc_update_schema.load(data_to_load, unknown=EXCLUDE, partial=True)
            self._scs.update(sc_id, loaded, commit=False)
        return len(items)

    def _delete_services_components(self, ids: list[int]) -> int:
        for sc_id in ids:
            self._scs.delete(sc_id, commit=False)
        return len(ids)

    # ------------------------------------------------------------------
    # Budget Line Items
    # ------------------------------------------------------------------

    def _create_budget_line_items(
        self, agreement: Agreement, items: list[dict[str, Any]], sc_ref_map: dict[str, int]
    ) -> int:
        # NestedBudgetLineItemRequestSchema converts string enums (status) to enum
        # values and supports services_component_ref. agreement_id is set by us.
        bli_create_schema = NestedBudgetLineItemRequestSchema()
        for bli_data in items:
            loaded = bli_create_schema.load(bli_data, unknown=EXCLUDE)
            # Strip None defaults so the model uses its column defaults rather than NULL.
            loaded = {k: v for k, v in loaded.items() if v is not None}
            services_component_ref = loaded.pop("services_component_ref", None)
            if services_component_ref is not None:
                if services_component_ref not in sc_ref_map:
                    raise ValidationError(
                        {
                            "services_component_ref": [
                                f"Invalid services_component_ref {services_component_ref!r}. "
                                f"Available references: {list(sc_ref_map.keys())}"
                            ]
                        }
                    )
                loaded["services_component_id"] = sc_ref_map[services_component_ref]
            loaded["agreement_id"] = agreement.id
            self._blis.create(loaded, commit=False)
        return len(items)

    def _update_budget_line_items(self, items: list[dict[str, Any]]) -> tuple[int, list[int]]:
        change_request_ids: list[int] = []
        patch_schema = PATCHRequestBodySchema(partial=True)
        for bli_data in items:
            bli_id = bli_data.get("id")
            if bli_id is None:
                raise ValidationError({"budget_line_items.update": "Each item requires an 'id'."})
            data_for_load = {k: v for k, v in bli_data.items() if k != "id"}
            loaded = patch_schema.load(data_for_load, unknown=EXCLUDE, partial=True)
            # The BLI service reads `request.json` and `schema.load(...)`; we synthesize
            # a request-like object with the per-BLI body so the service can run unchanged.
            fake_request = SimpleNamespace(json=data_for_load)
            updated_fields = loaded | {
                "method": "PATCH",
                "schema": patch_schema,
                "request": fake_request,
            }
            _, _, ids = self._blis.update_with_change_request_ids(
                bli_id, updated_fields, commit=False
            )
            change_request_ids.extend(ids)
        return len(items), change_request_ids

    def _delete_budget_line_items(self, ids: list[int]) -> int:
        for bli_id in ids:
            self._blis.delete(bli_id, commit=False)
        return len(ids)
