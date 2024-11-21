from flask import Response, request

from marshmallow import ValidationError
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.can_funding_summary import GetCANFundingSummaryResponseSchema
from ops_api.ops.utils.cans import aggregate_funding_summaries, get_can_funding_summary, get_filtered_cans
from ops_api.ops.utils.response import make_response_with_headers


class CANFundingSummaryListAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self) -> Response:
        # Get query parameters
        can_ids = request.args.getlist("can_ids")
        fiscal_year = request.args.get("fiscal_year")
        active_period = request.args.getlist("active_period", type=int)
        transfer = request.args.getlist("transfer")
        portfolio = request.args.getlist("portfolio")
        fy_budget = request.args.getlist("fy_budget", type=int)

        # Ensure required 'can_ids' parameter is provided
        if not can_ids:
            return make_response_with_headers({"error": "'can_ids' parameter is required"}, 400)

        # When 'can_ids' is 0 (all CANS)
        if can_ids == ["0"]:
            cans = self._get_all_items()
            return self._apply_filters_and_return(cans, fiscal_year, active_period, transfer, portfolio, fy_budget)

        # Single 'can_id' without additional filters
        if len(can_ids) == 1 and not (active_period or transfer or portfolio or fy_budget):
            return self._handle_single_can_no_filters(can_ids[0], fiscal_year)

        # Multiple 'can_ids' with filters
        cans = [self._get_item(can_id) for can_id in can_ids]
        return self._apply_filters_and_return(cans, fiscal_year, active_period, transfer, portfolio, fy_budget)

    def _handle_single_can_no_filters(self, can_id: str, fiscal_year: str = None) -> Response:
        can = self._get_item(can_id)
        can_funding_summary = get_can_funding_summary(can, int(fiscal_year) if fiscal_year else None)
        return self._create_can_funding_budget_response(can_funding_summary)

    def _apply_filters_and_return(
        self,
        cans: list,
        fiscal_year: str = None,
        active_period: list = None,
        transfer: list = None,
        portfolio: list = None,
        fy_budget: list = None,
    ) -> Response:
        cans_with_filters = get_filtered_cans(
            cans, int(fiscal_year) if fiscal_year else None, active_period, transfer, portfolio, fy_budget
        )
        can_funding_summaries = [
            get_can_funding_summary(can, int(fiscal_year) if fiscal_year else None) for can in cans_with_filters
        ]
        aggregated_summary = aggregate_funding_summaries(can_funding_summaries)
        return self._create_can_funding_budget_response(aggregated_summary)

    @staticmethod
    def _create_can_funding_budget_response(result) -> Response:
        try:
            schema = GetCANFundingSummaryResponseSchema(many=False)
            result = schema.dump(result)
            return make_response_with_headers(result)
        except ValidationError as e:
            return make_response_with_headers({"Validation Error": str(e)}, 500)
