from ops.models.base import BaseModel
from ops.models.cans import BudgetLineItem
from ops.models.cans import CAN
from ops.models.cans import CANFiscalYear
from ops.models.portfolios import Division
from ops.models.portfolios import Portfolio
from ops.models.portfolios import PortfolioStatus
from ops.models.research_projects import ResearchProject
from ops.models.users import User
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
from ops.resources.research_projects import ResearchProjectItemAPI
from ops.resources.research_projects import ResearchProjectListAPI
from ops.resources.users import UsersItemAPI
from ops.resources.users import UsersListAPI

# Auth endpoints
AUTH_LOGIN_API_VIEW_FUNC = AuthLoginAPI.as_view("auth-login", BaseModel)
AUTH_REFRESH_API_VIEW_FUNC = AuthRefreshAPI.as_view("auth-refresh", BaseModel)

# Portfolio endpoints
PORTFOLIO_CALCULATE_FUNDING_API_VIEW_FUNC = PortfolioCalculateFundingAPI.as_view(
    "portfolio-calculate-funding", Portfolio
)
PORTFOLIO_CANS_API_VIEW_FUNC = PortfolioCansAPI.as_view("portfolio-cans", CANFiscalYear)
PORTFOLIO_ITEM_API_VIEW_FUNC = PortfolioItemAPI.as_view("portfolio-item", Portfolio)
PORTFOLIO_LIST_API_VIEW_FUNC = PortfolioListAPI.as_view("portfolio-group", Portfolio)

# CAN ENDPOINTS
CAN_ITEM_API_VIEW_FUNC = CANItemAPI.as_view("can-item", CAN)
CAN_LIST_API_VIEW_FUNC = CANListAPI.as_view("can-group", CAN)
CANS_BY_PORTFOLIO_API_VIEW_FUNC = CANsByPortfolioAPI.as_view("can-portfolio", BaseModel)

# CAN FISCAL YEAR ENDPOINTS
CAN_FISCAL_YEAR_ITEM_API_VIEW_FUNC = CANFiscalYearItemAPI.as_view(
    "can-fiscal-year-item", CANFiscalYear
)
CAN_FISCAL_YEAR_LIST_API_VIEW_FUNC = CANFiscalYearListAPI.as_view(
    "can-fiscal-year-group", CANFiscalYear
)

# BUDGET LINE ITEM ENDPOINTS
BUDGET_LINE_ITEMS_ITEM_API_VIEW_FUNC = BudgetLineItemsItemAPI.as_view(
    "budget-line-items-item", BudgetLineItem
)
BUDGET_LINE_ITEMS_LIST_API_VIEW_FUNC = BudgetLineItemsListAPI.as_view(
    "budget-line-items-group", BudgetLineItem
)

# PORTFOLIO STATUS ENDPOINTS
PORTFOLIO_STATUS_ITEM_API_VIEW_FUNC = PortfolioStatusItemAPI.as_view(
    "portfolio-status-item", PortfolioStatus
)
PORTFOLIO_STATUS_LIST_API_VIEW_FUNC = PortfolioStatusListAPI.as_view(
    "portfolio-status-group", PortfolioStatus
)

# DIVISION ENDPOINTS
DIVISIONS_ITEM_API_VIEW_FUNC = DivisionsItemAPI.as_view("divisions-item", Division)
DIVISIONS_LIST_API_VIEW_FUNC = DivisionsListAPI.as_view("divisions-group", Division)

# USER ENDPOINTS
USERS_ITEM_API_VIEW_FUNC = UsersItemAPI.as_view("users-item", User)
USERS_LIST_API_VIEW_FUNC = UsersListAPI.as_view("users-group", User)

# FUNDING SUMMARY ENDPOINTS
CAN_FUNDING_SUMMARY_ITEM_API_VIEW_FUNC = CANFundingSummaryItemAPI.as_view(
    "can-funding-summary-item", CAN
)
PORTFOLIO_FUNDING_SUMMARY_ITEM_API_VIEW_FUNC = PortfolioFundingSummaryItemAPI.as_view(
    "portfolio-funding-summary-item", Portfolio
)

# RESEARCH PROJECT ENDPOINTS
RESEARCH_PROJECT_ITEM_API_VIEW_FUNC = ResearchProjectItemAPI.as_view("research-projects-item", ResearchProject)
RESEARCH_PROJECT_LIST_API_VIEW_FUNC = ResearchProjectListAPI.as_view("research-projects-group", ResearchProject)
