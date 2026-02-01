from models import (
    CAN,
    AdministrativeAndSupportProject,
    Agreement,
    AgreementAgency,
    BaseModel,
    BudgetLineItem,
    CANFundingBudget,
    CANFundingDetails,
    CANFundingReceived,
    CANHistory,
    ChangeRequest,
    Division,
    Document,
    Notification,
    OpsDBHistory,
    Portfolio,
    PortfolioStatus,
    PortfolioUrl,
    ProcurementAction,
    ProcurementShop,
    ProcurementTracker,
    ProcurementTrackerStep,
    ProductServiceCode,
    Project,
    ResearchMethodology,
    ResearchProject,
    ResearchType,
    ServicesComponent,
    SpecialTopic,
    User,
)
from ops_api.ops.document.api import DocumentAPI
from ops_api.ops.resources.administrative_and_support_projects import (
    AdministrativeAndSupportProjectItemAPI,
    AdministrativeAndSupportProjectListAPI,
)
from ops_api.ops.resources.agreement_agency import (
    AgreementAgencyItemAPI,
    AgreementAgencyListAPI,
)
from ops_api.ops.resources.agreement_history import AgreementHistoryListAPI
from ops_api.ops.resources.agreements import (
    AgreementItemAPI,
    AgreementListAPI,
    AgreementListFilterOptionAPI,
    AgreementReasonListAPI,
    AgreementTypeListAPI,
)
from ops_api.ops.resources.azure import SasToken
from ops_api.ops.resources.budget_line_items import (
    BudgetLineItemsItemAPI,
    BudgetLineItemsListAPI,
    BudgetLineItemsListFilterOptionAPI,
)
from ops_api.ops.resources.can_funding_budget import (
    CANFundingBudgetItemAPI,
    CANFundingBudgetListAPI,
)
from ops_api.ops.resources.can_funding_details import (
    CANFundingDetailsItemAPI,
    CANFundingDetailsListAPI,
)
from ops_api.ops.resources.can_funding_received import (
    CANFundingReceivedItemAPI,
    CANFundingReceivedListAPI,
)
from ops_api.ops.resources.can_funding_summary import CANFundingSummaryListAPI
from ops_api.ops.resources.can_history import CANHistoryListAPI
from ops_api.ops.resources.cans import CANItemAPI, CANListAPI, CANsByPortfolioAPI
from ops_api.ops.resources.change_requests import ChangeRequestListAPI
from ops_api.ops.resources.divisions import DivisionsItemAPI, DivisionsListAPI
from ops_api.ops.resources.health_check import HealthCheckAPI
from ops_api.ops.resources.notifications import NotificationItemAPI, NotificationListAPI
from ops_api.ops.resources.portfolio_calculate_funding import (
    PortfolioCalculateFundingAPI,
)
from ops_api.ops.resources.portfolio_cans import PortfolioCansAPI
from ops_api.ops.resources.portfolio_funding_summary import (
    PortfolioFundingSummaryItemAPI,
    PortfolioFundingSummaryListAPI,
)
from ops_api.ops.resources.portfolio_status import (
    PortfolioStatusItemAPI,
    PortfolioStatusListAPI,
)
from ops_api.ops.resources.portfolios import PortfolioItemAPI, PortfolioListAPI
from ops_api.ops.resources.portfolios_url import (
    PortfolioUrlItemAPI,
    PortfolioUrlListAPI,
)
from ops_api.ops.resources.procurement_actions import (
    ProcurementActionItemAPI,
    ProcurementActionListAPI,
)
from ops_api.ops.resources.procurement_shops import (
    ProcurementShopsItemAPI,
    ProcurementShopsListAPI,
)
from ops_api.ops.resources.procurement_tracker_steps import (
    ProcurementTrackerStepItemAPI,
    ProcurementTrackerStepListAPI,
)
from ops_api.ops.resources.procurement_trackers import (
    ProcurementTrackerItemAPI,
    ProcurementTrackerListAPI,
)
from ops_api.ops.resources.product_service_code import (
    ProductServiceCodeItemAPI,
    ProductServiceCodeListAPI,
)
from ops_api.ops.resources.projects import ProjectItemAPI, ProjectListAPI
from ops_api.ops.resources.research_methodology import (
    ResearchMethodologyItemAPI,
    ResearchMethodologyListAPI,
)
from ops_api.ops.resources.research_project_funding_summary import (
    ResearchProjectFundingSummaryListAPI,
)
from ops_api.ops.resources.research_projects import (
    ResearchProjectItemAPI,
    ResearchProjectListAPI,
)
from ops_api.ops.resources.research_type import ResearchTypeListAPI
from ops_api.ops.resources.services_component import (
    ServicesComponentItemAPI,
    ServicesComponentListAPI,
)
from ops_api.ops.resources.special_topics import (
    SpecialTopicsItemAPI,
    SpecialTopicsListAPI,
)
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

