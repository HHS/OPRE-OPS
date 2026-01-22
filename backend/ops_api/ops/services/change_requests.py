import copy
import json
from datetime import datetime
from typing import Any, Union

from flask import current_app
from flask_jwt_extended import current_user
from marshmallow.experimental.context import Context

from models import Agreement, BudgetLineItem, Division, NotificationType, OpsEventType
from models.change_requests import (
    AgreementChangeRequest,
    BudgetLineItemChangeRequest,
    ChangeRequest,
    ChangeRequestStatus,
    ChangeRequestType,
)
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
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
    get_division_for_budget_line_item,
    update_data,
)
from ops_api.ops.utils.change_requests_helpers import (
    build_approve_url,
    build_review_outcome_title_and_message,
    find_in_review_requests_by_user,
    get_model_class_by_type,
)
from ops_api.ops.utils.events import OpsEventHandler


class ChangeRequestService(OpsService[ChangeRequest]):
    def __init__(self, db_session):
        self.db_session = db_session
        self._notification_service = NotificationService(db_session)

    # --- CRUD Operations (Generic) ---

    def create(self, create_request: dict[str, Any]) -> ChangeRequest:
        request_type = create_request.get("change_request_type")
        if request_type is None:
            raise ValueError("Missing 'change_request_type' in request data")

        model_class = get_model_class_by_type(request_type)
        change_request = model_class(**create_request)
        self.db_session.add(change_request)
        self.db_session.commit()

        self._notify_division_reviewers(change_request)

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

        # Handle review action if present
        if action:
            result = self._handle_review_action(change_request, action, reviewer_notes)
            model_to_update = result.get("model_to_update")

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
        results = find_in_review_requests_by_user(
            int(reviewer_user_id),
            data.get("limit"),
            data.get("offset"),
        )

        return results, None

    # --- Review & Authorization Logic ---

    def _is_division_director_of_change_request(self, change_request) -> bool:
        current_user_id = current_user.id

        # AgreementChangeRequest: check via agreement's divisions
        if change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST:
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

        if change_request.status == ChangeRequestStatus.REJECTED:
            return {
                "model_to_update": None,
            }

        change_request.reviewed_by_id = current_user_id
        change_request.reviewed_on = datetime.now()
        change_request.reviewer_notes = reviewer_notes
        change_request.status = ChangeRequestStatus.APPROVED if action == "APPROVE" else ChangeRequestStatus.REJECTED

        model_to_update = None

        if change_request.status == ChangeRequestStatus.APPROVED:
            if change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST:
                model_to_update = self._apply_budget_line_item_changes(change_request)
            elif change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST:
                model_to_update = self._apply_agreement_changes(change_request)

        return {
            "model_to_update": model_to_update,
        }

    # --- Notification Handling ---

    def _notify_division_reviewers(
        self, change_request: Union[AgreementChangeRequest, BudgetLineItemChangeRequest]
    ) -> None:
        division_director_ids: set[int] = set()

        if change_request.change_request_type == ChangeRequestType.AGREEMENT_CHANGE_REQUEST:
            # Dynamically determine the managing division for the change request
            division_directors, deputy_division_directors = get_division_directors_for_agreement(
                change_request.agreement
            )
            division_director_ids.update(division_directors)
            division_director_ids.update(deputy_division_directors)

        elif change_request.change_request_type == ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST:
            # Use the managing_division_id directly from the change request
            if change_request.managing_division_id is None:
                raise ValueError("BudgetLineItemChangeRequest must have a managing_division_id set.")

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
    ) -> list[int]:
        """
        Creates one change request per changed field.
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

                change_request_data = {
                    "budget_line_item_id": bli_id,
                    "agreement_id": budget_line_item.agreement_id,  # Can update the class to capture agreement_id
                    "managing_division_id": (managing_division.id if managing_division else None),
                    "requested_change_data": requested_change_data,
                    "requested_change_diff": requested_change_diff,
                    "requested_change_info": {"target_display_name": budget_line_item.display_name},
                    "requestor_notes": requestor_notes,
                    "change_request_type": ChangeRequestType.BUDGET_LINE_ITEM_CHANGE_REQUEST,
                }

                change_request = self.create(change_request_data)
                change_request_ids.append(change_request.id)
                cr_meta.metadata.update({"bli_id": bli_id, "change_request": change_request.to_dict()})

        return change_request_ids

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
