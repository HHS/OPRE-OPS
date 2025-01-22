from dataclasses import dataclass
from typing import List, Optional

import desert
from deepdiff import DeepDiff
from flask import Response, current_app, request
from flask_jwt_extended import jwt_required
from sqlalchemy import select

from models import OpsEventType
from models.base import BaseModel
from models.cans import CAN
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.cans import CANSchema, CreateUpdateCANRequestSchema, GetCANListRequestSchema
from ops_api.ops.services.cans import CANService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


@dataclass
class ListAPIRequest:
    search: Optional[str]


class CANItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)
        self.can_service = CANService()

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self, id: int) -> Response:
        schema = CANSchema()
        item = self.can_service.get(id)
        return make_response_with_headers(schema.dump(item))

    @is_authorized(PermissionType.PATCH, Permission.CAN)
    def patch(self, id: int) -> Response:
        """
        Update a CAN with only the fields provided in the request body.
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN) as meta:
            request_data = request.get_json()
            # Setting partial to true ignores any missing fields.
            schema = CreateUpdateCANRequestSchema(partial=True)
            serialized_request = schema.load(request_data)
            old_can = self.can_service.get(id)
            updated_can = self.can_service.update(serialized_request, id)
            serialized_old_can = schema.dump(old_can)
            serialized_can = schema.dump(updated_can)
            values_changed = DeepDiff(serialized_old_can, serialized_can)
            meta.metadata.update({"updated_can": values_changed})
            return make_response_with_headers(schema.dump(updated_can))

    @is_authorized(PermissionType.PATCH, Permission.CAN)
    def put(self, id: int) -> Response:
        """
        Update a CAN with only the fields provided in the request body.
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN) as meta:
            request_data = request.get_json()
            # Setting partial to true ignores any missing fields.
            schema = CreateUpdateCANRequestSchema()
            serialized_request = schema.load(request_data)

            updated_can = self.can_service.update(serialized_request, id)
            serialized_can = schema.dump(updated_can)
            meta.metadata.update({"updated_can": serialized_can})
            return make_response_with_headers(schema.dump(updated_can))

    @is_authorized(PermissionType.DELETE, Permission.CAN)
    def delete(self, id: int) -> Response:
        """
        Delete a CAN with given id."""
        with OpsEventHandler(OpsEventType.DELETE_CAN) as meta:
            self.can_service.delete(id)
            meta.metadata.update({"Deleted CAN": id})
            return make_response_with_headers({"message": "CAN deleted", "id": id}, 200)


class CANListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self.can_service = CANService()
        self._get_input_schema = desert.schema(ListAPIRequest)

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        list_schema = GetCANListRequestSchema()
        get_request = list_schema.load(request.args)
        result = self.can_service.get_list(**get_request)
        can_schema = CANSchema()
        return make_response_with_headers([can_schema.dump(can) for can in result])

    @is_authorized(PermissionType.POST, Permission.CAN)
    def post(self) -> Response:
        """
        Create a new Common Accounting Number (CAN) object.
        """
        with OpsEventHandler(OpsEventType.CREATE_NEW_CAN) as meta:
            request_data = request.get_json()
            schema = CreateUpdateCANRequestSchema()
            serialized_request = schema.load(request_data)

            created_can = self.can_service.create(serialized_request)

            can_schema = CANSchema()
            serialized_can = can_schema.dump(created_can)
            meta.metadata.update({"new_can": serialized_can})
            return make_response_with_headers(serialized_can, 201)


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
