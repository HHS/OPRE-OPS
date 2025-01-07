from flask import Response, request
from flask_jwt_extended import jwt_required

from models import OpsEventType
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.schemas.cans import CreateUpdateFundingBudgetSchema, FundingBudgetSchema
from ops_api.ops.services.can_funding_budget import CANFundingBudgetService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class CANHistoryListAPI(BaseListAPI):
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
