"""Service for "Edits That Require a Contract Modification" on the Award & Modifications tab.

Once an Agreement is Awarded, an approved money/time edit made in OPS (a "Modified Level of
Effort") still has to be carried into the actual contract via a Contract Modification. Each
such approved edit is recorded as a ``ContractModificationEdit`` and stays pending until the
user starts the modification (OPS-3072, AC9; the modification workflow itself is #3268).
"""

from typing import Optional

from flask import current_app
from flask_jwt_extended import get_current_user
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from models import (
    Agreement,
    AgreementMod,
    ChangeRequestStatus,
    ChangeRequestType,
    ContractModificationEdit,
    ModificationEditType,
)
from ops_api.ops.services.agreement_award_history import _SUPPORTED_AGREEMENT_TYPES
from ops_api.ops.services.ops_service import AuthorizationError, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.agreements_helpers import check_user_association


class ContractModificationEditService:
    def __init__(self, db_session=None):
        self.db_session = db_session or current_app.db_session

    def create_from_approved_change_request(self, change_request) -> Optional[ContractModificationEdit]:
        """Record an approved change request that requires a contract modification.

        Adds the row to the session without committing, so it commits (or rolls back)
        together with the change request approval. Must be called before an approved
        delete removes the budget line (and, by cascade, the change request).

        Returns None when the change request doesn't qualify.
        """
        if not current_app.config.get("ENABLE_MODIFIED_LOE_EDITS", False):
            return None
        if change_request.change_request_type not in (
            ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            ChangeRequestType.SERVICES_COMPONENT_CHANGE_REQUEST,
        ):
            return None
        if change_request.status != ChangeRequestStatus.APPROVED:
            return None
        # The snapshot already excludes status changes other than Draft->Planned.
        if not change_request.requires_contract_modification:
            return None

        # Each budget line change request carries exactly one field (add_bli_change_requests
        # creates one per field; a delete request carries the "delete" sentinel). A Services
        # Component request carries "services_component_create".
        field = next(iter(change_request.requested_change_data))
        diff = (change_request.requested_change_diff or {}).get(field, {})

        edit = ContractModificationEdit(
            agreement_id=change_request.agreement_id,
            modification_type=ModificationEditType.MODIFIED_LOE,
            change_request_id=change_request.id,
            budget_line_item_id=getattr(change_request, "budget_line_item_id", None),
            services_component_id=getattr(change_request, "services_component_id", None),
            field=field,
            old_value=diff.get("old"),
            new_value=diff.get("new"),
            requested_by_id=change_request.created_by,
            requested_on=change_request.created_on,
            approved_by_id=change_request.reviewed_by_id,
            approved_on=change_request.reviewed_on,
        )
        self.db_session.add(edit)
        return edit

    def get_pending_for_agreement(self, agreement_id: int) -> list[ContractModificationEdit]:
        """Return the agreement's edits not yet attached to a started modification, oldest first.

        Only the latest edit per (budget line, field) is returned, since the budget line's current
        value is what goes into the modification; a deleted budget line shows only its delete.
        Superseded rows are kept and still attach to the modification when it starts.
        """
        self._get_supported_agreement(agreement_id)
        pending = self.db_session.scalars(self._pending_query(agreement_id)).all()
        return self._latest_per_budget_line_field(pending)

    @staticmethod
    def _latest_per_budget_line_field(edits) -> list[ContractModificationEdit]:
        """Collapse oldest-first edits to the latest per (budget line, field), keeping list order."""
        latest = {}
        deleted = set()
        for edit in edits:
            # Services Component rows have no budget line, so they're keyed by SC instead;
            # otherwise two SC adds would collapse into one (OPS-6440).
            if edit.services_component_id is not None:
                target = ("sc", edit.services_component_id)
            else:
                target = ("bli", edit.budget_line_item_id)
            if edit.field == "delete":
                deleted.add(target)
            key = (target, edit.field)
            # re-insert so the edit sorts by its latest occurrence
            latest.pop(key, None)
            latest[key] = edit
        return [edit for (target, field), edit in latest.items() if not (target in deleted and field != "delete")]

    def attach_pending_edits_to_mod(self, agreement_id: int, agreement_mod_id: int, edit_ids: list[int]) -> int:
        """Attach the given pending edits on the agreement to the given modification.

        Only ``edit_ids`` are attached, so an edit approved after the caller read the pending
        list isn't swept into the modification without being reported. Does not commit.
        Returns the number of edits attached.
        """
        agreement_mod = self.db_session.get(AgreementMod, agreement_mod_id)
        if agreement_mod is None:
            raise ResourceNotFoundError("AgreementMod", agreement_mod_id)
        if agreement_mod.agreement_id != agreement_id:
            raise ValidationError({"agreement_mod_id": "The modification does not belong to this agreement."})

        result = self.db_session.execute(
            update(ContractModificationEdit)
            .where(
                ContractModificationEdit.id.in_(edit_ids),
                ContractModificationEdit.agreement_id == agreement_id,
                ContractModificationEdit.agreement_mod_id.is_(None),
            )
            .values(agreement_mod_id=agreement_mod_id)
            .execution_options(synchronize_session="fetch")
        )
        return result.rowcount

    def start_modification(self, agreement_id: int) -> tuple[AgreementMod, list[ContractModificationEdit]]:
        """Start a contract modification for the agreement's pending edits.

        Creates a bare ``AgreementMod`` and attaches every pending edit to it, removing them
        from the "Edits That Require a Contract Modification" list. Deliberately minimal:
        #3268 extends this with the ProcurementAction / procurement tracker for the mod.
        """
        if not current_app.config.get("ENABLE_MODIFIED_LOE_EDITS", False):
            raise ValidationError({"agreement_id": "Contract modifications are not enabled."})

        agreement = self._get_supported_agreement(agreement_id)

        user = get_current_user()
        if not (user.is_superuser or check_user_association(agreement, user)):
            raise AuthorizationError(
                f"User is not associated with the agreement {agreement_id}",
                "ContractModification",
            )

        if not agreement.is_awarded:
            raise ValidationError({"agreement_id": "Only an Awarded agreement can start a contract modification."})

        # Lock the pending rows so two concurrent starts can't both create a modification.
        pending = list(self.db_session.scalars(self._pending_query(agreement_id).with_for_update()).all())
        if not pending:
            raise ValidationError({"agreement_id": "There are no edits that require a contract modification."})

        agreement_mod = AgreementMod(agreement_id=agreement_id)
        self.db_session.add(agreement_mod)
        self.db_session.flush()

        self.attach_pending_edits_to_mod(agreement_id, agreement_mod.id, [edit.id for edit in pending])
        self.db_session.commit()

        for edit in pending:
            self.db_session.refresh(edit)
        # every pending row is attached, but report only the edits the list showed
        return agreement_mod, self._latest_per_budget_line_field(pending)

    def _get_supported_agreement(self, agreement_id: int) -> Agreement:
        agreement = self.db_session.get(Agreement, agreement_id)
        if agreement is None:
            raise ResourceNotFoundError("Agreement", agreement_id)
        if agreement.agreement_type not in _SUPPORTED_AGREEMENT_TYPES:
            raise ValidationError(
                {"agreement_type": "Contract modifications are only available for Contract and AA agreements."}
            )
        return agreement

    @staticmethod
    def _pending_query(agreement_id: int):
        return (
            select(ContractModificationEdit)
            .options(selectinload(ContractModificationEdit.requested_by))
            .where(
                ContractModificationEdit.agreement_id == agreement_id,
                ContractModificationEdit.agreement_mod_id.is_(None),
            )
            .order_by(ContractModificationEdit.requested_on, ContractModificationEdit.id)
        )
