from __future__ import annotations

import math as Math

from flask import Response, current_app, request
from flask_jwt_extended import get_current_user
from loguru import logger
from typing_extensions import Any
from werkzeug.exceptions import Forbidden

from models import BaseModel, BudgetLineItem
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.resources.change_requests import check_user_association
from ops_api.ops.schemas.budget_line_items import (
    BudgetLineItemResponseSchema,
    MetaSchema,
    PATCHRequestBodySchema,
    POSTRequestBodySchema,
    QueryParametersSchema,
)
from ops_api.ops.services.budget_line_items import BudgetLineItemService, update_data
from ops_api.ops.services.ops_service import AuthorizationError, OpsService, ResourceNotFoundError
from ops_api.ops.utils.response import make_response_with_headers


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
        user = get_current_user()

        budget_line_item = current_app.db_session.get(BudgetLineItem, id)

        if not user.id or not budget_line_item:
            raise ResourceNotFoundError("BudgetLineItem", id)

        if not budget_line_item.agreement:
            raise AuthorizationError(
                f"BudgetLineItem {id} does not have an associated agreement. Cannot check association.",
                "BudgetLineItem",
            )

        return check_user_association(budget_line_item.agreement, user)

    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self, id: int) -> Response:
        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        return make_response_with_headers(self._response_schema.dump(service.get(id)))

    @is_authorized(
        PermissionType.PUT,
        Permission.BUDGET_LINE_ITEM,
    )
    def put(self, id: int) -> Response:
        if not self.bli_associated_with_agreement(id, PermissionType.PUT):
            raise Forbidden()

        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        bli, status_code = service._update(id, "PUT", self._put_schema, request)
        return make_response_with_headers(self._response_schema.dump(bli), status_code)

    @is_authorized(
        PermissionType.PATCH,
        Permission.BUDGET_LINE_ITEM,
    )
    def patch(self, id: int) -> Response:
        if not self.bli_associated_with_agreement(id, PermissionType.PATCH):
            raise Forbidden()

        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        bli, status_code = service._update(id, "PATCH", self._patch_schema, request)
        return make_response_with_headers(self._response_schema.dump(bli), status_code)

    @is_authorized(
        PermissionType.DELETE,
        Permission.BUDGET_LINE_ITEM,
    )
    def delete(self, id: int) -> Response:
        if not self.bli_associated_with_agreement(id, PermissionType.DELETE):
            raise Forbidden()

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
        }
        meta = meta_schema.dump(data_for_meta)
        for serialized_bli in serialized_blis:
            serialized_bli["_meta"] = meta
        logger.debug("Serialization complete")

        return make_response_with_headers(serialized_blis)

    @is_authorized(PermissionType.POST, Permission.BUDGET_LINE_ITEM)
    def post(self) -> Response:

        self._post_schema.context["method"] = "POST"
        data = self._post_schema.dump(self._post_schema.load(request.json))

        service: OpsService[BudgetLineItem] = BudgetLineItemService(current_app.db_session)
        budget_line_item = service.create(data)
        new_bli_dict = self._response_schema.dump(budget_line_item)
        return make_response_with_headers(new_bli_dict, 201)


def update_budget_line_item(data: dict[str, Any], id: int):
    budget_line_item = current_app.db_session.get(BudgetLineItem, id)
    if not budget_line_item:
        raise RuntimeError("Invalid BLI id.")
    update_data(budget_line_item, data)
    current_app.db_session.add(budget_line_item)
    current_app.db_session.commit()
    return budget_line_item
