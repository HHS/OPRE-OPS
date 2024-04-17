from flask import Response, jsonify, request
from typing_extensions import override

from models.base import BaseModel
from ops_api.ops.auth.auth_enum import Permission, PermissionType
from ops_api.ops.auth.authorization import is_authorized
from ops_api.ops.base_views import BaseItemAPI, handle_api_error
from ops_api.ops.utils.portfolios import get_total_funding


class PortfolioCalculateFundingAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    @handle_api_error
    def get(self, id: int) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        portfolio = self._get_item(id)
        total_funding = get_total_funding(portfolio, fiscal_year)
        return jsonify(total_funding)
