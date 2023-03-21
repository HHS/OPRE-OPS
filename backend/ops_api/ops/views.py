from models.base import BaseModel
from models.cans import CAN, Agreement, BudgetLineItem, CANFiscalYear
from models.portfolios import Division, Portfolio, PortfolioStatus
from models.procurement_shops import ProcurementShop
from models.research_projects import ResearchProject
from models.users import User
from ops_api.ops.resources.agreements import AgreementItemAPI, AgreementListAPI
from ops_api.ops.resources.auth import AuthLoginAPI, AuthRefreshAPI
from ops_api.ops.resources.budget_line_items import BudgetLineItemsItemAPI, BudgetLineItemsListAPI
from ops_api.ops.resources.can_fiscal_year import CANFiscalYearItemAPI, CANFiscalYearListAPI
from ops_api.ops.resources.can_funding_summary import CANFundingSummaryItemAPI
from ops_api.ops.resources.cans import CANItemAPI, CANListAPI, CANsByPortfolioAPI
from ops_api.ops.resources.divisions import DivisionsItemAPI, DivisionsListAPI
from ops_api.ops.resources.portfolio_calculate_funding import PortfolioCalculateFundingAPI
from ops_api.ops.resources.portfolio_cans import PortfolioCansAPI
from ops_api.ops.resources.portfolio_funding_summary import PortfolioFundingSummaryItemAPI
from ops_api.ops.resources.portfolio_status import PortfolioStatusItemAPI, PortfolioStatusListAPI
from ops_api.ops.resources.portfolios import PortfolioItemAPI, PortfolioListAPI
from ops_api.ops.resources.procurement_shops import ProcurementShopsItemAPI, ProcurementShopsListAPI
from ops_api.ops.resources.research_project_funding_summary import ResearchProjectFundingSummaryListAPI
from ops_api.ops.resources.research_projects import ResearchProjectItemAPI, ResearchProjectListAPI
from ops_api.ops.resources.users import UsersItemAPI, UsersListAPI

# AGREEMENT ENDPOINTS
AGREEMENT_ITEM_API_VIEW_FUNC = AgreementItemAPI.as_view("agreements-item", Agreement)
AGREEMENT_LIST_API_VIEW_FUNC = AgreementListAPI.as_view("agreements-group", Agreement)

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

# PROCUREMENT SHOP ENDPOINTS
PROCUREMENT_SHOPS_ITEM_API_VIEW_FUNC = ProcurementShopsItemAPI.as_view(
    "procurement-shops-item", ProcurementShop
)
PROCUREMENT_SHOPS_LIST_API_VIEW_FUNC = ProcurementShopsListAPI.as_view(
    "procurement-shops-group", ProcurementShop
)

# PORTFOLIO STATUS ENDPOINTS
PORTFOLIO_STATUS_ITEM_API_VIEW_FUNC = PortfolioStatusItemAPI.as_view(
    "portfolio-status-item", PortfolioStatus,
)
PORTFOLIO_STATUS_LIST_API_VIEW_FUNC = PortfolioStatusListAPI.as_view(
    "portfolio-status-group", PortfolioStatus,
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
RESEARCH_PROJECT_FUNDING_SUMMARY_LIST_API_VIEW_FUNC = (
    ResearchProjectFundingSummaryListAPI.as_view(
        "research-project-funding-summary-group", ResearchProject
    )
)

# RESEARCH PROJECT ENDPOINTS
RESEARCH_PROJECT_ITEM_API_VIEW_FUNC = ResearchProjectItemAPI.as_view(
    "research-projects-item", ResearchProject
)
RESEARCH_PROJECT_LIST_API_VIEW_FUNC = ResearchProjectListAPI.as_view(
    "research-projects-group", ResearchProject
)
