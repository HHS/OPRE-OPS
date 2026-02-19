from __future__ import annotations

import math as Math

from flask import Response, current_app, request
from flask_jwt_extended import current_user
from loguru import logger
from marshmallow import ValidationError
from marshmallow.experimental.context import Context

from models import BaseModel, BudgetLineItem, OpsEventType
from models.utils import generate_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.budget_line_items import (
    BLIFiltersQueryParametersSchema,
    BudgetLineItemListFilterOptionResponseSchema,
    BudgetLineItemListResponseSchema,
    BudgetLineItemResponseSchema,
    MetaSchema,
    PATCHRequestBodySchema,
    POSTRequestBodySchema,
    PUTRequestBodySchema,
    QueryParametersSchema,
)
from ops_api.ops.schemas.change_requests import GenericChangeRequestResponseSchema
from ops_api.ops.services.budget_line_items import (
    BudgetLineItemService,
    batch_load_change_requests_in_review,
    get_change_requests_for_bli,
    get_is_editable_meta_data,
)
from ops_api.ops.services.ops_service import OpsService
from ops_api.ops.utils.agreements_helpers import associated_with_agreement
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.users import is_super_user


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = BudgetLineItemResponseSchema()
        self._put_schema = PUTRequestBodySchema()
        self._patch_schema = PATCHRequestBodySchema(partial=True)

    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self, id: int) -> Response:
        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        serialized_bli = self._response_schema.dump(service.get(id))

        meta = get_is_editable_meta_data(serialized_bli)
        serialized_bli["_meta"] = meta

        return make_response_with_headers(serialized_bli)

    @is_authorized(
        PermissionType.PUT,
        Permission.BUDGET_LINE_ITEM,
    )
    def put(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
            with Context({"method": "PUT"}):
                updated_fields = {
                    "method": "PUT",
                    "schema": self._put_schema,
                    "request": request,
                }
                data = self._put_schema.load(request.json)
                service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
                old_bli: BudgetLineItem = service.get(id)
                old_bli_dict = old_bli.to_dict()
                bli, status_code = service.update(id, data | updated_fields)
                events_update = generate_events_update(old_bli_dict, bli.to_dict(), bli.agreement_id, current_user.id)
                meta.metadata.update({"bli_updates": events_update, "bli": bli.to_dict()})
                return make_response_with_headers(self._response_schema.dump(bli), status_code)

    @is_authorized(
        PermissionType.PATCH,
        Permission.BUDGET_LINE_ITEM,
    )
    def patch(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
            updated_fields = {
                "method": "PATCH",
                "schema": self._patch_schema,
                "request": request,
            }
            data = self._patch_schema.load(request.json)
            service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
            old_bli: BudgetLineItem = service.get(id)
            old_bli_dict = old_bli.to_dict()
            bli, status_code = service.update(id, data | updated_fields)
            events_update = generate_events_update(old_bli_dict, bli.to_dict(), bli.agreement_id, current_user.id)
            meta.metadata.update({"bli_updates": events_update, "bli": bli.to_dict()})
            return make_response_with_headers(self._response_schema.dump(bli), status_code)

    @is_authorized(
        PermissionType.DELETE,
        Permission.BUDGET_LINE_ITEM,
    )
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_BLI) as meta:
            service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
            old_bli: BudgetLineItem = service.get(id)
            service.delete(id)
            meta.metadata.update({"deleted_bli": old_bli.to_dict()})
            return make_response_with_headers({"message": "BudgetLineItem deleted", "id": id}, 200)


class BudgetLineItemsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._post_schema = POSTRequestBodySchema()
        self._get_schema = QueryParametersSchema()
        self._response_schema = BudgetLineItemResponseSchema()
        self._response_schema_collection = BudgetLineItemResponseSchema(many=True)

    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self) -> Response:
        request_schema = QueryParametersSchema()
        data = request_schema.load(request.args.to_dict(flat=False))
        logger.debug(f"Query parameters: {request_schema.dump(data)}")

        if len(data.get("limit", None)) != 1 or len(data.get("offset", None)) != 1:
            raise ValidationError("Limit and offset must be single values.")

        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        budget_line_items, summary_data = service.get_list(data)

        logger.debug("Serializing results")
        count = summary_data["count"]
        totals = summary_data["totals"]
        limit = data.get("limit", None)[0]
        offset = data.get("offset", None)[0]

        bli_dict = {bli.id: bli for bli in budget_line_items}
        bli_ids = list(bli_dict.keys())
        agreement_ids = [bli.agreement_id for bli in budget_line_items]
        change_requests_data = batch_load_change_requests_in_review(current_app.db_session, bli_ids, agreement_ids)

        list_schema = BudgetLineItemListResponseSchema(many=True)
        cr_schema = GenericChangeRequestResponseSchema(many=True)
        meta_schema = MetaSchema()
        data_for_meta = {
            "total_count": count,
            "number_of_pages": Math.ceil(count / limit) if limit else 1,
            "limit": limit,
            "offset": offset,
            "query_parameters": request_schema.dump(data),
            "total_amount": totals["total_amount"],
            "total_draft_amount": totals["total_draft_amount"],
            "total_planned_amount": totals["total_planned_amount"],
            "total_in_execution_amount": totals["total_in_execution_amount"],
            "total_obligated_amount": totals["total_obligated_amount"],
            "total_overcome_by_events_amount": totals["total_overcome_by_events_amount"],
        }
        is_budget_team = "BUDGET_TEAM" in (role.name for role in current_user.roles)
        is_super = is_super_user(current_user, current_app)
        user_agreement_associations = {}

        serialized_blis = list_schema.dump(budget_line_items)
        for serialized_bli in serialized_blis:
            bli_id = serialized_bli.get("id")
            agreement_id = serialized_bli.get("agreement_id")
            change_requests = get_change_requests_for_bli(bli_id, agreement_id, change_requests_data)
            in_review = change_requests is not None
            serialized_bli["in_review"] = in_review
            serialized_bli["change_requests_in_review"] = cr_schema.dump(change_requests) if change_requests else None
            serialized_bli["_meta"] = _list_item_meta(
                serialized_bli,
                bli_dict.get(bli_id),
                data_for_meta,
                meta_schema,
                is_budget_team,
                is_super,
                user_agreement_associations,
            )

        logger.debug("Serialization complete")
        return make_response_with_headers(serialized_blis)

    @is_authorized(PermissionType.POST, Permission.BUDGET_LINE_ITEM)
    def post(self) -> Response:
        with OpsEventHandler(OpsEventType.CREATE_BLI) as meta:
            with Context({"method": "POST"}):
                data = self._post_schema.load(request.json)
                service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
                budget_line_item = service.create(data)
                new_bli_dict = self._response_schema.dump(budget_line_item)
                meta.metadata.update({"new_bli": new_bli_dict})
                return make_response_with_headers(new_bli_dict, 201)