# AGREEMENT FILTER OPTIONS ENDPOINT
AGREEMENT_LIST_FILTER_OPTION_API_VIEW_FUNC = AgreementListFilterOptionAPI.as_view("agreements-filters", Agreement)

# AGREEMENT AGENCY ENDPOINTS
AGREEMENT_AGENCY_ITEM_API_VIEW_FUNC = AgreementAgencyItemAPI.as_view("agreement-agency-item", AgreementAgency)
AGREEMENT_AGENCY_LIST_API_VIEW_FUNC = AgreementAgencyListAPI.as_view("agreement-agency-group", AgreementAgency)

# Portfolio endpoints
PORTFOLIO_CALCULATE_FUNDING_API_VIEW_FUNC = PortfolioCalculateFundingAPI.as_view(
    "portfolio-calculate-funding", Portfolio
)
PORTFOLIO_CANS_API_VIEW_FUNC = PortfolioCansAPI.as_view("portfolio-cans", CANFundingDetails)
PORTFOLIO_ITEM_API_VIEW_FUNC = PortfolioItemAPI.as_view("portfolio-item", Portfolio)
PORTFOLIO_LIST_API_VIEW_FUNC = PortfolioListAPI.as_view("portfolio-group", Portfolio)

PORTFOLIO_URL_ITEM_API_VIEW_FUNC = PortfolioUrlItemAPI.as_view("portfolio-url-item", PortfolioUrl)
PORTFOLIO_URL_LIST_API_VIEW_FUNC = PortfolioUrlListAPI.as_view("portfolio-url-group", PortfolioUrl)

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
CAN_HISTORY_LIST_API_VIEW_FUNC = CANHistoryListAPI.as_view("can-history-group", CANHistory)

# BUDGET LINE ITEM ENDPOINTS
BUDGET_LINE_ITEMS_ITEM_API_VIEW_FUNC = BudgetLineItemsItemAPI.as_view("budget-line-items-item", BudgetLineItem)
BUDGET_LINE_ITEMS_LIST_API_VIEW_FUNC = BudgetLineItemsListAPI.as_view("budget-line-items-group", BudgetLineItem)
BUDGET_LINE_ITEMS_LIST_FILTER_OPTION_API_VIEW_FUNC = BudgetLineItemsListFilterOptionAPI.as_view(
    "budget-line-items-filters", BudgetLineItem
)


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


# PROCUREMENT TRACKER STEP ENDPOINTS
PROCUREMENT_TRACKER_STEP_ITEM_API_VIEW_FUNC = ProcurementTrackerStepItemAPI.as_view(
    "procurement-tracker-steps-item", ProcurementTrackerStep
)
PROCUREMENT_TRACKER_STEP_LIST_API_VIEW_FUNC = ProcurementTrackerStepListAPI.as_view(
    "procurement-tracker-steps-group", ProcurementTrackerStep
)
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
CAN_FUNDING_SUMMARY_LIST_API_VIEW_FUNC = CANFundingSummaryListAPI.as_view("can-funding-summary-list", CAN)
PORTFOLIO_FUNDING_SUMMARY_ITEM_API_VIEW_FUNC = PortfolioFundingSummaryItemAPI.as_view(
    "portfolio-funding-summary-item", Portfolio
)
PORTFOLIO_FUNDING_SUMMARY_LIST_API_VIEW_FUNC = PortfolioFundingSummaryListAPI.as_view(
    "portfolio-funding-summary-list", Portfolio
)
RESEARCH_PROJECT_FUNDING_SUMMARY_LIST_API_VIEW_FUNC = ResearchProjectFundingSummaryListAPI.as_view(
    "research-project-funding-summary-group", ResearchProject
)

