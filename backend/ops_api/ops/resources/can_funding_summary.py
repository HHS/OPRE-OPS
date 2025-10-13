from flask import Response, request

from models import CANMethodOfTransfer
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.can_funding_summary import (
    GetCANFundingSummaryRequestSchema,
    GetCANFundingSummaryResponseSchema,
)
from ops_api.ops.services.can_funding_summary import CANFundingSummaryService
from ops_api.ops.utils.response import make_response_with_headers


class CANFundingSummaryListAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self.service = CANFundingSummaryService()

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self) -> Response:
        schema = GetCANFundingSummaryRequestSchema()
        data = schema.load(request.args)

        can_ids = data["can_ids"]
        fiscal_year = data["fiscal_year"]
        active_period = data["active_period"]
        transfer = data["transfer"]
        portfolio = data["portfolio"]
        fy_budget = data["fy_budget"]

        response_schema = GetCANFundingSummaryResponseSchema(many=False)

        # Ensure required 'can_ids' parameter is provided
        if not can_ids:
            return make_response_with_headers({"Error": "'can_ids' parameter is required"}, 400)

        if fy_budget and len(fy_budget) != 2:
            return make_response_with_headers(
                {"Error": "'fy_budget' must be two integers for min and max budget values."}, 400
            )

        # Ensure transfer can map to CANMethodOfTransfer enum
        if transfer:
            is_transfer_valid, transfer = self.service.get_mapped_transfer_value(transfer)
            valid_transfer_methods = list(CANMethodOfTransfer.__members__.keys())
            if not is_transfer_valid:
                error_message = f"Invalid 'transfer' value. Must be one of: {', '.join(valid_transfer_methods)}."
                return make_response_with_headers({"Error": error_message}, 400)

        # When 'can_ids' is 0 (all CANS)
        if can_ids == ["0"]:
            cans = self._get_all_items()
            result = self.service.get_all_cans(cans, fiscal_year, active_period, transfer, portfolio, fy_budget)
            return make_response_with_headers(response_schema.dump(result))

        # Single 'can_id' without additional filters
        if len(can_ids) == 1 and not (active_period or transfer or portfolio or fy_budget):
            can = self._get_item(can_ids[0])
            result = self.service.get_single_can(can, fiscal_year)
            return make_response_with_headers(response_schema.dump(result))

        # Multiple 'can_ids' with filters
        cans = [self._get_item(can_id) for can_id in can_ids]
        result = self.service.get_list(cans, fiscal_year, active_period, transfer, portfolio, fy_budget)
        return make_response_with_headers(response_schema.dump(result))
