import copy
from datetime import datetime
from typing import Any

from flask import current_app
from flask_jwt_extended import current_user
from sqlalchemy import or_, select

from marshmallow.experimental.context import Context
from models import BudgetLineItem, Division, NotificationType, OpsEventType
from models.change_requests import (
    AgreementChangeRequest,
    BudgetLineItemChangeRequest,
    ChangeRequest,
    ChangeRequestStatus,
    ChangeRequestType,
)
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.services.notifications import NotificationService
from ops_api.ops.services.ops_service import AuthorizationError, OpsService, ResourceNotFoundError
from ops_api.ops.utils import procurement_tracker_helper
from ops_api.ops.utils.api_helpers import validate_and_prepare_change_data
from ops_api.ops.utils.budget_line_items_helpers import (
    convert_BLI_status_name_to_pretty_string,
    get_division_for_budget_line_item,
    update_data,
)
from ops_api.ops.utils.change_requests_helpers import build_approve_url, get_model_class_by_type
from ops_api.ops.utils.events import OpsEventHandler


class ChangeRequestService(OpsService[ChangeRequest]):
    def __init__(self, db_session):
        self.db_session = db_session
        self._notification_service = NotificationService(db_session)

    # --- CRUD Operations (Generic) ---

    def create(self, create_request: dict[str, Any]) -> ChangeRequest:
        with OpsEventHandler(OpsEventType.CREATE_CHANGE_REQUEST) as meta:

            request_type = create_request.get("change_request_type")
            if request_type is None:
                raise ValueError("Missing 'change_request_type' in request data")

            model_class = get_model_class_by_type(request_type)
            change_request = model_class(**create_request)
            self.db_session.add(change_request)
            self.db_session.commit()
            meta.metadata.update({"New Change Request": change_request.to_dict()})

            self._notify_division_reviewers(change_request)

            return change_request

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[ChangeRequest, int]:
        change_request = self.db_session.get(ChangeRequest, id)
        if not change_request:
            raise ResourceNotFoundError("ChangeRequest", id)

        # Permission check
        if not self._is_division_director_of_change_request(change_request.id):
            raise AuthorizationError(
                "User is not authorized to review or update this change request.", "change_request"
            )

        action = updated_fields.pop("action", None)
        reviewer_notes = updated_fields.pop("reviewer_notes", None)

        # Handle actions
        if action:
            self._handle_review_action(change_request, action, reviewer_notes)

        for key, value in updated_fields.items():
            if hasattr(change_request, key):
                setattr(change_request, key, value)

        self.db_session.add(change_request)
        self.db_session.commit()
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
        results = self._find_change_requests(
            data.get("reviewer_user_id"),
            data.get("limit"),
            data.get("offset"),
        )

        return results, None

    # --- Review & Authorization Logic ---

    def _is_division_director_of_change_request(self, change_request_id) -> bool:
        current_user_id = current_user.id
        if change_request_id is None:
            return False
        change_request: ChangeRequest = self.db_session.get(ChangeRequest, change_request_id)
        if not change_request or not change_request.managing_division_id:
            return False
        division: Division = self.db_session.get(Division, change_request.managing_division_id)
        if division is None:
            return False
        return (
            division.division_director_id == current_user_id or division.deputy_division_director_id == current_user_id
        )

    def _handle_review_action(self, change_request: ChangeRequest, action: str, reviewer_notes: str | None) -> None:
        current_user_id = current_user.id
        action = action.upper()

        if action not in ("APPROVE", "REJECT"):
            raise ValueError(f"Invalid action: {action}")

        change_request.reviewed_by_id = current_user_id
        change_request.reviewed_on = datetime.now()
        change_request.reviewer_notes = reviewer_notes

        if action == "APPROVE":
            change_request.status = ChangeRequestStatus.APPROVED
        else:
            change_request.status = ChangeRequestStatus.REJECTED

        should_create_tracker = False

        if change_request.status == ChangeRequestStatus.APPROVED and isinstance(
            change_request, BudgetLineItemChangeRequest
        ):
            should_create_tracker = self._apply_budget_line_item_changes(change_request)

        # create_notification_of_reviews_request_to_submitter(change_request)
        self._notify_submitter_of_review_outcome(change_request)

        if should_create_tracker:
            procurement_tracker_helper.create_procurement_tracker(change_request.agreement_id)

    # --- Notification Handling ---

    def _notify_division_reviewers(self, change_request):
        if isinstance(change_request, AgreementChangeRequest):
            return  # we only have messages here for Agreement related change requests for now

        agreement_id = change_request.agreement_id

        division_director_ids = set()
        division: Division = self.db_session.get(Division, change_request.managing_division_id)
        if division.division_director_id:
            division_director_ids.add(division.division_director_id)
        if division.deputy_division_director_id:
            division_director_ids.add(division.deputy_division_director_id)

        fe_url = current_app.config.get("OPS_FRONTEND_URL")
        approve_url = build_approve_url(change_request, agreement_id, fe_url)

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
        if not isinstance(change_request, BudgetLineItemChangeRequest):
            return  # we only have messages here for BLI change requests for now

        title = f"Budget Change Request {change_request.status.name}"
        message = f"Your budget change request has been {change_request.status.name}."

        if change_request.has_status_change:
            status_diff = change_request.requested_change_diff["status"]
            new_status = convert_BLI_status_name_to_pretty_string(status_diff["new"])
            old_status = convert_BLI_status_name_to_pretty_string(status_diff["old"])

            if change_request.status == ChangeRequestStatus.APPROVED:
                title = f"Budget Lines Approved from {old_status} to {new_status} Status"
                message = (
                    f"The status change you sent to your Division Director were approved "
                    f"from {old_status} to {new_status} status. "
                )
            elif change_request.status == ChangeRequestStatus.REJECTED:
                title = (f"Budget Lines Declined from {old_status} to {new_status} Status",)
                message = (
                    f"The budget lines you sent to your Division Director were declined "
                    f"from {old_status} to {new_status} status. "
                )
            else:
                return  # unknown status; skip notification

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
    ) -> list[int]:
        """
        Creates one change request per changed field.
        """
        change_request_ids = []

        for key in changed_budget_or_status_prop_keys:
            change_keys = [key]
            schema = PATCHRequestBodySchema(only=change_keys)
            requested_change_data = schema.dump(change_data)
            old_values = schema.dump(changing_from_data)
            requested_change_diff = {
                key: {"new": requested_change_data.get(key, None), "old": old_values.get(key, None)}
                for key in change_keys
            }

            managing_division = get_division_for_budget_line_item(bli_id)

            change_request_data = {
                "budget_line_item_id": bli_id,
                "agreement_id": budget_line_item.agreement_id,  # Can update the class to capture agreement_id
                "managing_division_id": managing_division.id if managing_division else None,
                "requested_change_data": requested_change_data,
                "requested_change_diff": requested_change_diff,
                "requested_change_info": {"target_display_name": budget_line_item.display_name},
                "requestor_notes": requestor_notes,
                "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
            }

            change_request = self.create(change_request_data)
            change_request_ids.append(change_request.id)

        return change_request_ids

    def _apply_budget_line_item_changes(self, change_request: BudgetLineItemChangeRequest) -> bool:
        budget_line_item = self.db_session.get(BudgetLineItem, change_request.budget_line_item_id)

        is_exec_transition = (
            change_request.has_status_change and change_request.requested_change_data.get("status") == "IN_EXECUTION"
        )

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
        budget_line_item.acting_change_request_id = change_request.id
        self.db_session.add(budget_line_item)

        return is_exec_transition

    # --- Query Helpers ---

    # TODO: add more query options, for now this just returns CRs in review for
    #  the current user as a division director or deputy division director
    def _find_change_requests(self, user_id, limit: int = 10, offset: int = 0):
        stmt = (
            select(ChangeRequest)
            .join(Division, ChangeRequest.managing_division_id == Division.id)
            .where(ChangeRequest.status == ChangeRequestStatus.IN_REVIEW)
        )
        if user_id:
            stmt = stmt.where(
                or_(
                    Division.division_director_id == user_id,
                    Division.deputy_division_director_id == user_id,
                )
            )
        stmt = stmt.limit(limit).offset(offset)

        return [row for (row,) in self.db_session.execute(stmt).all()]
