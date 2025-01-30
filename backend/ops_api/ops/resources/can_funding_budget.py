from flask import Response, request
from flask_jwt_extended import jwt_required

from models import OpsEventType
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.cans import CreateUpdateFundingBudgetSchema, FundingBudgetSchema
from ops_api.ops.services.can_funding_budget import CANFundingBudgetService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler, generate_events_update
from ops_api.ops.utils.response import make_response_with_headers


class CANFundingBudgetItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)
        self.service = CANFundingBudgetService()

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self, id: int) -> Response:
        schema = FundingBudgetSchema()
        item = self.service.get(id)
        return make_response_with_headers(schema.dump(item))

    @is_authorized(PermissionType.PATCH, Permission.CAN)
    def patch(self, id: int) -> Response:
        """
        Update a CANFundingBudget with only the fields provided in the request body.
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN_FUNDING_BUDGET) as meta:
            request_data = request.get_json()
            # Setting partial to true ignores any missing fields.
            schema = CreateUpdateFundingBudgetSchema(partial=True)
            serialized_request = schema.load(request_data)

            old_funding_budget = self.service.get(id)
            serialized_old_funding_budget = schema.dump(old_funding_budget)
            updated_funding_budget = self.service.update(serialized_request, id)
            serialized_can_funding_budget = schema.dump(updated_funding_budget)
            updates = generate_events_update(
                serialized_old_funding_budget,
                serialized_can_funding_budget,
                updated_funding_budget.can_id,
                updated_funding_budget.updated_by,
            )
            meta.metadata.update({"funding_budget_updates": updates})
            return make_response_with_headers(serialized_can_funding_budget)

    @is_authorized(PermissionType.PUT, Permission.CAN)
    def put(self, id: int) -> Response:
        """
        Update a CANFundingBudget
        """
        with OpsEventHandler(OpsEventType.UPDATE_CAN_FUNDING_BUDGET) as meta:
            request_data = request.get_json()
            schema = CreateUpdateFundingBudgetSchema()
            serialized_request = schema.load(request_data)

            old_funding_budget = self.service.get(id)
            serialized_old_funding_budget = schema.dump(old_funding_budget)
            updated_funding_budget = self.service.update(serialized_request, id)
            serialized_can_funding_budget = schema.dump(updated_funding_budget)
            updates = generate_events_update(
                serialized_old_funding_budget,
                serialized_can_funding_budget,
                updated_funding_budget.can_id,
                updated_funding_budget.updated_by,
            )
            meta.metadata.update({"funding_budget_updates": updates})
            return make_response_with_headers(serialized_can_funding_budget)

    @is_authorized(PermissionType.DELETE, Permission.CAN)
    def delete(self, id: int) -> Response:
        """
        Delete a CANFundingBudget with given id.
        """
        with OpsEventHandler(OpsEventType.DELETE_CAN_FUNDING_BUDGET) as meta:
            self.service.delete(id)
            meta.metadata.update({"Deleted CANFundingBudget": id})
            return make_response_with_headers({"message": "CANFundingBudget deleted", "id": id}, 200)


class CANFundingBudgetListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self.service = CANFundingBudgetService()

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        result = self.service.get_list()
        funding_budget_schema = FundingBudgetSchema()
        return make_response_with_headers([funding_budget_schema.dump(funding_budget) for funding_budget in result])

    @is_authorized(PermissionType.POST, Permission.CAN)
    def post(self) -> Response:
        """
        Create a new CANFundingBudget object
        """
        with OpsEventHandler(OpsEventType.CREATE_CAN_FUNDING_BUDGET) as meta:
            request_data = request.get_json()
            schema = CreateUpdateFundingBudgetSchema()
            serialized_request = schema.load(request_data)

            created_funding_budget = self.service.create(serialized_request)

            funding_budget_schema = FundingBudgetSchema()
            serialized_funding_budget = funding_budget_schema.dump(created_funding_budget)
            meta.metadata.update({"new_can_funding_budget": serialized_funding_budget})
            return make_response_with_headers(serialized_funding_budget, 201)
