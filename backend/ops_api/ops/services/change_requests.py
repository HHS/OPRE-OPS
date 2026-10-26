import copy
import json
from datetime import datetime
from typing import Any, Union

from flask import current_app
from flask_jwt_extended import current_user
from loguru import logger
from marshmallow.experimental.context import Context
from sqlalchemy import select

from models import (
    Agreement,
    BudgetLineItem,
    BudgetLineItemStatus,
    Division,
    NotificationType,
    OpsEventType,
    ServicesComponent,
)
from models.change_requests import (
    AgreementChangeRequest,
    BudgetLineItemChangeRequest,
    ChangeRequest,
    ChangeRequestStatus,
    ChangeRequestType,
    ServicesComponentChangeRequest,
)
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.services.contract_modification_edits import ContractModificationEditService
from ops_api.ops.services.notifications import NotificationService
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    OpsService,
    ResourceNotFoundError,
    ValidationError,
)
from ops_api.ops.utils.agreements_helpers import (
    get_division_directors_for_agreement,
    update_agreement,
)
from ops_api.ops.utils.api_helpers import validate_and_prepare_change_data
from ops_api.ops.utils.budget_line_items_helpers import (
    agreement_tracks_contract_modifications,
    get_division_for_budget_line_item,
    sc_requires_approval_gate,
    tracks_contract_modifications,
    update_data,
    validate_no_execution_status_change_on_awarded,
)
from ops_api.ops.utils.change_requests_helpers import (
    build_approve_url,
    build_review_outcome_title_and_message,
    find_in_review_requests_by_user,
    get_model_class_by_type,
)
from ops_api.ops.utils.events import OpsEventHandler


def _is_draft_to_planned(key: str, budget_line_item: BudgetLineItem, change_data: dict) -> bool:
    return (
        key == "status"
        and budget_line_item.status == BudgetLineItemStatus.DRAFT
        and change_data.get("status") == BudgetLineItemStatus.PLANNED
    )


# Change request types whose reviewers are resolved through the agreement (not a managing division).
_AGREEMENT_REVIEWED_TYPES = (
    ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
    ChangeRequestType.SERVICES_COMPONENT_CHANGE_REQUEST,
)


