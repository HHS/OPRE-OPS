from flask import Response, request
from flask_jwt_extended import jwt_required

from models import OpsEventType
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.cans import (
    CreateUpdateFundingDetailsSchema,
    FundingDetailsListSchema,
    FundingDetailsSchema,
)
from ops_api.ops.services.can_funding_details import CANFundingDetailsService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class CANFundingDetailsItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)
        self.service = CANFundingDetailsService()

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self, id: int) -> Response:
        schema = FundingDetailsSchema()
        item = self.service.get(id)
        return make_response_with_headers(schema.dump(item))

    @is_authorized(PermissionType.PATCH, Permission.CAN)
    def patch(self, id: int) -> Response:
        """
        Update a CANFundingDetails with only the fields provided in the request body.
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN_FUNDING_DETAILS) as meta:
            request_data = request.get_json()
            # Setting partial to true ignores any missing fields.
            schema = CreateUpdateFundingDetailsSchema(partial=True)
            serialized_request = schema.load(request_data)

            updated_funding_details = self.service.update(serialized_request, id)
            serialized_can_funding_details = schema.dump(updated_funding_details)
            meta.metadata.update({"updated_can_funding_details": serialized_can_funding_details})
            return make_response_with_headers(serialized_can_funding_details)

    @is_authorized(PermissionType.PATCH, Permission.CAN)
    def put(self, id: int) -> Response:
        """
        Update a CANFundingDetails
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN_FUNDING_DETAILS) as meta:
            request_data = request.get_json()
            schema = CreateUpdateFundingDetailsSchema()
            serialized_request = schema.load(request_data)

            updated_funding_details = self.service.update(serialized_request, id)
            serialized_funding_details = schema.dump(updated_funding_details)
            meta.metadata.update({"updated_can_funding_details": serialized_funding_details})
            return make_response_with_headers(serialized_funding_details)

    @is_authorized(PermissionType.DELETE, Permission.CAN)
    def delete(self, id: int) -> Response:
        """
        Delete a CANFundingDetails with given id.
        """
        with OpsEventHandler(OpsEventType.DELETE_CAN_FUNDING_DETAILS) as meta:
            self.service.delete(id)
            meta.metadata.update({"Deleted CANFundingDetails": id})
            return make_response_with_headers({"message": "CANFundingDetails deleted", "id": id}, 200)


class CANFundingDetailsListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self.service = CANFundingDetailsService()

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        result = self.service.get_list()
        funding_details_schema = FundingDetailsListSchema()
        return make_response_with_headers([funding_details_schema.dump(funding_details) for funding_details in result])

    @is_authorized(PermissionType.POST, Permission.CAN)
    def post(self) -> Response:
        """
        Create a new CANFundingDetails object
        """
        with OpsEventHandler(OpsEventType.CREATE_CAN_FUNDING_DETAILS) as meta:
            request_data = request.get_json()
            schema = CreateUpdateFundingDetailsSchema()
            serialized_request = schema.load(request_data)

            created_funding_details = self.service.create(serialized_request)

            funding_details_schema = FundingDetailsSchema()
            serialized_funding_details = funding_details_schema.dump(created_funding_details)
            meta.metadata.update({"new_can_funding_details": serialized_funding_details})
            return make_response_with_headers(serialized_funding_details, 201)
