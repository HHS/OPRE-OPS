from flask import Response, request

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.portfolio_funding_summary import RequestSchema, ResponseSchema
from ops_api.ops.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.utils.portfolios import get_total_funding
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        """
        /portfolio-funding-summary/<int:id>
        """
        schema = RequestSchema()
        data = schema.load(request.args)

        portfolio = self._get_item(id)

        response_schema = ResponseSchema()
        portfolio_funding_summary = response_schema.dump(
            get_total_funding(portfolio, data.get("fiscal_year", get_current_fiscal_year()))
        )
        return make_response_with_headers(portfolio_funding_summary)
