from flask import Response, current_app
from models import Portfolio
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error, handle_sql_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy import select
from typing_extensions import Any, List, override


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    @handle_api_error
    def get(self, id: int) -> Response:
        with handle_sql_error():
            item = self._get_item(id)
            additional_fields = add_additional_fields_to_portfolio_response(item)

        return self._get_item_with_try(id, additional_fields=additional_fields)


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    @handle_api_error
    def get(self) -> Response:
        result = current_app.db_session.execute(select(Portfolio)).all()

        portfolio_response: List[dict] = []
        for item in result:
            for portfolio in item:
                additional_fields = add_additional_fields_to_portfolio_response(portfolio)
                project_dict = portfolio.to_dict()
                project_dict.update(additional_fields)
                portfolio_response.append(project_dict)

        return make_response_with_headers(portfolio_response)


def add_additional_fields_to_portfolio_response(
    portfolio: Portfolio,
) -> dict[str, Any]:
    """
    Add additional fields to the portfolio response.

    N.B. This is a temporary solution to add additional fields to the response.
    This should be refactored to use marshmallow.
    Also, the frontend/OpenAPI needs to be refactored to not use these fields.
    """
    if not portfolio:
        return {}

    return {
        "team_leaders": [tm.to_dict() for tm in portfolio.team_leaders],
        "division": portfolio.division.to_dict() if portfolio.division else None,
    }
