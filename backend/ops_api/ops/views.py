from models import (
    CAN,
    AcquisitionPlanning,
    AdministrativeAndSupportProject,
    Agreement,
    Award,
    BaseModel,
    BudgetLineItem,
    CANFundingBudget,
    CANFundingDetails,
    CANFundingReceived,
    ChangeRequest,
    ContractAgreement,
    Division,
    Document,
    Evaluation,
    Notification,
    OpsDBHistory,
    Portfolio,
    PortfolioStatus,
    PreAward,
    PreSolicitation,
    ProcurementShop,
    ProcurementStep,
    ProductServiceCode,
    Project,
    ResearchProject,
    ResearchType,
    ServicesComponent,
    Solicitation,
    User,
)
from ops_api.ops.document.api import DocumentAPI
from ops_api.ops.resources.administrative_and_support_projects import (
    AdministrativeAndSupportProjectItemAPI,
    AdministrativeAndSupportProjectListAPI,
)
from ops_api.ops.resources.agreement_history import AgreementHistoryListAPI
from ops_api.ops.resources.agreements import (
    AgreementItemAPI,
    AgreementListAPI,
    AgreementReasonListAPI,
    AgreementTypeListAPI,
)
from ops_api.ops.resources.azure import SasToken
from ops_api.ops.resources.budget_line_items import BudgetLineItemsItemAPI, BudgetLineItemsListAPI
from ops_api.ops.resources.can_funding_received import CANFundingReceivedItemAPI, CANFundingReceivedListAPI
from ops_api.ops.resources.can_funding_budget import CANFundingBudgetItemAPI, CANFundingBudgetListAPI
from ops_api.ops.resources.can_funding_summary import CANFundingSummaryItemAPI
from ops_api.ops.resources.cans import CANItemAPI, CANListAPI, CANsByPortfolioAPI
from ops_api.ops.resources.change_requests import ChangeRequestListAPI, ChangeRequestReviewAPI
from ops_api.ops.resources.contract import ContractItemAPI, ContractListAPI
from ops_api.ops.resources.divisions import DivisionsItemAPI, DivisionsListAPI
from ops_api.ops.resources.health_check import HealthCheckAPI
from ops_api.ops.resources.history import OpsDBHistoryListAPI
from ops_api.ops.resources.notifications import NotificationItemAPI, NotificationListAPI
from ops_api.ops.resources.portfolio_calculate_funding import PortfolioCalculateFundingAPI
from ops_api.ops.resources.portfolio_cans import PortfolioCansAPI
from ops_api.ops.resources.portfolio_funding_summary import PortfolioFundingSummaryItemAPI
from ops_api.ops.resources.portfolio_status import PortfolioStatusItemAPI, PortfolioStatusListAPI
from ops_api.ops.resources.portfolios import PortfolioItemAPI, PortfolioListAPI
from ops_api.ops.resources.procurement_shops import ProcurementShopsItemAPI, ProcurementShopsListAPI
from ops_api.ops.resources.procurement_steps import (
    AcquisitionPlanningItemAPI,
    AwardItemAPI,
    EvaluationItemAPI,
    PreSolicitationItemAPI,
    ProcurementStepListAPI,
    SolicitationItemAPI,
)
from ops_api.ops.resources.product_service_code import ProductServiceCodeItemAPI, ProductServiceCodeListAPI
from ops_api.ops.resources.projects import ProjectItemAPI, ProjectListAPI
from ops_api.ops.resources.research_project_funding_summary import ResearchProjectFundingSummaryListAPI
from ops_api.ops.resources.research_projects import ResearchProjectItemAPI, ResearchProjectListAPI
from ops_api.ops.resources.research_type import ResearchTypeListAPI
from ops_api.ops.resources.services_component import ServicesComponentItemAPI, ServicesComponentListAPI
from ops_api.ops.resources.users import UsersItemAPI, UsersListAPI
from ops_api.ops.utils.version import VersionAPI

# AGREEMENT ENDPOINTS
AGREEMENT_ITEM_API_VIEW_FUNC = AgreementItemAPI.as_view("agreements-item", Agreement)
AGREEMENT_LIST_API_VIEW_FUNC = AgreementListAPI.as_view("agreements-group", Agreement)
AGREEMENT_REASON_LIST_API_VIEW_FUNC = AgreementReasonListAPI.as_view("agreement-reason-list")
# Agreement History Endpoint - specialized from OpsDBHistory
AGREEMENT_HISTORY_LIST_API_VIEW_FUNC = AgreementHistoryListAPI.as_view("agreement-history-group", OpsDBHistory)

# AGREEMENT-TYPE ENDPOINTS
AGREEMENT_TYPE_LIST_API_VIEW_FUNC = AgreementTypeListAPI.as_view("agreement-type-list")

