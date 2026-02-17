from flask import Response, current_app
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing_extensions import Any, List

from models import Division, Portfolio
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        # Eager load relationships to prevent N+1 queries
        stmt = (
            select(Portfolio)
            .where(Portfolio.id == id)
            .options(
                selectinload(Portfolio.team_leaders),
                selectinload(Portfolio.urls),
                selectinload(Portfolio.division).selectinload(Division.division_director),
            )
        )
        item = current_app.db_session.scalar(stmt)

        if not item:
            return make_response_with_headers({}, 404)

        additional_fields = add_additional_fields_to_portfolio_response(item)
        response_dict = item.to_dict()
        response_dict.update(additional_fields)

        return make_response_with_headers(response_dict)


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self) -> Response:
        # Eager load all relationships to prevent N+1 queries
        stmt = (
            select(Portfolio)
            .options(
                selectinload(Portfolio.team_leaders),  # Many-to-many: portfolio -> users
                selectinload(Portfolio.urls),  # One-to-many: portfolio -> urls
                selectinload(Portfolio.division).selectinload(Division.division_director),  # Many-to-one with nested
            )
        )
        result = current_app.db_session.execute(stmt).scalars().all()

        portfolio_response: List[dict] = []
        for portfolio in result:
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