def _list_item_meta(
    serialized_bli: dict,
    budget_line_item: BudgetLineItem | None,
    data_for_meta: dict,
    meta_schema: MetaSchema,
    is_budget_team: bool,
    is_super: bool,
    user_agreement_associations: dict,
) -> dict:
    """Build _meta for a single BLI in the list response (pagination + isEditable)."""
    meta = meta_schema.dump(data_for_meta)
    in_review = serialized_bli.get("in_review", False)
    if is_budget_team:
        meta["isEditable"] = _is_bli_editable_optimized(budget_line_item, in_review, is_super)
    elif serialized_bli.get("agreement_id"):
        agreement_id = serialized_bli["agreement_id"]
        if agreement_id not in user_agreement_associations:
            user_agreement_associations[agreement_id] = associated_with_agreement(agreement_id)
        is_associated = user_agreement_associations[agreement_id]
        meta["isEditable"] = is_associated and _is_bli_editable_optimized(budget_line_item, in_review, is_super)
    else:
        meta["isEditable"] = False
    return meta


def _is_bli_editable_optimized(budget_line_item: BudgetLineItem | None, in_review: bool, is_super: bool) -> bool:
    """
    Optimized version of is_bli_editable that uses pre-computed in_review value
    instead of querying the database.
    """
    from models import BudgetLineItemStatus

    if budget_line_item is None:
        return False
    # Check if status is editable
    editable = is_super or budget_line_item.status in [
        BudgetLineItemStatus.DRAFT,
        BudgetLineItemStatus.PLANNED,
    ]

    # Use pre-computed in_review instead of querying
    if in_review:
        editable = False

    if not is_super and budget_line_item.is_obe:
        editable = False

    return editable


class BudgetLineItemsListFilterOptionAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._get_schema = BLIFiltersQueryParametersSchema()
        self._response_schema = BudgetLineItemListFilterOptionResponseSchema()

    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self) -> Response:
        request_schema = BLIFiltersQueryParametersSchema()
        data = request_schema.load(request.args.to_dict(flat=False))
        logger.debug(f"Query parameters: {request_schema.dump(data)}")

        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        filter_options = service.get_filter_options(data)

        return make_response_with_headers(filter_options)
