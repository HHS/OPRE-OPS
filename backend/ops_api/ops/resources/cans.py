from dataclasses import dataclass
from typing import List, Optional, cast

import desert
from flask import Response, current_app, request
from flask_jwt_extended import jwt_required
from sqlalchemy import select
from sqlalchemy.orm import InstrumentedAttribute

from models.base import BaseModel
from models.cans import CAN
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.cans import CANSchema, CreateCANRequestSchema
from ops_api.ops.services.cans import CANService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers


@dataclass
class ListAPIRequest:
    search: Optional[str]


class CANItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self, id: int) -> Response:
        schema = CANSchema()
        item = self._get_item(id)

        if item:
            response = make_response_with_headers(schema.dump(item))
        else:
            response = make_response_with_headers({}, 404)

        return response


class CANListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self._get_input_schema = desert.schema(ListAPIRequest)

    @staticmethod
    def _get_query(search=None):
        stmt = select(CAN).order_by(CAN.id)

        query_helper = QueryHelper(stmt)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(cast(InstrumentedAttribute, CAN.number), search)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        errors = self._get_input_schema.validate(request.args)
        can_schema = CANSchema()

        if errors:
            return make_response_with_headers(errors, 400)

        request_data: ListAPIRequest = self._get_input_schema.load(request.args)
        stmt = self._get_query(request_data.search)
        result = current_app.db_session.execute(stmt).all()
        return make_response_with_headers([can_schema.dump(i) for item in result for i in item])

    @is_authorized(PermissionType.POST, Permission.CAN)
    def post(self) -> Response:
        """
        Create a new Common Accounting Number (CAN) object.
        """
        request_data = request.get_json()
        schema = CreateCANRequestSchema()
        serialized_request = schema.load(request_data)

        can_service = CANService()
        created_can = can_service.create(serialized_request)

        can_schema = CANSchema()
        serialized_can = can_schema.dump(created_can)
        return make_response_with_headers(serialized_can, 201)

    @is_authorized(PermissionType.PATCH, Permission.CAN)
    def patch(self, id: int) -> Response:
        request_data = request.get_json()
        schema = CANSchema()
        serialized_request = schema.load(request_data)

        can_service = CANService()
        can_service.update_by_fields(serialized_request, id)
        return make_response_with_headers({})


class CANsByPortfolioAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @jwt_required()
    def _get_item(self, id: int) -> List[CAN]:
        cfy_stmt = select(CAN).where(CAN.portfolio_id == id).order_by(CAN.id)

        return current_app.db_session.execute(cfy_stmt).scalars().all()

    @jwt_required()
    def get(self, id: int) -> Response:
        cans = self._get_item(id)
        return make_response_with_headers([can.to_dict() for can in cans])
