from flask import Response, request
from flask_jwt_extended import jwt_required

from models import OpsEventType
from models.utils import generate_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.cans import (
    CreateUpdateFundingReceivedSchema,
    FundingReceivedListSchema,
    FundingReceivedSchema,
)
from ops_api.ops.services.can_funding_received import CANFundingReceivedService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class CANFundingReceivedItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)
        self.can_service = CANFundingReceivedService()

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self, id: int) -> Response:
        schema = FundingReceivedSchema()
        item = self.can_service.get(id)
        return make_response_with_headers(schema.dump(item))

    @is_authorized(PermissionType.PATCH, Permission.CAN)
    def patch(self, id: int) -> Response:
        """
        Update a CANFundingReceived with only the fields provided in the request body.
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN_FUNDING_RECEIVED) as meta:
            request_data = request.get_json()
            # Setting partial to true ignores any missing fields.
            schema = CreateUpdateFundingReceivedSchema(partial=True)
            serialized_request = schema.load(request_data)

            output_schema = FundingReceivedSchema()
            old_funding_received = self.can_service.get(id)
            serialized_old_funding_received = output_schema.dump(old_funding_received)
            updated_funding_received = self.can_service.update(serialized_request, id)
            serialized_funding_received = output_schema.dump(updated_funding_received)
            updates = generate_events_update(
                serialized_old_funding_received,
                serialized_funding_received,
                updated_funding_received.can_id,
                updated_funding_received.updated_by,
            )
            updates["funding_id"] = id
            meta.metadata.update({"funding_received_updates": updates})
            return make_response_with_headers(serialized_funding_received)

    @is_authorized(PermissionType.PUT, Permission.CAN)
    def put(self, id: int) -> Response:
        """
        Update a CANFundingReceived
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN_FUNDING_RECEIVED) as meta:
            request_data = request.get_json()
            schema = CreateUpdateFundingReceivedSchema()
            serialized_request = schema.load(request_data)

            output_schema = FundingReceivedSchema()
            old_funding_received = self.can_service.get(id)
            serialized_old_funding_received = output_schema.dump(old_funding_received)
            updated_funding_received = self.can_service.update(serialized_request, id)
            serialized_funding_received = output_schema.dump(updated_funding_received)
            updates = generate_events_update(
                serialized_old_funding_received,
                serialized_funding_received,
                updated_funding_received.can_id,
                updated_funding_received.updated_by,
            )
            meta.metadata.update({"funding_received_updates": updates})
            return make_response_with_headers(serialized_funding_received)

    @is_authorized(PermissionType.DELETE, Permission.CAN)
    def delete(self, id: int) -> Response:
        """
        Delete a CANFundingReceived with given id.
        """
        with OpsEventHandler(OpsEventType.DELETE_CAN_FUNDING_RECEIVED) as meta:
            deleted_funding_received = self.can_service.delete(id)
            output_schema = FundingReceivedSchema()
            serialized_funding_received = output_schema.dump(deleted_funding_received)
            meta.metadata.update({"deleted_can_funding_received": serialized_funding_received})
            return make_response_with_headers({"message": "CANFundingReceived deleted", "id": id}, 200)


class CANFundingReceivedListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self.can_service = CANFundingReceivedService()

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        result = self.can_service.get_list()
        funding_received_schema = FundingReceivedListSchema()
        return make_response_with_headers([funding_received_schema.dump(can) for can in result])

    @is_authorized(PermissionType.POST, Permission.CAN)
    def post(self) -> Response:
        """
        Create a new CANFundingReceived object
        """
        with OpsEventHandler(OpsEventType.CREATE_CAN_FUNDING_RECEIVED) as meta:
            request_data = request.get_json()
            schema = CreateUpdateFundingReceivedSchema()
            serialized_request = schema.load(request_data)

            created_funding_received = self.can_service.create(serialized_request)

            funding_received_schema = FundingReceivedSchema()
            serialized_funding_received = funding_received_schema.dump(created_funding_received)
            meta.metadata.update({"new_can_funding_received": serialized_funding_received})
            return make_response_with_headers(serialized_funding_received, 201)
