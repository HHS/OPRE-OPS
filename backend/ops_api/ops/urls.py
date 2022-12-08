from ops.models.cans import BudgetLineItem
from ops.models.cans import CAN
from ops.models.cans import CANFiscalYear
from ops.portfolio.models import Division
from ops.portfolio.models import Portfolio
from ops.portfolio.models import PortfolioStatus
from ops.resources.auth import AuthLoginAPI
from ops.resources.auth import AuthRefreshAPI
from ops.resources.budget_line_items import BudgetLineItemsItemAPI
from ops.resources.budget_line_items import BudgetLineItemsListAPI
from ops.resources.can_fiscal_year import CANFiscalYearItemAPI
from ops.resources.can_fiscal_year import CANFiscalYearListAPI
from ops.resources.can_funding_summary import CANFundingSummaryItemAPI
from ops.resources.cans import CANItemAPI
from ops.resources.cans import CANListAPI
from ops.resources.cans import CANsByPortfolioAPI
from ops.resources.divisions import DivisionsItemAPI
from ops.resources.divisions import DivisionsListAPI
from ops.resources.portfolio_calculate_funding import PortfolioCalculateFundingAPI
from ops.resources.portfolio_cans import PortfolioCansAPI
from ops.resources.portfolio_funding_summary import PortfolioFundingSummaryItemAPI
from ops.resources.portfolio_status import PortfolioStatusItemAPI
from ops.resources.portfolio_status import PortfolioStatusListAPI
from ops.resources.portfolios import PortfolioItemAPI
from ops.resources.portfolios import PortfolioListAPI
from ops.resources.users import UsersItemAPI
from ops.resources.users import UsersListAPI
from ops.user.models import User
from ops.utils import BaseModel

# Ideas from Flask docs: https://flask.palletsprojects.com/en/2.2.x/views/#method-dispatching-and-apis


def register_api(api_bp):
    register_portfolio_endpoints(api_bp)
    register_auth_endpoints(api_bp)
    register_cans_endpoints(api_bp)
    register_can_fiscal_year_endpoints(api_bp)
    register_budget_line_items_endpoints(api_bp)
    register_portfolio_status_endpoints(api_bp)
    register_divisions_endpoints(api_bp)
    register_users_endpoints(api_bp)
    register_summary_endpoints(api_bp)


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


def register_portfolio_status_endpoints(api_bp):
    api_bp.add_url_rule(
        "/portfolio-status/<int:id>",
        view_func=PortfolioStatusItemAPI.as_view(
            "portfolio-status-item", PortfolioStatus
        ),
    )
    api_bp.add_url_rule(
        "/portfolio-status/",
        view_func=PortfolioStatusListAPI.as_view(
            "portfolio-status-group", PortfolioStatus
        ),
    )


def register_divisions_endpoints(api_bp):
    api_bp.add_url_rule(
        "/divisions/<int:id>",
        view_func=DivisionsItemAPI.as_view("divisions-item", Division),
    )
    api_bp.add_url_rule(
        "/divisions/",
        view_func=DivisionsListAPI.as_view("divisions-group", Division),
    )


def register_users_endpoints(api_bp):
    api_bp.add_url_rule(
        "/users/<int:id>",
        view_func=UsersItemAPI.as_view("users-item", User),
    )
    api_bp.add_url_rule(
        "/users/",
        view_func=UsersListAPI.as_view("users-group", User),
    )


def register_summary_endpoints(api_bp):
    api_bp.add_url_rule(
        "/can-funding-summary/<int:id>",
        view_func=CANFundingSummaryItemAPI.as_view("can-funding-summary-item", CAN),
    )
    api_bp.add_url_rule(
        "/portfolio-funding-summary/<int:id>",
        view_func=PortfolioFundingSummaryItemAPI.as_view(
            "portfolio-funding-summary-item", Portfolio
        ),
    )
