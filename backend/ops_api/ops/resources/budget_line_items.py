from __future__ import annotations

import math as Math

from flask import Response, current_app, request
from flask_jwt_extended import current_user
from loguru import logger

from marshmallow.experimental.context import Context
from models import BaseModel, BudgetLineItem
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.budget_line_items import (
    BLIFiltersQueryParametersSchema,
    BudgetLineItemListFilterOptionResponseSchema,
    BudgetLineItemResponseSchema,
    MetaSchema,
    PATCHRequestBodySchema,
    POSTRequestBodySchema,
    QueryParametersSchema,
)
from ops_api.ops.services.budget_line_items import BudgetLineItemService, bli_associated_with_agreement
from ops_api.ops.services.ops_service import OpsService
from ops_api.ops.utils.response import make_response_with_headers


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = BudgetLineItemResponseSchema()
        self._put_schema = POSTRequestBodySchema()
        self._patch_schema = PATCHRequestBodySchema()

    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self, id: int) -> Response:
        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        serialized_bli = self._response_schema.dump(service.get(id))

        # add Meta data to the response
        meta_schema = MetaSchema()
        data_for_meta = {
            "isEditable": False,
        }
        if "BUDGET_TEAM" in (role.name for role in current_user.roles):
            # if the user has the BUDGET_TEAM role, they can edit all budget line items
            data_for_meta["isEditable"] = True
        elif serialized_bli.get("agreement_id"):
            data_for_meta["isEditable"] = bli_associated_with_agreement(serialized_bli.get("id"))
        else:
            data_for_meta["isEditable"] = False

        meta = meta_schema.dump(data_for_meta)
        serialized_bli["_meta"] = meta

        return make_response_with_headers(serialized_bli)

    @is_authorized(
        PermissionType.PUT,
        Permission.BUDGET_LINE_ITEM,
    )
    def put(self, id: int) -> Response:
        with Context({"method": "PUT"}):
            updated_fields = {
                "method": "PUT",
                "schema": self._put_schema,
                "request": request,
            }
            service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
            bli, status_code = service.update(id, updated_fields)
            return make_response_with_headers(self._response_schema.dump(bli), status_code)

    @is_authorized(
        PermissionType.PATCH,
        Permission.BUDGET_LINE_ITEM,
    )
    def patch(self, id: int) -> Response:
        updated_fields = {
            "method": "PATCH",
            "schema": self._patch_schema,
            "request": request,
        }
        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        bli, status_code = service.update(id, updated_fields)
        return make_response_with_headers(self._response_schema.dump(bli), status_code)

    @is_authorized(
        PermissionType.DELETE,
        Permission.BUDGET_LINE_ITEM,
    )
    def delete(self, id: int) -> Response:
        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        service.delete(id)

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

        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        budget_line_items, summary_data = service.get_list(data)

        logger.debug("Serializing results")
        count = summary_data["count"]
        totals = summary_data["totals"]
        limit = data.get("limit", [None])[0]
        offset = data.get("offset", [None])[0]

        serialized_blis = self._response_schema.dump(budget_line_items, many=True)
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
        for serialized_bli in serialized_blis:
            meta = meta_schema.dump(data_for_meta)
            if "BUDGET_TEAM" in (role.name for role in current_user.roles):
                # if the user has the BUDGET_TEAM role, they can edit all budget line items
                meta["isEditable"] = True
            elif serialized_bli.get("agreement_id"):
                meta["isEditable"] = bli_associated_with_agreement(serialized_bli.get("id"))
            else:
                meta["isEditable"] = False
            serialized_bli["_meta"] = meta
        logger.debug("Serialization complete")

        return make_response_with_headers(serialized_blis)

    @is_authorized(PermissionType.POST, Permission.BUDGET_LINE_ITEM)
    def post(self) -> Response:
        with Context({"method": "POST"}):
            data = self._post_schema.load(request.json)
            service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
            budget_line_item = service.create(data)
            new_bli_dict = self._response_schema.dump(budget_line_item)
            return make_response_with_headers(new_bli_dict, 201)


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