class ChangeRequestService(OpsService[ChangeRequest]):
    def __init__(self, db_session):
        self.db_session = db_session
        self._notification_service = NotificationService(db_session)

    # --- CRUD Operations (Generic) ---

    def create(self, create_request: dict[str, Any], commit: bool = True) -> ChangeRequest:
        """Create a change request.

        When ``commit`` is False, the change request is added (and flushed to assign id)
        but neither committed nor notified. The caller must commit and then call
        ``notify_division_reviewers`` for each deferred change request once the bundle
        commit succeeds. This avoids notifying reviewers about a transaction that ends up
        rolled back.
        """
        request_type = create_request.get("change_request_type")
        if request_type is None:
            raise ValueError("Missing 'change_request_type' in request data")

        model_class = get_model_class_by_type(request_type)
        change_request = model_class(**create_request)
        self.db_session.add(change_request)
        if commit:
            self.db_session.commit()
            self.notify_division_reviewers(change_request)
        else:
            self.db_session.flush()  # assigns the DB-sequence id without committing

        return change_request

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[ChangeRequest, int]:
        change_request = self.db_session.get(ChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("ChangeRequest", id)

        # Permission check
        if not self._is_division_director_of_change_request(change_request):
            raise AuthorizationError(
                "User is not authorized to review or update this change request.",
                "change_request",
            )

        action = updated_fields.pop("action", None)
        reviewer_notes = updated_fields.pop("reviewer_notes", None)

        model_to_update = None
        bli_to_delete = None
        services_component_to_delete = None

        # Handle review action if present
        if action:
            result = self._handle_review_action(change_request, action, reviewer_notes)
            model_to_update = result.get("model_to_update")
            bli_to_delete = result.get("bli_to_delete")
            services_component_to_delete = result.get("services_component_to_delete")

        # A budget line leaving a pending Services Component's approval (approved delete, or a
        # declined Draft->Planned) can leave the SC with nothing needing approval (OPS-6440).
        withdraw_check_sc_id = self._services_component_to_recheck(change_request)

        # Apply any direct field updates to the change request
        for key, value in updated_fields.items():
            if hasattr(change_request, key):
                setattr(change_request, key, value)

        # Apply related model (BLI or Agreement) update directly
        if model_to_update:
            model_to_update.acting_change_request_id = change_request.id
            self.db_session.add(model_to_update)

        self.db_session.commit()
        self._notify_submitter_of_review_outcome(change_request)

        # Deletion-on-approval must happen LAST. The change_request row has
        # budget_line_item_id ON DELETE CASCADE, so deleting the BLI removes the CR row too, yet the
        # resource still serializes the change request (via to_dict()) after this returns. We:
        #   1. finalize the CR (status/reviewed fields above) and notify the submitter — done while
        #      the CR row still exists;
        #   2. capture the CR's full serialized form NOW, while it is still attached, so every
        #      relationship the auto-schema touches (agreement, managing_division, and the
        #      continuum-injected lazy="dynamic" ``versions``) serializes correctly;
        #   3. detach (expunge) the CR so the final commit can neither expire nor cascade-refresh it;
        #   4. delete the BLI last, and pin the CR's to_dict() to the captured snapshot so the
        #      resource never re-serializes a detached/cascade-deleted instance.
        # The durable record of the deletion is the AgreementHistory + automatic OpsDBHistory trail.
        if bli_to_delete is not None:
            snapshot = change_request.to_dict()
            self.db_session.expunge(change_request)
            self.db_session.delete(bli_to_delete)
            self.db_session.commit()
            change_request.to_dict = lambda: snapshot

        # Removing the SC (approved delete, declined add) also happens after the CR is finalized.
        # change_request.services_component_id is SET NULL, so the CR keeps its history.
        if services_component_to_delete is not None:
            self._delete_reviewed_services_component(services_component_to_delete)

        if withdraw_check_sc_id is not None:
            self.withdraw_services_component_add_if_unneeded(withdraw_check_sc_id)

        return change_request, 200

    def delete(self, id: int) -> None:
        change_request = self.db_session.get(ChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("ChangeRequest", id)

        self.db_session.delete(change_request)
        self.db_session.commit()

    def get(self, id: int) -> ChangeRequest:
        change_request = self.db_session.get(ChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("ChangeRequest", id)
        return change_request

    def get_list(self, data: dict | None = None) -> tuple[list[ChangeRequest], dict | None]:
        reviewer_user_id = data.get("reviewer_user_id")
        if not reviewer_user_id:
            raise ValidationError({"reviewer_user_id": "This field is required."})
        # Get in review users, provide default limit of 10 and offset of 0
        page, total_count = find_in_review_requests_by_user(
            int(reviewer_user_id),
            data.get("limit", 10),
            data.get("offset", 0),
        )

        return page, {"count": total_count, "limit": data.get("limit"), "offset": data.get("offset")}

    # --- Review & Authorization Logic ---

    def _is_division_director_of_change_request(self, change_request) -> bool:
        current_user_id = current_user.id

        # AgreementChangeRequest / ServicesComponentChangeRequest: check via agreement's divisions
        if change_request.change_request_type in _AGREEMENT_REVIEWED_TYPES:
            if not change_request.agreement:
                return False
            directors, deputies = get_division_directors_for_agreement(change_request.agreement)
            return current_user_id in directors or current_user_id in deputies

        # BudgetLineItemChangeRequest: check managing_division_id
        if change_request.managing_division_id:
            division: Division = self.db_session.get(Division, change_request.managing_division_id)
            if division is None:
                return False
            return (
                division.division_director_id == current_user_id
                or division.deputy_division_director_id == current_user_id
            )

        return False

    def _handle_review_action(
        self, change_request: ChangeRequest, action: str, reviewer_notes: str | None
    ) -> dict[str, Any]:
        current_user_id = current_user.id
        action = action.upper()

        if action not in ("APPROVE", "REJECT"):
            raise ValueError(f"Invalid action: {action}")

        # To prevent double-reviewing
        if change_request.status in (
            ChangeRequestStatus.APPROVED,
            ChangeRequestStatus.REJECTED,
        ):
            raise ValidationError({"change_request": "This change request has already been reviewed."})

        # A Planned->Executing request submitted before the agreement was awarded can't be
        # approved once it is: executing on an Awarded agreement requires a Contract Modification.
        # Checked before the change request is marked reviewed so a rejected approval leaves it pending.
        if (
            action == "APPROVE"
            and change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST
            and change_request.has_status_change
        ):
            validate_no_execution_status_change_on_awarded(
                change_request.budget_line_item, change_request.requested_change_data["status"]
            )

        if change_request.status == ChangeRequestStatus.REJECTED:
            return {
                "model_to_update": None,
            }

        change_request.reviewed_by_id = current_user_id
        change_request.reviewed_on = datetime.now()
        change_request.reviewer_notes = reviewer_notes
        change_request.status = ChangeRequestStatus.APPROVED if action == "APPROVE" else ChangeRequestStatus.REJECTED

        model_to_update = None
        bli_to_delete = None
        services_component_to_delete = None

        if change_request.change_request_type == ChangeRequestType.SERVICES_COMPONENT_CHANGE_REQUEST:
            services_component_to_delete = self._apply_services_component_review(change_request)
        elif change_request.status == ChangeRequestStatus.APPROVED:
            if change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST:
                # On an Awarded agreement, track the approved edit as requiring a contract
                # modification (OPS-3072). Recorded before the BLI is changed or deleted, while
                # the change request still exists, so it lands in the same commit.
                ContractModificationEditService(self.db_session).create_from_approved_change_request(change_request)
                if getattr(change_request, "has_delete_change", False):
                    # A deletion request: don't re-add the BLI (model_to_update stays None).
                    # The BLI is deleted last in update(), after the CR is finalized — see the
                    # ordering note there.
                    bli_to_delete = self.db_session.get(BudgetLineItem, change_request.budget_line_item_id)
                else:
                    model_to_update = self._apply_budget_line_item_changes(change_request)
            elif change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST:
                model_to_update = self._apply_agreement_changes(change_request)

        return {
            "model_to_update": model_to_update,
            "bli_to_delete": bli_to_delete,
            "services_component_to_delete": services_component_to_delete,
        }

    # --- Notification Handling ---

    def notify_division_reviewers(
        self,
        change_request: Union[AgreementChangeRequest, BudgetLineItemChangeRequest, ServicesComponentChangeRequest],
    ) -> None:
        division_director_ids: set[int] = set()

        if change_request.change_request_type in _AGREEMENT_REVIEWED_TYPES:
            # Dynamically determine the managing division for the change request
            division_directors, deputy_division_directors = get_division_directors_for_agreement(
                change_request.agreement
            )
            division_director_ids.update(division_directors)
            division_director_ids.update(deputy_division_directors)

        elif change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST:
            # Use the managing_division_id directly from the change request
            if change_request.managing_division_id is None:
                logger.warning(
                    f"BudgetLineItemChangeRequest {change_request.id} has no managing_division_id — "
                    "no director notification sent."
                )
                return

            division: Division = self.db_session.get(Division, change_request.managing_division_id)
            if not division:
                raise ValueError(f"Division with ID {change_request.managing_division_id} not found.")

            if division.division_director_id:
                division_director_ids.add(division.division_director_id)
            if division.deputy_division_director_id:
                division_director_ids.add(division.deputy_division_director_id)
        else:
            raise TypeError(f"Unsupported change request type: {type(change_request)}")

        fe_url = current_app.config.get("OPS_FRONTEND_URL")
        approve_url = build_approve_url(change_request, change_request.agreement_id, fe_url)

        message = (
            f"An Agreement Approval Request has been submitted. "
            f"Please review and approve. \n\\\n\\\n[Link]({approve_url})"
        )

        for division_director_id in division_director_ids:
            self._notification_service.create(
                {
                    "change_request_id": change_request.id,
                    "title": "Approval Request",
                    "message": message,
                    "is_read": False,
                    "recipient_id": division_director_id,
                    "notification_type": NotificationType.CHANGE_REQUEST_NOTIFICATION,
                }
            )

    def _notify_submitter_of_review_outcome(self, change_request: ChangeRequest) -> None:
        title, message = build_review_outcome_title_and_message(change_request)

        if not title or not message:
            return  # Skip notification if content is missing

        self._notification_service.create(
            {
                "change_request_id": change_request.id,
                "title": title,
                "message": message,
                "is_read": False,
                "recipient_id": change_request.created_by,
                "notification_type": NotificationType.CHANGE_REQUEST_NOTIFICATION,
            }
        )

    # --- BudgetLineItem-specific Operations ---

    def add_bli_change_requests(
        self,
        bli_id,
        budget_line_item,
        changing_from_data,
        change_data,
        changed_budget_or_status_prop_keys,
        requestor_notes,
        commit: bool = True,
    ) -> list[int]:
        """
        Creates one change request per changed field.

        When ``commit`` is False, change requests are created without committing or
        notifying division reviewers. Callers are responsible for committing and
        notifying after the surrounding transaction succeeds.
        """
        change_request_ids = []

        for key in changed_budget_or_status_prop_keys:
            with OpsEventHandler(OpsEventType.CREATE_CHANGE_REQUEST) as cr_meta:
                change_keys = [key]
                schema = PATCHRequestBodySchema(only=change_keys)
                requested_change_data = schema.dump(change_data)
                old_values = schema.dump(changing_from_data)
                requested_change_diff = {
                    key: {
                        "new": requested_change_data.get(key, None),
                        "old": old_values.get(key, None),
                    }
                    for key in change_keys
                }

                managing_division = get_division_for_budget_line_item(bli_id)

                # If the BLI has no CAN yet (null can_id in DB) but we're changing it,
                # resolve the division from the incoming can_id so the director is notified.
                if managing_division is None and change_data.get("can_id"):
                    from models import CAN

                    new_can = self.db_session.get(CAN, change_data["can_id"])
                    if new_can and new_can.portfolio and new_can.portfolio.division:
                        managing_division = new_can.portfolio.division

                if managing_division is None:
                    # Cannot create a change request without a managing division — no director
                    # would be able to approve or reject it, leaving the BLI permanently locked.
                    # This happens when a PLANNED/IN_EXECUTION BLI has no CAN assigned and no
                    # incoming can_id in the change. The COR must assign a CAN first.
                    raise ValidationError(
                        {
                            "can_id": (
                                "A CAN must be assigned to this budget line before financial changes "
                                "can be submitted for approval."
                            )
                        }
                    )

                change_request_data = {
                    "budget_line_item_id": bli_id,
                    "agreement_id": budget_line_item.agreement_id,  # Can update the class to capture agreement_id
                    "managing_division_id": managing_division.id,
                    "requested_change_data": requested_change_data,
                    "requested_change_diff": requested_change_diff,
                    "requested_change_info": {
                        "target_display_name": budget_line_item.display_name,
                        # Snapshot (OPS-3072): money/time edits and Draft->Planned count; other
                        # status changes don't (Planned->Executing is blocked on awarded agreements).
                        "requires_contract_modification": (
                            key in BudgetLineItemChangeRequest.budget_field_names
                            or _is_draft_to_planned(key, budget_line_item, change_data)
                        )
                        and tracks_contract_modifications(budget_line_item),
                    },
                    "requestor_notes": requestor_notes,
                    "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
                }

                change_request = self.create(change_request_data, commit=commit)
                change_request_ids.append(change_request.id)
                cr_meta.metadata.update({"bli_id": bli_id, "change_request": change_request.to_dict()})

            # A Draft budget line on a pending Services Component going to Planned makes the SC
            # need approval too, so its add request goes in alongside (OPS-6440).
            if _is_draft_to_planned(key, budget_line_item, change_data):
                sc_change_request_id = self.ensure_services_component_add_change_request(
                    budget_line_item.services_component, commit=commit, pending_planned=True
                )
                if sc_change_request_id is not None:
                    change_request_ids.append(sc_change_request_id)

        return change_request_ids

    def add_bli_delete_change_request(self, budget_line_item: BudgetLineItem, commit: bool = True) -> int:
        """
        Create a single change request representing a request to delete a budget line item.

        The request is marked with a ``{"delete": True}`` sentinel in ``requested_change_data``;
        the ``requested_change_diff`` carries the current amount (so the reviewer card can show it
        as currency) against the literal "Deleted".

        When ``commit`` is False, the change request is created without committing or notifying
        division reviewers (mirrors ``add_bli_change_requests``). The caller owns the surrounding
        transaction and must commit and then call ``notify_division_reviewers`` for the returned id
        once that commit succeeds. Used by the atomic edit-bundle flow.
        """
        with OpsEventHandler(OpsEventType.CREATE_CHANGE_REQUEST) as cr_meta:
            managing_division = get_division_for_budget_line_item(budget_line_item.id)

            # amount is a Decimal; store it as a JSON-native float so the diff serializes to JSONB
            # (and the frontend formats it as currency), mirroring the amount diff in edit CRs.
            old_amount = float(budget_line_item.amount) if budget_line_item.amount is not None else None

            change_request_data = {
                "budget_line_item_id": budget_line_item.id,
                "agreement_id": budget_line_item.agreement_id,
                "managing_division_id": (managing_division.id if managing_division else None),
                "requested_change_data": {"delete": True},
                "requested_change_diff": {"delete": {"old": old_amount, "new": "Deleted"}},
                "requested_change_info": {
                    "target_display_name": budget_line_item.display_name,
                    "requires_contract_modification": tracks_contract_modifications(budget_line_item),
                },
                "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            }

            change_request = self.create(change_request_data, commit=commit)
            cr_meta.metadata.update({"bli_id": budget_line_item.id, "change_request": change_request.to_dict()})
            return change_request.id

    def _apply_budget_line_item_changes(self, change_request: BudgetLineItemChangeRequest) -> BudgetLineItem:
        budget_line_item = self.db_session.get(BudgetLineItem, change_request.budget_line_item_id)
        if not budget_line_item:
            raise ResourceNotFoundError("BudgetLineItem", change_request.budget_line_item_id)

        data = copy.deepcopy(change_request.requested_change_data)
        schema = PATCHRequestBodySchema()
        with Context({"method": "PATCH", "id": change_request.budget_line_item_id}):
            change_data, _ = validate_and_prepare_change_data(
                data,
                budget_line_item,
                schema,
                ["id", "agreement_id"],
                partial=False,
            )

        update_data(budget_line_item, change_data)
        return budget_line_item

    # --- Agreement-specific Operations ---

    def _apply_agreement_changes(self, change_request: AgreementChangeRequest) -> Agreement:
        agreement = self.db_session.get(Agreement, change_request.agreement_id)
        if not agreement:
            raise ResourceNotFoundError("Agreement", change_request.agreement_id)

        # full JSON roundtrip to convert any SQLAlchemy JSONB types to plain dict
        data = json.loads(json.dumps(copy.deepcopy(change_request.requested_change_data)))

        update_agreement(agreement, data)
        return agreement

    # --- ServicesComponent-specific Operations (OPS-6440) ---

    def add_services_component_create_change_request(
        self, services_component: ServicesComponent, commit: bool = True
    ) -> int:
        """Request approval to add a Services Component on an Awarded agreement.

        The SC row already exists (so budget lines can point at it); approval clears its
        ``awaiting_add_approval`` flag, and a decline removes it. ``commit=False`` follows
        ``add_bli_change_requests``: no commit and no notification.
        """
        return self._add_services_component_change_request(
            services_component,
            ServicesComponentChangeRequest.create_field_name,
            {"old": None, "new": services_component.display_name},
            commit,
        )

    def add_services_component_delete_change_request(
        self, services_component: ServicesComponent, commit: bool = True
    ) -> int:
        """Request approval to delete a Services Component on an Awarded agreement.

        The SC and its budget line links stay until approval; an approved delete removes the
        SC and its budget lines lose their SC (``SET NULL``).
        """
        return self._add_services_component_change_request(
            services_component,
            ServicesComponentChangeRequest.delete_field_name,
            {"old": services_component.display_name, "new": "Deleted"},
            commit,
        )

    def _add_services_component_change_request(
        self, services_component: ServicesComponent, field: str, diff: dict, commit: bool
    ) -> int:
        with OpsEventHandler(OpsEventType.CREATE_CHANGE_REQUEST) as cr_meta:
            change_request_data = {
                "services_component_id": services_component.id,
                "agreement_id": services_component.agreement_id,
                "requested_change_data": {field: True},
                # Display names are frozen here so history survives the SC being removed.
                "requested_change_diff": {field: diff},
                "requested_change_info": {
                    "target_display_name": services_component.display_name,
                    "requires_contract_modification": agreement_tracks_contract_modifications(
                        services_component.agreement
                    ),
                    "linked_budget_line_item_ids": self._linked_budget_line_item_ids(services_component.id),
                },
                "change_request_type": ChangeRequestType.SERVICES_COMPONENT_CHANGE_REQUEST,
            }

            change_request = self.create(change_request_data, commit=commit)
            cr_meta.metadata.update(
                {"services_component_id": services_component.id, "change_request": change_request.to_dict()}
            )
            return change_request.id

    def ensure_services_component_add_change_request(
        self, services_component: ServicesComponent, commit: bool = True, pending_planned: bool = False
    ) -> int | None:
        """Create the add change request for a pending SC once it needs approval.

        A pending SC (``awaiting_add_approval``) needs approval once it has a non-Draft budget
        line, or when ``pending_planned`` says a Draft->Planned request was just made for one of
        its budget lines. Idempotent: if an add request is already in review, only its linked
        budget line ids are refreshed. Returns the new change request id, or None.
        """
        if services_component is None or not services_component.awaiting_add_approval:
            return None
        if not sc_requires_approval_gate(services_component.agreement):
            # A superuser (or a flag/award change) applies the addition directly once it has a
            # non-Draft budget line, so the SC isn't left pending with no request.
            if services_component.has_non_draft_budget_lines and (
                self._in_review_services_component_create_change_request(services_component.id) is None
            ):
                services_component.awaiting_add_approval = False
                if commit:
                    self.db_session.commit()
                else:
                    self.db_session.flush()
            return None

        existing = self._in_review_services_component_create_change_request(services_component.id)
        if existing is not None:
            info = dict(existing.requested_change_info or {})
            info["linked_budget_line_item_ids"] = self._linked_budget_line_item_ids(services_component.id)
            existing.requested_change_info = info
            if commit:
                self.db_session.commit()
            return None

        if not (pending_planned or services_component.has_non_draft_budget_lines):
            return None
        return self.add_services_component_create_change_request(services_component, commit=commit)

    def withdraw_services_component_add_if_unneeded(self, services_component_id: int, commit: bool = True) -> bool:
        """Withdraw a pending SC's add change request once nothing on it needs approval.

        That's when the SC has no non-Draft budget lines and none of its budget lines has a
        Draft->Planned request in review. The change request is deleted (its notifications
        cascade) and the SC goes back to its pre-approval state: ``awaiting_add_approval`` with
        no change request. Returns True if a request was withdrawn.
        """
        services_component = self.db_session.get(ServicesComponent, services_component_id)
        if services_component is None:
            return False
        change_request = self._in_review_services_component_create_change_request(services_component_id)
        if change_request is None:
            return False
        if services_component.has_non_draft_budget_lines:
            return False
        pending_status_change = self.db_session.scalar(
            select(BudgetLineItemChangeRequest.id)
            .join(BudgetLineItem, BudgetLineItem.id == BudgetLineItemChangeRequest.budget_line_item_id)
            .where(
                BudgetLineItemChangeRequest.in_review_filter(),
                BudgetLineItemChangeRequest.has_status_change,
                BudgetLineItem.services_component_id == services_component_id,
            )
            .limit(1)
        )
        if pending_status_change is not None:
            return False

        with OpsEventHandler(OpsEventType.DELETE_CHANGE_REQUEST) as meta:
            meta.metadata.update({"change_request": change_request.to_dict(), "withdrawn": True})
            self.db_session.delete(change_request)
            if commit:
                self.db_session.commit()
            else:
                self.db_session.flush()
        return True

    def _in_review_services_component_create_change_request(
        self, services_component_id: int
    ) -> ServicesComponentChangeRequest | None:
        return self.db_session.scalar(
            select(ServicesComponentChangeRequest).where(
                ServicesComponentChangeRequest.in_review_filter(),
                ServicesComponentChangeRequest.is_services_component_create,
                ServicesComponentChangeRequest.services_component_id == services_component_id,
            )
        )

    def _linked_budget_line_item_ids(self, services_component_id: int) -> list[int]:
        return list(
            self.db_session.scalars(
                select(BudgetLineItem.id)
                .where(BudgetLineItem.services_component_id == services_component_id)
                .order_by(BudgetLineItem.id)
            )
        )

    def _apply_services_component_review(
        self, change_request: ServicesComponentChangeRequest
    ) -> ServicesComponent | None:
        """Apply a reviewed SC change request. Returns the SC to delete last, if any.

        Approved add: the SC becomes a normal SC. Declined add: the SC is removed.
        Approved delete: the SC is removed. Declined delete: nothing changes.
        """
        services_component = self.db_session.get(ServicesComponent, change_request.services_component_id)
        if services_component is None:
            return None

        approved = change_request.status == ChangeRequestStatus.APPROVED
        if approved:
            # Recorded before the SC is removed, while the change request still points at it.
            ContractModificationEditService(self.db_session).create_from_approved_change_request(change_request)

        if change_request.is_services_component_create:
            if approved:
                services_component.awaiting_add_approval = False
                return None
            return services_component
        return services_component if approved else None

    def _delete_reviewed_services_component(self, services_component: ServicesComponent) -> None:
        """Delete an SC removed by review, recording the usual "Services Component Deleted" history."""
        with OpsEventHandler(OpsEventType.DELETE_SERVICES_COMPONENT) as meta:
            meta.metadata.update({"service_component": services_component.to_dict()})
            self.db_session.delete(services_component)
            self.db_session.commit()

    @staticmethod
    def _services_component_to_recheck(change_request: ChangeRequest) -> int | None:
        """The SC whose pending add may no longer need approval after this budget line review."""
        if change_request.change_request_type != ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST:
            return None
        budget_line_item = change_request.budget_line_item
        if budget_line_item is None or budget_line_item.services_component_id is None:
            return None
        approved_delete = change_request.status == ChangeRequestStatus.APPROVED and change_request.has_delete_change
        declined_status_change = (
            change_request.status == ChangeRequestStatus.REJECTED and change_request.has_status_change
        )
        if approved_delete or declined_status_change:
            return budget_line_item.services_component_id
        return None