# CONTRACT ENDPOINTS
CONTRACT_ITEM_API_VIEW_FUNC = ContractItemAPI.as_view("contract-item", ContractAgreement)
CONTRACT_LIST_API_VIEW_FUNC = ContractListAPI.as_view("contract-list", ContractListAPI)

# Portfolio endpoints
PORTFOLIO_CALCULATE_FUNDING_API_VIEW_FUNC = PortfolioCalculateFundingAPI.as_view(
    "portfolio-calculate-funding", Portfolio
)
PORTFOLIO_CANS_API_VIEW_FUNC = PortfolioCansAPI.as_view("portfolio-cans", CANFundingDetails)
PORTFOLIO_ITEM_API_VIEW_FUNC = PortfolioItemAPI.as_view("portfolio-item", Portfolio)
PORTFOLIO_LIST_API_VIEW_FUNC = PortfolioListAPI.as_view("portfolio-group", Portfolio)

# CAN ENDPOINTS
CAN_ITEM_API_VIEW_FUNC = CANItemAPI.as_view("can-item", CAN)
CAN_LIST_API_VIEW_FUNC = CANListAPI.as_view("can-group", CAN)
CANS_BY_PORTFOLIO_API_VIEW_FUNC = CANsByPortfolioAPI.as_view("can-portfolio", BaseModel)
CAN_FUNDING_RECEIVED_LIST_API_VIEW_FUNC = CANFundingReceivedListAPI.as_view(
    "can-funding-received-group", CANFundingReceived
)
CAN_FUNDING_RECEIVED_ITEM_API_VIEW_FUNC = CANFundingReceivedItemAPI.as_view(
    "can-funding-received-item", CANFundingReceived
)

# BUDGET LINE ITEM ENDPOINTS
BUDGET_LINE_ITEMS_ITEM_API_VIEW_FUNC = BudgetLineItemsItemAPI.as_view("budget-line-items-item", BudgetLineItem)
BUDGET_LINE_ITEMS_LIST_API_VIEW_FUNC = BudgetLineItemsListAPI.as_view("budget-line-items-group", BudgetLineItem)


# PRODUCT SERVICE CODES ENDPOINTS
PRODUCT_SERVICE_CODE_ITEM_API_VIEW_FUNC = ProductServiceCodeItemAPI.as_view(
    "product-service-code-item", ProductServiceCode
)
PRODUCT_SERVICE_CODE_LIST_API_VIEW_FUNC = ProductServiceCodeListAPI.as_view(
    "product-service-code-group", ProductServiceCode
)

# PROCUREMENT SHOP ENDPOINTS
PROCUREMENT_SHOPS_ITEM_API_VIEW_FUNC = ProcurementShopsItemAPI.as_view("procurement-shops-item", ProcurementShop)
PROCUREMENT_SHOPS_LIST_API_VIEW_FUNC = ProcurementShopsListAPI.as_view("procurement-shops-group", ProcurementShop)

# PORTFOLIO STATUS ENDPOINTS
PORTFOLIO_STATUS_ITEM_API_VIEW_FUNC = PortfolioStatusItemAPI.as_view(
    "portfolio-status-item",
    PortfolioStatus,
)
PORTFOLIO_STATUS_LIST_API_VIEW_FUNC = PortfolioStatusListAPI.as_view(
    "portfolio-status-group",
    PortfolioStatus,
)

# DIVISION ENDPOINTS
DIVISIONS_ITEM_API_VIEW_FUNC = DivisionsItemAPI.as_view("divisions-item", Division)
DIVISIONS_LIST_API_VIEW_FUNC = DivisionsListAPI.as_view("divisions-group", Division)

# USER ENDPOINTS
USERS_ITEM_API_VIEW_FUNC = UsersItemAPI.as_view("users-item", User)
USERS_LIST_API_VIEW_FUNC = UsersListAPI.as_view("users-group", User)

# FUNDING SUMMARY ENDPOINTS
CAN_FUNDING_SUMMARY_ITEM_API_VIEW_FUNC = CANFundingSummaryItemAPI.as_view("can-funding-summary-item", CAN)
PORTFOLIO_FUNDING_SUMMARY_ITEM_API_VIEW_FUNC = PortfolioFundingSummaryItemAPI.as_view(
    "portfolio-funding-summary-item", Portfolio
)
RESEARCH_PROJECT_FUNDING_SUMMARY_LIST_API_VIEW_FUNC = ResearchProjectFundingSummaryListAPI.as_view(
    "research-project-funding-summary-group", ResearchProject
)

# FUNDING BUDGET ENDPOINTS
CAN_FUNDING_BUDGET_ITEM_API_VIEW_FUNC = CANFundingBudgetItemAPI.as_view("can-funding-budget-item", CANFundingBudget)
CAN_FUNDING_BUDGET_LIST_API_VIEW_FUNC = CANFundingBudgetListAPI.as_view("can-funding-budget-group", CANFundingBudget)

