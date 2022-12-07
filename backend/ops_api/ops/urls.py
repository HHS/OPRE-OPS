from ops.can.models import BudgetLineItem
from ops.can.models import CAN
from ops.can.models import CANFiscalYear
from ops.portfolio.models import Portfolio
from ops.resources.auth import AuthLoginAPI
from ops.resources.auth import AuthRefreshAPI
from ops.resources.budget_line_items import BudgetLineItemsItemAPI
from ops.resources.budget_line_items import BudgetLineItemsListAPI
from ops.resources.can_fiscal_year import CANFiscalYearItemAPI
from ops.resources.can_fiscal_year import CANFiscalYearListAPI
from ops.resources.cans import CANItemAPI
from ops.resources.cans import CANListAPI
from ops.resources.cans import CANsByPortfolioAPI
from ops.resources.portfolio_calculate_funding import PortfolioCalculateFundingAPI
from ops.resources.portfolio_cans import PortfolioCansAPI
from ops.resources.portfolios import PortfolioItemAPI
from ops.resources.portfolios import PortfolioListAPI
from ops.utils import BaseModel

# Ideas from Flask docs: https://flask.palletsprojects.com/en/2.2.x/views/#method-dispatching-and-apis


def register_api(api_bp):
    register_portfolio_endpoints(api_bp)
    register_auth_endpoints(api_bp)
    register_cans_endpoints(api_bp)
    register_can_fiscal_year_endpoints(api_bp)
    register_budget_line_items_endpoints(api_bp)


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


def register_cans_endpoints(api_bp):
    api_bp.add_url_rule(
        "/cans/<int:id>",
        view_func=CANItemAPI.as_view("can-item", CAN),
    )
    api_bp.add_url_rule(
        "/cans/",
        view_func=CANListAPI.as_view("can-group", CAN),
    )
    api_bp.add_url_rule(
        "/cans/portfolio/<int:id>",
        view_func=CANsByPortfolioAPI.as_view("can-portfolio", BaseModel),
    )


def register_can_fiscal_year_endpoints(api_bp):
    api_bp.add_url_rule(
        "/can-fiscal-year/<int:id>",
        view_func=CANFiscalYearItemAPI.as_view("can-fiscal-year-item", CANFiscalYear),
    )
    api_bp.add_url_rule(
        "/can-fiscal-year/",
        view_func=CANFiscalYearListAPI.as_view("can-fiscal-year-group", CANFiscalYear),
    )


def register_budget_line_items_endpoints(api_bp):
    api_bp.add_url_rule(
        "/budget-line-items/<int:id>",
        view_func=BudgetLineItemsItemAPI.as_view(
            "budget-line-items-item", BudgetLineItem
        ),
    )
    api_bp.add_url_rule(
        "/budget-line-items/",
        view_func=BudgetLineItemsListAPI.as_view(
            "budget-line-items-group", BudgetLineItem
        ),
    )