# FUNDING BUDGET ENDPOINTS
CAN_FUNDING_BUDGET_ITEM_API_VIEW_FUNC = CANFundingBudgetItemAPI.as_view("can-funding-budget-item", CANFundingBudget)
CAN_FUNDING_BUDGET_LIST_API_VIEW_FUNC = CANFundingBudgetListAPI.as_view("can-funding-budget-group", CANFundingBudget)

# FUNDING DETAILS ENDPOINTS
CAN_FUNDING_DETAILS_ITEM_API_VIEW_FUNC = CANFundingDetailsItemAPI.as_view("can-funding-details-item", CANFundingDetails)
CAN_FUNDING_DETAILS_LIST_API_VIEW_FUNC = CANFundingDetailsListAPI.as_view(
    "can-funding-details-group", CANFundingDetails
)

# PROJECT ENDPOINTS
PROJECT_ITEM_API_VIEW_FUNC = ProjectItemAPI.as_view("projects-item", Project)
PROJECT_LIST_API_VIEW_FUNC = ProjectListAPI.as_view("projects-group", Project)

# RESEARCH PROJECT ENDPOINTS
RESEARCH_PROJECT_ITEM_API_VIEW_FUNC = ResearchProjectItemAPI.as_view("research-projects-item", ResearchProject)
RESEARCH_PROJECT_LIST_API_VIEW_FUNC = ResearchProjectListAPI.as_view("research-projects-group", ResearchProject)

RESEARCH_METHODOLOGY_ITEM_API_VIEW_FUNC = ResearchMethodologyItemAPI.as_view(
    "research-methodology-item", ResearchMethodology
)
RESEARCH_METHODOLOGY_LIST_API_VIEW_FUNC = ResearchMethodologyListAPI.as_view(
    "research-methodology-list", ResearchMethodology
)
SPECIAL_TOPICS_ITEM_API_VIEW_FUNC = SpecialTopicsItemAPI.as_view("special-topics-item", SpecialTopic)
SPECIAL_TOPICS_LIST_API_VIEW_FUNC = SpecialTopicsListAPI.as_view("special-topics-list", SpecialTopic)

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

# NOTIFICATIONS ENDPOINTS
NOTIFICATIONS_ITEM_API_VIEW_FUNC = NotificationItemAPI.as_view("notifications-item", Notification)
NOTIFICATIONS_LIST_API_VIEW_FUNC = NotificationListAPI.as_view("notifications-group", Notification)

# ServicesComponent ENDPOINTS
SERVICES_COMPONENT_ITEM_API_VIEW_FUNC = ServicesComponentItemAPI.as_view("services-component-item", ServicesComponent)
SERVICES_COMPONENT_LIST_API_VIEW_FUNC = ServicesComponentListAPI.as_view("services-component-group", ServicesComponent)

# Azure SAS Token ENDPOINTS
AZURE_SAS_TOKEN_VIEW_FUNC = SasToken.as_view("azure-sas-token")

# PROCUREMENT ACTION ENDPOINTS
PROCUREMENT_ACTION_ITEM_API_VIEW_FUNC = ProcurementActionItemAPI.as_view("procurement-actions-item", ProcurementAction)
PROCUREMENT_ACTION_LIST_API_VIEW_FUNC = ProcurementActionListAPI.as_view("procurement-actions-group", ProcurementAction)

# PROCUREMENT TRACKER ENDPOINTS
PROCUREMENT_TRACKER_ITEM_API_VIEW_FUNC = ProcurementTrackerItemAPI.as_view(
    "procurement-trackers-item", ProcurementTracker
)
PROCUREMENT_TRACKER_LIST_API_VIEW_FUNC = ProcurementTrackerListAPI.as_view(
    "procurement-trackers-list", ProcurementTracker
)

# Version Endpoint View
VERSION_API_VIEW_FUNC = VersionAPI.as_view("version_api")

# CHANGE REQUEST ENDPOINTs
CHANGE_REQUEST_LIST_API_VIEW_FUNC = ChangeRequestListAPI.as_view("change-requests-list", ChangeRequest)

# Document ENDPOINTs
DOCUMENT_API_FUNC = DocumentAPI.as_view("documents", Document)