# PROJECT ENDPOINTS
PROJECT_ITEM_API_VIEW_FUNC = ProjectItemAPI.as_view("projects-item", Project)
PROJECT_LIST_API_VIEW_FUNC = ProjectListAPI.as_view("projects-group", Project)

# RESEARCH PROJECT ENDPOINTS
RESEARCH_PROJECT_ITEM_API_VIEW_FUNC = ResearchProjectItemAPI.as_view("research-projects-item", ResearchProject)
RESEARCH_PROJECT_LIST_API_VIEW_FUNC = ResearchProjectListAPI.as_view("research-projects-group", ResearchProject)

# ADMINISTRATIVE AND SUPPORT PROJECT ENDPOINTS
ADMINISTRATIVE_AND_SUPPORT_PROJECT_ITEM_API_VIEW_FUNC = AdministrativeAndSupportProjectItemAPI.as_view(
    "administrative-and-support-projects-item", AdministrativeAndSupportProject
)
ADMINISTRATIVE_AND_SUPPORT_PROJECT_LIST_API_VIEW_FUNC = AdministrativeAndSupportProjectListAPI.as_view(
    "administrative-and-support-projects-group", AdministrativeAndSupportProject
)

# RESEARCH TYPE ENDPOINTS
RESEARCH_TYPE_LIST_API_VIEW_FUNC = ResearchTypeListAPI.as_view("research-type-group", ResearchType)

# HEALTH CHECK
HEALTH_CHECK_VIEW_FUNC = HealthCheckAPI.as_view("health-check")

# OPS DB HISTORY ENDPOINTS
OPS_DB_HISTORY_LIST_API_VIEW_FUNC = OpsDBHistoryListAPI.as_view("ops-db-history-group", OpsDBHistory)

# NOTIFICATIONS ENDPOINTS
NOTIFICATIONS_ITEM_API_VIEW_FUNC = NotificationItemAPI.as_view("notifications-item", Notification)
NOTIFICATIONS_LIST_API_VIEW_FUNC = NotificationListAPI.as_view("notifications-group", Notification)

# ServicesComponent ENDPOINTS
SERVICES_COMPONENT_ITEM_API_VIEW_FUNC = ServicesComponentItemAPI.as_view("services-component-item", ServicesComponent)
SERVICES_COMPONENT_LIST_API_VIEW_FUNC = ServicesComponentListAPI.as_view("services-component-group", ServicesComponent)

# Azure SAS Token ENDPOINTS
AZURE_SAS_TOKEN_VIEW_FUNC = SasToken.as_view("azure-sas-token")

# Procurement: Generic Step ENDPOINT
PROCUREMENT_STEP_LIST_API_VIEW_FUNC = ProcurementStepListAPI.as_view("procurement-step-group", ProcurementStep)

# Procurement: AcquisitionPlanning ENDPOINT
PROCUREMENT_ACQUISITION_PLANNING_ITEM_API_VIEW_FUNC = AcquisitionPlanningItemAPI.as_view(
    "procurement-acquisition-planning-item", AcquisitionPlanning
)

# Procurement: PreSolicitation ENDPOINT
PROCUREMENT_PRE_SOLICITATION_ITEM_API_VIEW_FUNC = PreSolicitationItemAPI.as_view(
    "procurement-pre-solicitation-item", PreSolicitation
)

# Procurement: Solicitation ENDPOINT
PROCUREMENT_SOLICITATION_ITEM_API_VIEW_FUNC = SolicitationItemAPI.as_view("procurement-solicitation-item", Solicitation)

# Procurement: Evaluation ENDPOINT
PROCUREMENT_EVALUATION_ITEM_API_VIEW_FUNC = EvaluationItemAPI.as_view("procurement-evaluation-item", Evaluation)

# Procurement: PreAward ENDPOINT
PROCUREMENT_PRE_AWARD_ITEM_API_VIEW_FUNC = EvaluationItemAPI.as_view("procurement-pre-award-item", PreAward)

# Procurement: Award ENDPOINT
PROCUREMENT_AWARD_ITEM_API_VIEW_FUNC = AwardItemAPI.as_view("procurement-award-item", Award)

# Version Endpoint View
VERSION_API_VIEW_FUNC = VersionAPI.as_view("version_api")

# Change Request ENDPOINTs
CHANGE_REQUEST_LIST_API_VIEW_FUNC = ChangeRequestListAPI.as_view("change-request-list", ChangeRequest)
CHANGE_REQUEST_REVIEW_API_VIEW_FUNC = ChangeRequestReviewAPI.as_view("change-request-review-list", ChangeRequest)

# Document ENDPOINTs
DOCUMENT_API_FUNC = DocumentAPI.as_view("documents", Document)
