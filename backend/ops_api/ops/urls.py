from ops.can.models import CAN
from ops.portfolio.models import Portfolio
from ops.resources.auth import AuthLoginAPI
from ops.resources.auth import AuthRefreshAPI
from ops.resources.portfolio import PortfolioItemAPI
from ops.resources.portfolio import PortfolioListAPI
from ops.resources.portfolio_calculate_funding import PortfolioCalculateFundingAPI
from ops.resources.portfolio_cans import PortfolioCansAPI
from ops.utils import BaseModel

# Ideas from Flask docs: https://flask.palletsprojects.com/en/2.2.x/views/#method-dispatching-and-apis


def register_api(api_bp):
    register_portfolio_endpoints(api_bp)
    register_auth_endpoints(api_bp)


def register_auth_endpoints(api_bp):
    api_bp.add_url_rule(
        "/auth/login/",
        view_func=AuthLoginAPI.as_view("auth-login", BaseModel),
    )

    api_bp.add_url_rule(
        "/auth/refresh/",
        view_func=AuthRefreshAPI.as_view("auth-refresh", BaseModel),
    )


def register_portfolio_endpoints(api_bp):
    api_bp.add_url_rule(
        "/portfolios/<int:id>/calcFunding/",
        view_func=PortfolioCalculateFundingAPI.as_view(
            "portfolio-calculate-funding", Portfolio
        ),
    )

    api_bp.add_url_rule(
        "/portfolios/<int:id>/cans/",
        view_func=PortfolioCansAPI.as_view("portfolio-cans", CAN),
    )

    api_bp.add_url_rule(
        "/portfolios/<int:id>",
        view_func=PortfolioItemAPI.as_view("portfolio-item", Portfolio),
    )
    api_bp.add_url_rule(
        "/portfolios/",
        view_func=PortfolioListAPI.as_view("portfolio-group", Portfolio),
    )
