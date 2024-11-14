from flask import Response, request

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.utils.cans import aggregate_funding_summaries, filter_cans, get_can_funding_summary
from ops_api.ops.utils.response import make_response_with_headers


class CANFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self) -> Response:
        can_ids = request.args.getlist("can_ids")
        fiscal_year = request.args.get("fiscal_year")
        active_period = request.args.getlist("active_period", type=int)
        transfer = request.args.getlist("transfer")
        portfolio = request.args.getlist("portfolio")
        fy_budget = request.args.getlist("fy_budget", type=int)

        if not can_ids:
            return make_response_with_headers({"error": "'can_ids' parameter is required"}, 400)

        if len(can_ids) == 1 and not active_period and not transfer and not portfolio and not fy_budget:
            can = self._get_item(can_ids[0])
            can_funding_summary = get_can_funding_summary(can, int(fiscal_year) if fiscal_year else None)
            return make_response_with_headers(can_funding_summary)

        cans = filter_cans(
            [self._get_item(can_id) for can_id in can_ids], active_period, transfer, portfolio, fy_budget
        )

        can_funding_summaries = [
            get_can_funding_summary(can, int(fiscal_year) if fiscal_year else None) for can in cans
        ]
        aggregated_summary = aggregate_funding_summaries(can_funding_summaries)

        return make_response_with_headers(aggregated_summary)
