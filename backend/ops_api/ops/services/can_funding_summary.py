from typing import List, Optional

from flask import Response

from ops_api.ops.schemas.can_funding_summary import (
    GetCANFundingSummaryRequestSchema,
    GetCANFundingSummaryResponseSchema,
)
from ops_api.ops.utils.cans import aggregate_funding_summaries, get_can_funding_summary, get_filtered_cans
from ops_api.ops.utils.response import make_response_with_headers


class CANFundingSummaryService:
    def apply_filters_and_return(
        self,
        cans: list,
        fiscal_year: str = None,
        active_period: list = None,
        transfer: list = None,
        portfolio: list = None,
        fy_budget: list = None,
    ) -> Response:
        # Filter cans based on the provided parameters
        cans_with_filters = get_filtered_cans(
            cans, int(fiscal_year) if fiscal_year else None, active_period, transfer, portfolio, fy_budget
        )
        # Generate funding summaries for each filtered CAN
        can_funding_summaries = [
            get_can_funding_summary(can, int(fiscal_year) if fiscal_year else None) for can in cans_with_filters
        ]
        # Aggregate and return the final summary
        aggregated_summary = aggregate_funding_summaries(can_funding_summaries)
        return self.create_can_funding_budget_response(aggregated_summary)

    def get_single_can(self, can: dict, fiscal_year: Optional[str] = None) -> Response:
        # Get funding summary for a single CAN
        can_funding_summary = get_can_funding_summary(can, int(fiscal_year) if fiscal_year else None)
        return self.create_can_funding_budget_response(can_funding_summary)

    def get_all_cans(
        self,
        cans: List[dict],
        fiscal_year: Optional[str] = None,
        active_period: Optional[List[int]] = None,
        transfer: Optional[List[str]] = None,
        portfolio: Optional[List[str]] = None,
        fy_budget: Optional[List[int]] = None,
    ) -> Response:
        return self.apply_filters_and_return(cans, fiscal_year, active_period, transfer, portfolio, fy_budget)

    def get_list(self, cans, fiscal_year, active_period, transfer, portfolio, fy_budget):
        return self.apply_filters_and_return(cans, fiscal_year, active_period, transfer, portfolio, fy_budget)

    @staticmethod
    def create_can_funding_budget_response(result) -> Response:
        try:
            schema = GetCANFundingSummaryResponseSchema(many=False)
            result = schema.dump(result)
            return make_response_with_headers(result)
        except Exception as e:
            return make_response_with_headers({"error": "An unexpected error occurred", "details": str(e)}, 500)

    @staticmethod
    def get_can_funding_summary_request_data(request):
        """Validate and return query parameters."""
        query_params = {
            "can_ids": request.args.getlist("can_ids"),
            "fiscal_year": request.args.get("fiscal_year"),
            "active_period": request.args.getlist("active_period", type=int),
            "transfer": request.args.getlist("transfer"),
            "portfolio": request.args.getlist("portfolio"),
            "fy_budget": request.args.getlist("fy_budget", type=int),
        }

        schema = GetCANFundingSummaryRequestSchema()
        return schema.load(query_params)
