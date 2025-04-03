from __future__ import annotations

from typing import Optional

from flask import Response, current_app, request
from flask_jwt_extended import get_current_user, verify_jwt_in_request
from loguru import logger
from sqlalchemy import inspect, select
from sqlalchemy.exc import SQLAlchemyError
from typing_extensions import Any
from werkzeug.exceptions import NotFound

from models import (
    CAN,
    Agreement,
    AgreementType,
    BaseModel,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    DirectObligationBudgetLineItem,
    Division,
    GrantBudgetLineItem,
    IAABudgetLineItem,
    OpsEventType,
    Portfolio,
    User,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.budget_line_items import (
    BudgetLineItemResponseSchema,
    MetaSchema,
    PATCHRequestBodySchema,
    POSTRequestBodySchema,
    QueryParametersSchema,
)
from ops_api.ops.services.cans import CANService
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


def check_user_association(agreement, user) -> bool:
    oidc_ids = set()
    if agreement.created_by_user:
        oidc_ids.add(str(agreement.created_by_user.oidc_id))
    if agreement.created_by:
        agreement_creator = current_app.db_session.get(User, agreement.created_by)
        oidc_ids.add(str(agreement_creator.oidc_id))
    if agreement.project_officer:
        oidc_ids.add(str(agreement.project_officer.oidc_id))
    if agreement.alternate_project_officer:
        oidc_ids.add(str(agreement.alternate_project_officer.oidc_id))

    oidc_ids |= set(str(tm.oidc_id) for tm in agreement.team_members)

    ret = str(user.oidc_id) in oidc_ids or "BUDGET_TEAM" in [role.name for role in user.roles]

    return ret


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = BudgetLineItemResponseSchema()
        self._put_schema = POSTRequestBodySchema()
        self._patch_schema = PATCHRequestBodySchema()

    def bli_associated_with_agreement(self, id: int, permission_type: PermissionType) -> bool:
        """
        In order to edit a budget line, the user must be authenticated and meet on of these conditions:
            -  The user is the agreement creator.
            -  The user is the project officer of the agreement.
            -  The user is a team member on the agreement.
            -  The user is a budget team member.
        """
        verify_jwt_in_request()
        user = get_current_user()
        if not user:
            return False
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

        return check_user_association(agreement, user)

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

    def is_bli_editable(self, budget_line_item):
        """A utility function that determines if a BLI is editable"""
        editable = budget_line_item.status in [
            BudgetLineItemStatus.DRAFT,
            BudgetLineItemStatus.PLANNED,
            BudgetLineItemStatus.IN_EXECUTION,
        ]

        # if the BLI is in review, it cannot be edited
        if budget_line_item.in_review:
            editable = False

        return editable

    def _update(self, id, method, schema) -> Response:
        message_prefix = f"{method} to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
            schema.context["id"] = id
            schema.context["method"] = method

            # determine if the BLI is in an editable state or one that supports change requests (requires approval)

            budget_line_item = current_app.db_session.get(BudgetLineItem, id)
            if not budget_line_item:
                return make_response_with_headers({}, 400)  # should this return 404, tests currently expect 400
            editable = self.is_bli_editable(budget_line_item)

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

            # Throws not-found error if can does not exist
            try:
                can_service = CANService()
                if "can_id" in request_data and request_data["can_id"] is not None:
                    can_service.get(request_data["can_id"])
            except NotFound:
                return make_response_with_headers({}, 400)

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
                change_request_ids = self.add_change_requests(
                    id,
                    budget_line_item,
                    changing_from_data,
                    change_data,
                    changed_budget_or_status_prop_keys,
                    requestor_notes,
                )

            bli_dict = self._response_schema.dump(budget_line_item)
            meta.metadata.update({"bli": bli_dict})
            current_app.logger.info(f"{message_prefix}: Updated BLI: {bli_dict}")
            if change_request_ids:
                return make_response_with_headers(bli_dict, 202)
            else:
                return make_response_with_headers(bli_dict, 200)

    def add_change_requests(
        self, id, budget_line_item, changing_from_data, change_data, changed_budget_or_status_prop_keys, requestor_notes
    ):
        change_request_ids = []
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

        return change_request_ids

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

    def associated_with_agreement(self, agreement_id, permission_type: PermissionType) -> bool:
        """
        In order to create a budget line, the user must be authenticated and meet one of these conditions:
            -  The user is the agreement creator.
            -  The user is the project officer of the agreement.
            -  The user is a team member on the agreement.
        """
        verify_jwt_in_request()
        user = get_current_user()
        if not user:
            return False

        agreement_stmt = select(Agreement).where(Agreement.id == agreement_id)
        agreement = current_app.db_session.scalar(agreement_stmt)

        return check_user_association(agreement, user)

    @staticmethod
    def _get_query(
        can_id: Optional[int] = None,
        agreement_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> list[BudgetLineItem]:
        stmt = select(BudgetLineItem).join(CAN).order_by(BudgetLineItem.id)

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
        request_schema = QueryParametersSchema()
        data = request_schema.load(request.args.to_dict(flat=False))

        fiscal_years = data.get("fiscal_year", [])
        budget_line_statuses = data.get("budget_line_status", [])
        portfolios = data.get("portfolio", [])
        can_ids = data.get("can_id", [])
        agreement_ids = data.get("agreement_id", [])
        statuses = data.get("status", [])
        limit = data.get("limit", [])
        offset = data.get("offset", [])

        logger.debug(f"Query parameters: {request_schema.dump(data)}")

        query = select(BudgetLineItem).distinct().order_by(BudgetLineItem.id)

        if fiscal_years:
            query = query.where(BudgetLineItem.fiscal_year.in_(fiscal_years))
        if budget_line_statuses:
            query = query.where(BudgetLineItem.status.in_(budget_line_statuses))
        if portfolios:
            query = query.where(BudgetLineItem.portfolio_id.in_(portfolios))
        if can_ids:
            query = query.where(BudgetLineItem.can_id.in_(can_ids))
        if agreement_ids:
            query = query.where(BudgetLineItem.agreement_id.in_(agreement_ids))
        if statuses:
            query = query.where(BudgetLineItem.status.in_(statuses))

        logger.debug("Beginning bli queries")
        # it would be better to use count() here, but SQLAlchemy should cache this anyway and
        # the where clauses are not forming correct SQL
        count = len(current_app.db_session.scalars(query).all())

        if limit and offset:
            query = query.limit(limit[0]).offset(offset[0])

        result = current_app.db_session.scalars(query).all()

        logger.debug("BLI queries complete")

        logger.debug("Serializing results")
        serialized_blis = self._response_schema.dump(result, many=True)
        meta_schema = MetaSchema()
        data_for_meta = {
            "total_count": count,
            "number_of_pages": count // limit[0] if limit else 1,
            "limit": limit[0] if limit else None,
            "offset": offset[0] if offset else None,
            "query_parameters": request_schema.dump(data),
        }
        meta = meta_schema.dump(data_for_meta)
        for serialized_bli in serialized_blis:
            serialized_bli["_meta"] = meta
        logger.debug("Serialization complete")

        return make_response_with_headers(serialized_blis)

    @is_authorized(PermissionType.POST, Permission.BUDGET_LINE_ITEM)
    def post(self) -> Response:

        message_prefix = f"POST to {ENDPOINT_STRING}"
        with OpsEventHandler(OpsEventType.CREATE_BLI) as meta:
            self._post_schema.context["method"] = "POST"

            data = self._post_schema.dump(self._post_schema.load(request.json))

            agreement_id = data["agreement_id"]

            if not self.associated_with_agreement(agreement_id, PermissionType.POST):
                return make_response_with_headers({}, 403)

            # Throws not-found error if can does not exist
            try:
                can_service = CANService()
                if "can_id" in data and data["can_id"] is not None:
                    can_service.get(data["can_id"])
            except NotFound:
                return make_response_with_headers({}, 400)

            data["status"] = BudgetLineItemStatus[data["status"]] if data.get("status") else None
            data = convert_date_strings_to_dates(data)

            agreement = current_app.db_session.get(Agreement, agreement_id)

            match agreement.agreement_type:
                case AgreementType.CONTRACT:
                    new_bli = ContractBudgetLineItem(**data)
                case AgreementType.GRANT:
                    new_bli = GrantBudgetLineItem(**data)
                case AgreementType.DIRECT_OBLIGATION:
                    new_bli = DirectObligationBudgetLineItem(**data)
                case AgreementType.IAA:
                    new_bli = IAABudgetLineItem(**data)
                case _:
                    raise RuntimeError(f"Invalid bli type: {agreement.agreement_type}")

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
