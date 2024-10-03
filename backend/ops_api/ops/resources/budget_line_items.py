from __future__ import annotations

from typing import Optional

from flask import Response, current_app, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import inspect, select
from sqlalchemy.exc import SQLAlchemyError
from typing_extensions import Any

from models import (
    CAN,
    BaseModel,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    Division,
    OpsEventType,
    Portfolio,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.budget_line_items import (
    BudgetLineItemResponseSchema,
    PATCHRequestBodySchema,
    POSTRequestBodySchema,
    QueryParametersSchema,
)
from ops_api.ops.utils.api_helpers import convert_date_strings_to_dates, validate_and_prepare_change_data
from ops_api.ops.utils.change_requests import create_notification_of_new_request_to_reviewer
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers

ENDPOINT_STRING = "/budget-line-items"


def get_division_for_budget_line_item(bli_id: int) -> Optional[Division]:
    division = (
        current_app.db_session.query(Division)
        .join(Portfolio, Division.id == Portfolio.division_id)
        .join(CAN, Portfolio.id == CAN.portfolio_id)
        .join(BudgetLineItem, CAN.id == BudgetLineItem.can_id)
        .filter(BudgetLineItem.id == bli_id)
        .one_or_none()
    )
    return division


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = BudgetLineItemResponseSchema()
        self._put_schema = POSTRequestBodySchema()
        self._patch_schema = PATCHRequestBodySchema()

    def bli_associated_with_agreement(self, id: int, permission_type: PermissionType) -> bool:
        jwt_identity = get_jwt_identity()
        budget_line_item: BudgetLineItem = current_app.db_session.get(BudgetLineItem, id)
        try:
            agreement = budget_line_item.agreement
        except AttributeError as e:
            # No BLI found in the DB. Erroring out.
            raise ExtraCheckError({}) from e

        if agreement is None:
            # We are faking a validation check at this point. We know there is no agreement associated with the BLI.
            # This is made to emulate the validation check from a marshmallow schema.
            if permission_type == PermissionType.PUT:
                raise ExtraCheckError(
                    {
                        "_schema": ["BLI must have an Agreement when status is not DRAFT"],
                        "agreement_id": ["Missing data for required field."],
                    }
                )
            elif permission_type == PermissionType.PATCH:
                raise ExtraCheckError({"_schema": ["BLI must have an Agreement when status is not DRAFT"]})
            else:
                raise ExtraCheckError({})

        oidc_ids = set()
        if agreement.created_by_user:
            oidc_ids.add(str(agreement.created_by_user.oidc_id))
        if agreement.project_officer:
            oidc_ids.add(str(agreement.project_officer.oidc_id))
        oidc_ids |= set(str(tm.oidc_id) for tm in agreement.team_members)

        ret = jwt_identity in oidc_ids

        return ret

    def _get_item_with_try(self, id: int) -> Response:
        try:
            item = self._get_item(id)

            if item:
                response = make_response_with_headers(self._response_schema.dump(item))
            else:
                response = make_response_with_headers({}, 404)
        except SQLAlchemyError as se:
            current_app.logger.error(se)
            response = make_response_with_headers({}, 500)

        return response

    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)

        return response

    def _update(self, id, method, schema) -> Response:
        message_prefix = f"{method} to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
            schema.context["id"] = id
            schema.context["method"] = method

            # determine if the BLI is in an editable state or one that supports change requests (requires approval)

            budget_line_item = current_app.db_session.get(BudgetLineItem, id)
            if not budget_line_item:
                return make_response_with_headers({}, 400)  # should this return 404, tests currently expect 400
            editable = budget_line_item.status in [
                BudgetLineItemStatus.DRAFT,
                BudgetLineItemStatus.PLANNED,
                BudgetLineItemStatus.IN_EXECUTION,
            ]

            # if the BLI is in review, it cannot be edited
            if budget_line_item.in_review:
                editable = False

            # 403: forbidden to edit
            if not editable:
                return make_response_with_headers({"message": "This BLI cannot be edited"}, 403)

            # pull out requestor_notes from BLI data for change requests
            request_data = request.json
            requestor_notes = request_data.pop("requestor_notes", None)

            # validate and normalize the request data
            change_data, changing_from_data = validate_and_prepare_change_data(
                request_data,
                budget_line_item,
                schema,
                ["id", "agreement_id"],
                partial=False,
            )

            has_status_change = "status" in change_data
            has_non_status_change = len(change_data) > 1 if has_status_change else len(change_data) > 0

            # determine if it can be edited directly or if a change request is required
            directly_editable = not has_status_change and budget_line_item.status in [BudgetLineItemStatus.DRAFT]

            # Status changes are not allowed with other changes
            if has_status_change and has_non_status_change:
                return make_response_with_headers(
                    {"message": "When the status is changing other edits are not allowed"}, 400
                )

            changed_budget_or_status_prop_keys = list(
                set(change_data.keys()) & (set(BudgetLineItemChangeRequest.budget_field_names + ["status"]))
            )
            other_changed_prop_keys = list(set(change_data.keys()) - set(changed_budget_or_status_prop_keys))

            direct_change_data = {
                key: value for key, value in change_data.items() if directly_editable or key in other_changed_prop_keys
            }

            if direct_change_data:
                update_data(budget_line_item, direct_change_data)
                current_app.db_session.add(budget_line_item)
                current_app.db_session.commit()

            change_request_ids = []

            if not directly_editable and changed_budget_or_status_prop_keys:
                # create a change request for each changed prop separately (for separate approvals)
                # the CR model can support multiple changes in a single request,
                # but we are limiting it to one change per request here
                for changed_prop_key in changed_budget_or_status_prop_keys:
                    change_keys = [changed_prop_key]
                    change_request = BudgetLineItemChangeRequest()
                    change_request.budget_line_item_id = id
                    change_request.agreement_id = budget_line_item.agreement_id
                    managing_division = get_division_for_budget_line_item(id)
                    change_request.managing_division_id = managing_division.id if managing_division else None
                    schema = PATCHRequestBodySchema(only=change_keys)
                    requested_change_data = schema.dump(change_data)
                    change_request.requested_change_data = requested_change_data
                    old_values = schema.dump(changing_from_data)
                    requested_change_diff = {
                        key: {"new": requested_change_data.get(key, None), "old": old_values.get(key, None)}
                        for key in change_keys
                    }
                    change_request.requested_change_diff = requested_change_diff
                    requested_change_info = {"target_display_name": budget_line_item.display_name}
                    change_request.requested_change_info = requested_change_info
                    change_request.requestor_notes = requestor_notes
                    current_app.db_session.add(change_request)
                    current_app.db_session.commit()
                    create_notification_of_new_request_to_reviewer(change_request)
                    change_request_ids.append(change_request.id)

            bli_dict = self._response_schema.dump(budget_line_item)
            meta.metadata.update({"bli": bli_dict})
            current_app.logger.info(f"{message_prefix}: Updated BLI: {bli_dict}")
            if change_request_ids:
                return make_response_with_headers(bli_dict, 202)
            else:
                return make_response_with_headers(bli_dict, 200)

    @is_authorized(
        PermissionType.PUT,
        Permission.BUDGET_LINE_ITEM,
    )
    def put(self, id: int) -> Response:
        if not self.bli_associated_with_agreement(id, PermissionType.PUT):
            return make_response_with_headers({}, 403)
        return self._update(id, "PUT", self._put_schema)

    @is_authorized(
        PermissionType.PATCH,
        Permission.BUDGET_LINE_ITEM,
    )
    def patch(self, id: int) -> Response:
        if not self.bli_associated_with_agreement(id, PermissionType.PATCH):
            return make_response_with_headers({}, 403)
        return self._update(id, "PATCH", self._patch_schema)

    def update_and_commit_budget_line_item(self, data, id):
        budget_line_item = update_budget_line_item(data, id)
        current_app.db_session.add(budget_line_item)
        current_app.db_session.commit()
        return budget_line_item

    @is_authorized(
        PermissionType.DELETE,
        Permission.BUDGET_LINE_ITEM,
    )
    def delete(self, id: int) -> Response:
        if not self.bli_associated_with_agreement(id, PermissionType.DELETE):
            return make_response_with_headers({}, 403)

        with OpsEventHandler(OpsEventType.DELETE_BLI) as meta:
            bli: BudgetLineItem = self._get_item(id)

            if not bli:
                raise RuntimeError(f"Invalid BudgetLineItem id: {id}.")

            # TODO when can we not delete?

            current_app.db_session.delete(bli)
            current_app.db_session.commit()

            meta.metadata.update({"Deleted BudgetLineItem": id})

            return make_response_with_headers({"message": "BudgetLineItem deleted", "id": bli.id}, 200)


class BudgetLineItemsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        # self._post_schema = mmdc.class_schema(POSTRequestBody)()
        # self._get_schema = mmdc.class_schema(QueryParameters)()
        # self._response_schema = mmdc.class_schema(BudgetLineItemResponse)()
        # self._response_schema_collection = mmdc.class_schema(BudgetLineItemResponse)(many=True)
        self._post_schema = POSTRequestBodySchema()
        self._get_schema = QueryParametersSchema()
        self._response_schema = BudgetLineItemResponseSchema()
        self._response_schema_collection = BudgetLineItemResponseSchema(many=True)

    @staticmethod
    def _get_query(
        can_id: Optional[int] = None,
        agreement_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> list[BudgetLineItem]:
        stmt = select(BudgetLineItem).order_by(BudgetLineItem.id)

        query_helper = QueryHelper(stmt)

        if can_id:
            query_helper.add_column_equals(BudgetLineItem.can_id, can_id)

        if agreement_id:
            query_helper.add_column_equals(BudgetLineItem.agreement_id, agreement_id)

        if status:
            query_helper.add_column_equals(BudgetLineItem.status, status)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self) -> Response:
        data = self._get_schema.dump(self._get_schema.load(request.args))

        data["status"] = BudgetLineItemStatus[data["status"]] if data.get("status") else None
        data = convert_date_strings_to_dates(data)

        stmt = self._get_query(data.get("can_id"), data.get("agreement_id"), data.get("status"))

        result = current_app.db_session.execute(stmt).all()

        response = make_response_with_headers(self._response_schema_collection.dump([bli[0] for bli in result]))

        return response

    @is_authorized(PermissionType.POST, Permission.BUDGET_LINE_ITEM)
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        with OpsEventHandler(OpsEventType.CREATE_BLI) as meta:
            self._post_schema.context["method"] = "POST"

            data = self._post_schema.dump(self._post_schema.load(request.json))
            data["status"] = BudgetLineItemStatus[data["status"]] if data.get("status") else None
            data = convert_date_strings_to_dates(data)

            new_bli = BudgetLineItem(**data)

            current_app.db_session.add(new_bli)
            current_app.db_session.commit()

            new_bli_dict = self._response_schema.dump(new_bli)
            meta.metadata.update({"new_bli": new_bli_dict})
            current_app.logger.info(f"{message_prefix}: New BLI created: {new_bli_dict}")

            return make_response_with_headers(new_bli_dict, 201)


def update_data(budget_line_item: BudgetLineItem, data: dict[str, Any]) -> None:
    for item in data:
        if item in [c_attr.key for c_attr in inspect(budget_line_item).mapper.column_attrs]:
            setattr(budget_line_item, item, data[item])


def update_budget_line_item(data: dict[str, Any], id: int):
    budget_line_item = current_app.db_session.get(BudgetLineItem, id)
    if not budget_line_item:
        raise RuntimeError("Invalid BLI id.")
    update_data(budget_line_item, data)
    current_app.db_session.add(budget_line_item)
    current_app.db_session.commit()
    return budget_line_item
