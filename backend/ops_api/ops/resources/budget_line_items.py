from __future__ import annotations

import math as Math

from flask import Response, current_app, request
from flask_jwt_extended import current_user
from loguru import logger
from marshmallow.experimental.context import Context

from models import BaseModel, BudgetLineItem, OpsEventType
from models.utils import generate_events_update
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
    PUTRequestBodySchema,
    QueryParametersSchema,
)
from ops_api.ops.services.budget_line_items import (
    BudgetLineItemService,
    get_is_editable_meta_data,
)
from ops_api.ops.services.ops_service import OpsService
from ops_api.ops.utils.budget_line_items_helpers import (
    bli_associated_with_agreement,
    is_bli_editable,
)
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = BudgetLineItemResponseSchema()
        self._put_schema = PUTRequestBodySchema()
        self._patch_schema = PATCHRequestBodySchema(partial=True)

    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self, id: int) -> Response:
        service: OpsService[BudgetLineItem] = BudgetLineItemService(
            current_app.db_session
        )
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
                service: OpsService[BudgetLineItem] = BudgetLineItemService(
                    current_app.db_session
                )
                old_bli: BudgetLineItem = service.get(id)
                old_bli_dict = old_bli.to_dict()
                bli, status_code = service.update(id, data | updated_fields)
                events_update = generate_events_update(
                    old_bli_dict, bli.to_dict(), bli.agreement_id, current_user.id
                )
                meta.metadata.update(
                    {"bli_updates": events_update, "bli": bli.to_dict()}
                )
                return make_response_with_headers(
                    self._response_schema.dump(bli), status_code
                )

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
            service: OpsService[BudgetLineItem] = BudgetLineItemService(
                current_app.db_session
            )
            old_bli: BudgetLineItem = service.get(id)
            old_bli_dict = old_bli.to_dict()
            bli, status_code = service.update(id, data | updated_fields)
            events_update = generate_events_update(
                old_bli_dict, bli.to_dict(), bli.agreement_id, current_user.id
            )
            meta.metadata.update({"bli_updates": events_update, "bli": bli.to_dict()})
            return make_response_with_headers(
                self._response_schema.dump(bli), status_code
            )

    @is_authorized(
        PermissionType.DELETE,
        Permission.BUDGET_LINE_ITEM,
    )
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_BLI) as meta:
            service: OpsService[BudgetLineItem] = BudgetLineItemService(
                current_app.db_session
            )
            old_bli: BudgetLineItem = service.get(id)
            service.delete(id)
            meta.metadata.update({"deleted_bli": old_bli.to_dict()})
            return make_response_with_headers(
                {"message": "BudgetLineItem deleted", "id": id}, 200
            )


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

        service: OpsService[BudgetLineItem] = BudgetLineItemService(
            current_app.db_session
        )
        budget_line_items, summary_data = service.get_list(data)

        logger.debug("Serializing results")
        count = summary_data["count"]
        totals = summary_data["totals"]
        limit = data.get("limit", [None])[0]
        offset = data.get("offset", [None])[0]

        serialized_blis = self._response_schema.dump(budget_line_items, many=True)

        # Batch fetch all budget line items
        bli_ids = [bli["id"] for bli in serialized_blis if bli.get("id")]
        bli_dict = {}
        if bli_ids:
            fetched_blis = (
                current_app.db_session.query(BudgetLineItem)
                .filter(BudgetLineItem.id.in_(bli_ids))
                .all()
            )
            bli_dict = {bli.id: bli for bli in fetched_blis}

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
            "total_overcome_by_events_amount": totals[
                "total_overcome_by_events_amount"
            ],
        }

        is_budget_team = "BUDGET_TEAM" in (role.name for role in current_user.roles)

        for serialized_bli in serialized_blis:
            meta = meta_schema.dump(data_for_meta)

            bli_id = serialized_bli.get("id")
            budget_line_item = bli_dict.get(bli_id)

            if is_budget_team:
                # if the user has the BUDGET_TEAM role, they can edit all budget line items
                meta["isEditable"] = is_bli_editable(budget_line_item)
            elif serialized_bli.get("agreement_id"):
                meta["isEditable"] = bli_associated_with_agreement(
                    bli_id
                ) and is_bli_editable(budget_line_item)
            else:
                meta["isEditable"] = False

            serialized_bli["_meta"] = meta

        logger.debug("Serialization complete")

        return make_response_with_headers(serialized_blis)

    @is_authorized(PermissionType.POST, Permission.BUDGET_LINE_ITEM)
    def post(self) -> Response:
        with OpsEventHandler(OpsEventType.CREATE_BLI) as meta:
            with Context({"method": "POST"}):
                data = self._post_schema.load(request.json)
                service: OpsService[BudgetLineItem] = BudgetLineItemService(
                    current_app.db_session
                )
                budget_line_item = service.create(data)
                new_bli_dict = self._response_schema.dump(budget_line_item)
                meta.metadata.update({"new_bli": new_bli_dict})
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

        service: OpsService[BudgetLineItem] = BudgetLineItemService(
            current_app.db_session
        )
        filter_options = service.get_filter_options(data)

        return make_response_with_headers(filter_options)
