"""
Performance testing suite for OPS API using Locust.

This test suite provides comprehensive performance testing for the OPS API endpoints
with JWT authentication support and configurable throttling.

Usage:
    locust -f locustfile.py --host=http://localhost:8080

Environment Variables:
    JWT_TOKEN: The JWT access token for authentication (required)
    API_HOST: Base URL for the API (default: http://localhost:8080)
    MIN_WAIT: Minimum wait time between requests in ms (default: 1000)
    MAX_WAIT: Maximum wait time between requests in ms (default: 3000)
"""

# flake8: noqa: S311

import os
import random

from locust import HttpUser, between, events, task
from locust.exception import StopUser
from loguru import logger

# Shared cache populated once at test start and shared by all users
# This eliminates the need for per-user cache population which causes
# multiple simultaneous requests to slow endpoints (especially budget-line-items)
SHARED_CACHE = {
    "can_ids": [],
    "agreement_ids": [],
    "project_ids": [],
    "portfolio_ids": [],
    "bli_ids": [],
    "notification_ids": [],
    "user_ids": [],
    "research_project_ids": [],
    "admin_support_project_ids": [],
    "division_ids": [],
    "procurement_shop_ids": [],
    "product_service_code_ids": [],
    "services_component_ids": [],
    "agreement_agency_ids": [],
    "can_funding_details_ids": [],
    "can_funding_budget_ids": [],
    "can_funding_received_ids": [],
    "portfolio_url_ids": [],
    "procurement_tracker_ids": [],
    "procurement_tracker_step_ids": [],
    "procurement_action_ids": [],
}


class OPSAPIUser(HttpUser):
    """
    Simulates a user interacting with the OPS API.

    The wait_time defines throttling between requests to avoid overloading the API.
    Default: between 1-3 seconds between requests.
    """

    # Throttle requests: wait 1-3 seconds between tasks
    min_wait = int(os.getenv("MIN_WAIT", 1000))
    max_wait = int(os.getenv("MAX_WAIT", 3000))
    wait_time = between(min_wait / 1000, max_wait / 1000)

    def on_start(self):
        """
        Initialize user session with JWT token.

        Note: Cache is populated once at test start (shared by all users) rather than
        per-user to avoid overwhelming slow endpoints like /api/v1/budget-line-items/
        """
        self.jwt_token = os.getenv("JWT_TOKEN")

        if not self.jwt_token:
            print("ERROR: JWT_TOKEN environment variable is required")
            print("Please set JWT_TOKEN before running the tests")
            raise StopUser()

        # Set default headers for all requests
        # NOTE: Do NOT set Content-Type header globally - it causes 400 errors on GET requests
        # Content-Type should only be sent with POST/PUT/PATCH requests
        api_host = os.getenv("API_HOST", "http://localhost:8080")

        # Determine the referer based on the API host
        if "localhost" in api_host:
            referer = "http://localhost:3000"
        else:
            referer = api_host  # fallback

        self.headers = {
            "Authorization": f"Bearer {self.jwt_token}",
            "Accept": "application/json",
            "User-Agent": "Locust Performance Test",
            "Referer": referer,
        }

        # Redact Authorization header before logging
        redacted_headers = self.headers.copy()
        if "Authorization" in redacted_headers:
            redacted_headers["Authorization"] = "Bearer [REDACTED]"
        logger.debug(f"Using API Headers: {redacted_headers}")

        # Configure client headers
        self.client.headers.update(self.headers)

        # No per-user cache population - use SHARED_CACHE populated at test start

    # === Authentication & User Tasks ===

    @task(3)
    def list_users(self):
        """GET /api/v1/users/ - List all users."""
        self.client.get("/api/v1/users/", name="/api/v1/users/")

    @task(2)
    def get_user_detail(self):
        """GET /api/v1/users/{id} - Get specific user details."""
        if SHARED_CACHE.get("user_ids"):
            user_id = random.choice(SHARED_CACHE["user_ids"])
            self.client.get(f"/api/v1/users/{user_id}", name="/api/v1/users/[id]")

    # === CAN (Contract Account Number) Tasks ===

    @task(7)
    def list_cans(self):
        """GET /api/v1/cans/ - List all CANs."""
        self.client.get("/api/v1/cans/", name="/api/v1/cans/")

    @task(5)
    def get_can_detail(self):
        """GET /api/v1/cans/{id} - Get specific CAN details."""
        if SHARED_CACHE["can_ids"]:
            can_id = random.choice(SHARED_CACHE["can_ids"])
            self.client.get(f"/api/v1/cans/{can_id}", name="/api/v1/cans/[id]")

    # === Agreement Tasks ===

    @task(10)
    def list_agreements(self):
        """GET /api/v1/agreements/ - List all agreements."""
        self.client.get("/api/v1/agreements/", name="/api/v1/agreements/")

    @task(5)
    def get_agreement_detail(self):
        """GET /api/v1/agreements/{id} - Get specific agreement details."""
        if SHARED_CACHE["agreement_ids"]:
            agreement_id = random.choice(SHARED_CACHE["agreement_ids"])
            self.client.get(f"/api/v1/agreements/{agreement_id}", name="/api/v1/agreements/[id]")

    # === Notification     Tasks ===
    @task(10)
    def list_notifications(self):
        """GET /api/v1/notifications/ - List all notifications."""
        self.client.get("/api/v1/notifications/", name="/api/v1/notifications/")

    @task(5)
    def get_notification_detail(self):
        """GET /api/v1/notifications/{id} - Get specific notification details."""
        if SHARED_CACHE["notification_ids"]:
            notification_id = random.choice(SHARED_CACHE["notification_ids"])
            self.client.get(
                f"/api/v1/notifications/{notification_id}",
                name="/api/v1/notifications/[id]",
            )

    # === Budget Line Item Tasks ===

    @task(4)
    def get_budget_line_item_detail(self):
        """GET /api/v1/budget-line-items/{id} - Get specific budget line item."""
        if SHARED_CACHE["bli_ids"]:
            bli_id = random.choice(SHARED_CACHE["bli_ids"])
            self.client.get(
                f"/api/v1/budget-line-items/{bli_id}",
                name="/api/v1/budget-line-items/[id]",
            )

    # === Project Tasks ===

    @task(7)
    def list_projects(self):
        """GET /api/v1/projects/ - List all projects."""
        self.client.get("/api/v1/projects/", name="/api/v1/projects/")

    @task(4)
    def get_project_detail(self):
        """GET /api/v1/projects/{id} - Get specific project details."""
        if SHARED_CACHE["project_ids"]:
            project_id = random.choice(SHARED_CACHE["project_ids"])
            self.client.get(f"/api/v1/projects/{project_id}", name="/api/v1/projects/[id]")

    # === Portfolio Tasks ===

    @task(6)
    def list_portfolios(self):
        """GET /api/v1/portfolios/ - List all portfolios."""
        self.client.get("/api/v1/portfolios/", name="/api/v1/portfolios/")

    @task(3)
    def get_portfolio_detail(self):
        """GET /api/v1/portfolios/{id} - Get specific portfolio details."""
        if SHARED_CACHE["portfolio_ids"]:
            portfolio_id = random.choice(SHARED_CACHE["portfolio_ids"])
            self.client.get(f"/api/v1/portfolios/{portfolio_id}", name="/api/v1/portfolios/[id]")

    # === Search & Filter Tasks ===

    @task(5)
    def search_agreements_by_project(self):
        """GET /api/v1/agreements/?project_id={id} - Filter agreements by project."""
        if SHARED_CACHE["project_ids"]:
            project_id = random.choice(SHARED_CACHE["project_ids"])
            self.client.get(
                f"/api/v1/agreements/?project_id={project_id}",
                name="/api/v1/agreements/?project_id=[id]",
            )

    @task(5)
    def search_budget_line_items_by_agreement(self):
        """GET /api/v1/budget-line-items/?agreement_id={id} - Filter BLIs by agreement."""
        if SHARED_CACHE["agreement_ids"]:
            agreement_id = random.choice(SHARED_CACHE["agreement_ids"])
            self.client.get(
                f"/api/v1/budget-line-items/?agreement_id={agreement_id}",
                name="/api/v1/budget-line-items/?agreement_id=[id]",
            )

    @task(4)
    def search_budget_line_items_by_can(self):
        """GET /api/v1/budget-line-items/?can_id={id} - Filter BLIs by CAN."""
        if SHARED_CACHE["can_ids"]:
            can_id = random.choice(SHARED_CACHE["can_ids"])
            self.client.get(
                f"/api/v1/budget-line-items/?can_id={can_id}",
                name="/api/v1/budget-line-items/?can_id=[id]",
            )

    # === History & Audit Tasks ===

    @task(3)
    def get_agreement_history(self):
        """GET /api/v1/agreement-history/{agreement_id} - Get agreement change history."""
        if SHARED_CACHE["agreement_ids"]:
            agreement_id = random.choice(SHARED_CACHE["agreement_ids"])
            self.client.get(
                f"/api/v1/agreement-history/{agreement_id}",
                name="/api/v1/agreement-history/[id]",
            )

    @task(2)
    def get_can_history(self):
        """GET /api/v1/can-history/?can_id={id} - Get CAN change history."""
        if SHARED_CACHE["can_ids"]:
            can_id = random.choice(SHARED_CACHE["can_ids"])
            self.client.get(
                f"/api/v1/can-history/?can_id={can_id}",
                name="/api/v1/can-history/?can_id=[id]",
            )

    # === System & Utility Tasks ===

    @task(1)
    def health_check(self):
        """GET /api/v1/health/ - Health check endpoint."""
        self.client.get("/api/v1/health/", name="/api/v1/health/")

    @task(1)
    def get_version(self):
        """GET /api/v1/version/ - Get API version."""
        self.client.get("/api/v1/version/", name="/api/v1/version/")

    # === CAN Funding Tasks ===

    @task(3)
    def list_can_funding_budgets(self):
        """GET /api/v1/can-funding-budgets/ - List CAN funding budgets."""
        self.client.get("/api/v1/can-funding-budgets/", name="/api/v1/can-funding-budgets/")

    @task(2)
    def get_can_funding_budget_detail(self):
        """GET /api/v1/can-funding-budgets/{id} - Get specific CAN funding budget."""
        if SHARED_CACHE["can_funding_budget_ids"]:
            can_funding_budget_id = random.choice(SHARED_CACHE["can_funding_budget_ids"])
            self.client.get(
                f"/api/v1/can-funding-budgets/{can_funding_budget_id}",
                name="/api/v1/can-funding-budgets/[id]",
            )

    @task(3)
    def list_can_funding_details(self):
        """GET /api/v1/can-funding-details/ - List CAN funding details."""
        self.client.get("/api/v1/can-funding-details/", name="/api/v1/can-funding-details/")

    @task(2)
    def get_can_funding_detail_item(self):
        """GET /api/v1/can-funding-details/{id} - Get specific CAN funding detail."""
        if SHARED_CACHE["can_funding_details_ids"]:
            can_id = random.choice(SHARED_CACHE["can_funding_details_ids"])
            self.client.get(
                f"/api/v1/can-funding-details/{can_id}",
                name="/api/v1/can-funding-details/[id]",
            )

    @task(3)
    def list_can_funding_received(self):
        """GET /api/v1/can-funding-received/ - List CAN funding received."""
        self.client.get("/api/v1/can-funding-received/", name="/api/v1/can-funding-received/")

    @task(2)
    def get_can_funding_received_detail(self):
        """GET /api/v1/can-funding-received/{id} - Get specific CAN funding received."""
        if SHARED_CACHE["can_funding_received_ids"]:
            can_funding_received_id = random.choice(SHARED_CACHE["can_funding_received_ids"])
            self.client.get(
                f"/api/v1/can-funding-received/{can_funding_received_id}",
                name="/api/v1/can-funding-received/[id]",
            )

    @task(3)
    def get_can_funding_summary(self):
        """GET /api/v1/can-funding-summary/ - Get CAN funding summary."""
        if SHARED_CACHE["can_ids"]:
            can_id = str(random.choice(SHARED_CACHE["can_ids"]))  # Convert to string
            self.client.get(
                "/api/v1/can-funding-summary/",
                params={"can_ids": [can_id]},  # Pass as list
                name="/api/v1/can-funding-summary/?can_ids=[id]",
            )

    @task(2)
    def get_cans_by_portfolio(self):
        """GET /api/v1/cans/portfolio/{id} - Get CANs by portfolio."""
        if SHARED_CACHE["portfolio_ids"]:
            portfolio_id = random.choice(SHARED_CACHE["portfolio_ids"])
            self.client.get(
                f"/api/v1/cans/portfolio/{portfolio_id}",
                name="/api/v1/cans/portfolio/[id]",
            )

    # === Portfolio Extended Tasks ===

    @task(2)
    def get_portfolio_funding_summary(self):
        """GET /api/v1/portfolio-funding-summary/{id} - Get portfolio funding summary."""
        if SHARED_CACHE["portfolio_ids"]:
            portfolio_id = random.choice(SHARED_CACHE["portfolio_ids"])
            self.client.get(
                f"/api/v1/portfolio-funding-summary/{portfolio_id}",
                name="/api/v1/portfolio-funding-summary/[id]",
            )

    @task(2)
    def get_portfolio_cans(self):
        """GET /api/v1/portfolios/{id}/cans/ - Get portfolio CANs."""
        if SHARED_CACHE["portfolio_ids"]:
            portfolio_id = random.choice(SHARED_CACHE["portfolio_ids"])
            self.client.get(
                f"/api/v1/portfolios/{portfolio_id}/cans/",
                name="/api/v1/portfolios/[id]/cans/",
            )

    @task(4)
    def list_portfolio_status(self):
        """GET /api/v1/portfolio-status/ - List portfolio statuses."""
        self.client.get("/api/v1/portfolio-status/", name="/api/v1/portfolio-status/")

    @task(2)
    def get_portfolio_status_detail(self):
        """GET /api/v1/portfolio-status/{id} - Get specific portfolio status."""
        self.client.get("/api/v1/portfolio-status/1", name="/api/v1/portfolio-status/[id]")

    @task(3)
    def list_portfolios_url(self):
        """GET /api/v1/portfolios-url/ - List portfolio URLs."""
        self.client.get("/api/v1/portfolios-url/", name="/api/v1/portfolios-url/")

    @task(1)
    def get_portfolio_url_detail(self):
        """GET /api/v1/portfolios-url/{id} - Get specific portfolio URL."""
        if SHARED_CACHE["portfolio_url_ids"]:
            portfolio_url_id = random.choice(SHARED_CACHE["portfolio_url_ids"])
            self.client.get(
                f"/api/v1/portfolios-url/{portfolio_url_id}",
                name="/api/v1/portfolios-url/[id]",
            )

    # === Research Projects Tasks ===

    @task(5)
    def list_research_projects(self):
        """GET /api/v1/research-projects/ - List research projects."""
        self.client.get("/api/v1/research-projects/", name="/api/v1/research-projects/")

    @task(3)
    def get_research_project_detail(self):
        """GET /api/v1/research-projects/{id} - Get specific research project."""
        if SHARED_CACHE["research_project_ids"]:
            project_id = random.choice(SHARED_CACHE["research_project_ids"])
            self.client.get(
                f"/api/v1/research-projects/{project_id}",
                name="/api/v1/research-projects/[id]",
            )

    @task(3)
    def get_research_project_funding_summary(self):
        """GET /api/v1/research-project-funding-summary/ - Get research project funding summary."""
        if SHARED_CACHE["portfolio_ids"]:
            portfolio_id = random.choice(SHARED_CACHE["portfolio_ids"])
            self.client.get(
                f"/api/v1/research-project-funding-summary/?portfolioId={portfolio_id}&fiscalYear=2023",
                name="/api/v1/research-project-funding-summary/?portfolioId=[id]&fiscalYear=2023",
            )

    # === Administrative and Support Projects Tasks ===

    @task(4)
    def list_admin_support_projects(self):
        """GET /api/v1/administrative-and-support-projects/ - List admin/support projects."""
        self.client.get(
            "/api/v1/administrative-and-support-projects/",
            name="/api/v1/administrative-and-support-projects/",
        )

    @task(2)
    def get_admin_support_project_detail(self):
        """GET /api/v1/administrative-and-support-projects/{id} - Get specific admin/support project."""
        if SHARED_CACHE["admin_support_project_ids"]:
            project_id = random.choice(SHARED_CACHE["admin_support_project_ids"])
            self.client.get(
                f"/api/v1/administrative-and-support-projects/{project_id}",
                name="/api/v1/administrative-and-support-projects/[id]",
            )

    @task(3)
    def list_research_types(self):
        """GET /api/v1/research-types/ - List research types."""
        self.client.get("/api/v1/research-types/", name="/api/v1/research-types/")

    # === Agreement Extended Tasks ===

    @task(4)
    def list_agreement_agencies(self):
        """GET /api/v1/agreement-agencies/ - List agreement agencies."""
        self.client.get("/api/v1/agreement-agencies/", name="/api/v1/agreement-agencies/")

    @task(2)
    def get_agreement_agency_detail(self):
        """GET /api/v1/agreement-agencies/{id} - Get specific agreement agency."""
        if SHARED_CACHE["agreement_agency_ids"]:
            agency_id = random.choice(SHARED_CACHE["agreement_agency_ids"])
            self.client.get(
                f"/api/v1/agreement-agencies/{agency_id}",
                name="/api/v1/agreement-agencies/[id]",
            )

    @task(3)
    def list_agreement_reasons(self):
        """GET /api/v1/agreement-reasons/ - List agreement reasons."""
        self.client.get("/api/v1/agreement-reasons/", name="/api/v1/agreement-reasons/")

    @task(3)
    def list_agreement_types(self):
        """GET /api/v1/agreement-types/ - List agreement types."""
        self.client.get("/api/v1/agreement-types/", name="/api/v1/agreement-types/")

    # === Division Tasks ===

    @task(4)
    def list_divisions(self):
        """GET /api/v1/divisions/ - List divisions."""
        self.client.get("/api/v1/divisions/", name="/api/v1/divisions/")

    @task(2)
    def get_division_detail(self):
        """GET /api/v1/divisions/{id} - Get specific division."""
        if SHARED_CACHE["division_ids"]:
            division_id = random.choice(SHARED_CACHE["division_ids"])
            self.client.get(f"/api/v1/divisions/{division_id}", name="/api/v1/divisions/[id]")

    # === Budget Line Item Extended Tasks ===

    @task(3)
    def get_budget_line_items_filters(self):
        """GET /api/v1/budget-line-items-filters/ - Get budget line item filter options."""
        self.client.get(
            "/api/v1/budget-line-items-filters/",
            name="/api/v1/budget-line-items-filters/",
        )

    # === Product & Service Tasks ===

    @task(4)
    def list_product_service_codes(self):
        """GET /api/v1/product-service-codes/ - List product service codes."""
        self.client.get("/api/v1/product-service-codes/", name="/api/v1/product-service-codes/")

    @task(2)
    def get_product_service_code_detail(self):
        """GET /api/v1/product-service-codes/{id} - Get specific product service code."""
        if SHARED_CACHE["product_service_code_ids"]:
            code_id = random.choice(SHARED_CACHE["product_service_code_ids"])
            self.client.get(
                f"/api/v1/product-service-codes/{code_id}",
                name="/api/v1/product-service-codes/[id]",
            )

    @task(4)
    def list_services_components(self):
        """GET /api/v1/services-components/ - List services components."""
        self.client.get("/api/v1/services-components/", name="/api/v1/services-components/")

    @task(2)
    def get_services_component_detail(self):
        """GET /api/v1/services-components/{id} - Get specific services component."""
        if SHARED_CACHE["services_component_ids"]:
            component_id = random.choice(SHARED_CACHE["services_component_ids"])
            self.client.get(
                f"/api/v1/services-components/{component_id}",
                name="/api/v1/services-components/[id]",
            )

    # === Procurement Tasks ===

    @task(4)
    def list_procurement_shops(self):
        """GET /api/v1/procurement-shops/ - List procurement shops."""
        self.client.get("/api/v1/procurement-shops/", name="/api/v1/procurement-shops/")

    @task(2)
    def get_procurement_shop_detail(self):
        """GET /api/v1/procurement-shops/{id} - Get specific procurement shop."""
        if SHARED_CACHE["procurement_shop_ids"]:
            shop_id = random.choice(SHARED_CACHE["procurement_shop_ids"])
            self.client.get(
                f"/api/v1/procurement-shops/{shop_id}",
                name="/api/v1/procurement-shops/[id]",
            )

    @task(5)
    def list_procurement_trackers(self):
        """GET /api/v1/procurement-trackers/ - List procurement trackers."""
        self.client.get("/api/v1/procurement-trackers/", name="/api/v1/procurement-trackers/")

    @task(3)
    def get_procurement_tracker_detail(self):
        """GET /api/v1/procurement-trackers/{id} - Get specific procurement tracker."""
        if SHARED_CACHE["procurement_tracker_ids"]:
            tracker_id = random.choice(SHARED_CACHE["procurement_tracker_ids"])
            self.client.get(
                f"/api/v1/procurement-trackers/{tracker_id}",
                name="/api/v1/procurement-trackers/[id]",
            )

    @task(4)
    def list_procurement_tracker_steps(self):
        """GET /api/v1/procurement-tracker-steps/ - List procurement tracker steps."""
        self.client.get("/api/v1/procurement-tracker-steps/", name="/api/v1/procurement-tracker-steps/")

    @task(2)
    def get_procurement_tracker_step_detail(self):
        """GET /api/v1/procurement-tracker-steps/{id} - Get specific procurement tracker step."""
        if SHARED_CACHE["procurement_tracker_step_ids"]:
            step_id = random.choice(SHARED_CACHE["procurement_tracker_step_ids"])
            self.client.get(
                f"/api/v1/procurement-tracker-steps/{step_id}",
                name="/api/v1/procurement-tracker-steps/[id]",
            )

    @task(4)
    def list_procurement_actions(self):
        """GET /api/v1/procurement-actions/ - List procurement actions."""
        self.client.get("/api/v1/procurement-actions/", name="/api/v1/procurement-actions/")

    @task(2)
    def get_procurement_action_detail(self):
        """GET /api/v1/procurement-actions/{id} - Get specific procurement action."""
        if SHARED_CACHE["procurement_action_ids"]:
            action_id = random.choice(SHARED_CACHE["procurement_action_ids"])
            self.client.get(
                f"/api/v1/procurement-actions/{action_id}",
                name="/api/v1/procurement-actions/[id]",
            )

    # === Additional System Tasks ===

    @task(2)
    def list_change_requests(self):
        """GET /api/v1/change-requests/?userId=[id] - List change requests for a user."""
        if SHARED_CACHE["user_ids"]:
            user_id = random.choice(SHARED_CACHE["user_ids"])
            self.client.get(
                f"/api/v1/change-requests/?userId={user_id}",
                name="/api/v1/change-requests/?userId=[id]",
            )

    @task(20)
    def get_first_page_of_budget_line_items(self):
        """GET /api/v1/budget-line-items/?limit=10&offset=0 - Get first page of budget line items."""
        self.client.get(
            "/api/v1/budget-line-items/?limit=10&offset=0",
            name="/api/v1/budget-line-items/?limit=10&offset=0",
        )

    @task(20)
    def get_budget_line_items(self):
        """GET /api/v1/budget-line-items/ - Get all budget line items."""
        self.client.get(
            "/api/v1/budget-line-items/",
            name="/api/v1/budget-line-items/",
        )


def _populate_shared_cache(environment):
    """
    Populate the shared cache once at test start.

    This runs before any users spawn, populating SHARED_CACHE with entity IDs.
    Since this runs only once (not per-user), slow endpoints like /api/v1/budget-line-items/
    are only hit once, eliminating 504 timeout issues during test startup.
    """
    import requests

    jwt_token = os.getenv("JWT_TOKEN")
    if not jwt_token:
        print("WARNING: JWT_TOKEN not set - skipping cache population")
        return

    api_host = environment.host

    # Determine the referer based on the API host (same logic as on_start)
    if "localhost" in api_host:
        referer = "http://localhost:3000"
    else:
        referer = api_host

    # Use the same headers that Locust client uses to ensure proper authentication
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/json",
        "User-Agent": "Locust Performance Test",
        "Referer": referer,
    }

    print("Populating shared cache...")

    def fetch_ids(endpoint, cache_key, label):
        """Helper function to fetch IDs from an endpoint."""
        try:
            response = requests.get(f"{api_host}{endpoint}", headers=headers, timeout=120)
            if response.status_code == 200:
                data = response.json()
                # Handle wrapped responses with "data" field (e.g., {"data": [...], "count": ...})
                if isinstance(data, dict) and "data" in data:
                    items = data["data"]
                else:
                    items = data
                ids = [item["id"] for item in items if "id" in item]
                SHARED_CACHE[cache_key] = ids
                print(f"  ✓ {label}: {len(ids)} items")
            elif response.status_code == 504:
                print(f"  ⚠ {label}: Timeout (504) - continuing with empty cache")
            else:
                print(f"  ✗ {label}: Failed ({response.status_code})")
        except requests.exceptions.Timeout:
            print(f"  ⚠ {label}: Request timeout - continuing with empty cache")
        except Exception as e:
            print(f"  ✗ {label}: Error - {str(e)[:100]}")

    try:
        # Fetch all entity IDs - use paginated endpoint for BLIs to speed up
        fetch_ids("/api/v1/cans/", "can_ids", "CANs")
        fetch_ids("/api/v1/agreements/", "agreement_ids", "Agreements")
        fetch_ids("/api/v1/projects/", "project_ids", "Projects")
        fetch_ids("/api/v1/portfolios/", "portfolio_ids", "Portfolios")
        fetch_ids(
            "/api/v1/budget-line-items/?limit=50&offset=0",
            "bli_ids",
            "Budget Line Items",
        )
        fetch_ids("/api/v1/notifications/", "notification_ids", "Notifications")
        fetch_ids("/api/v1/users/", "user_ids", "Users")
        fetch_ids("/api/v1/research-projects/", "research_project_ids", "Research Projects")
        fetch_ids(
            "/api/v1/administrative-and-support-projects/",
            "admin_support_project_ids",
            "Admin/Support Projects",
        )
        fetch_ids("/api/v1/divisions/", "division_ids", "Divisions")
        fetch_ids("/api/v1/procurement-shops/", "procurement_shop_ids", "Procurement Shops")
        fetch_ids(
            "/api/v1/product-service-codes/",
            "product_service_code_ids",
            "Product Service Codes",
        )
        fetch_ids(
            "/api/v1/services-components/",
            "services_component_ids",
            "Services Components",
        )
        fetch_ids("/api/v1/agreement-agencies/", "agreement_agency_ids", "Agreement Agencies")
        fetch_ids(
            "/api/v1/can-funding-details/",
            "can_funding_details_ids",
            "CAN Funding Details",
        )
        fetch_ids(
            "/api/v1/can-funding-budgets/",
            "can_funding_budget_ids",
            "CAN Funding Budgets",
        )
        fetch_ids(
            "/api/v1/can-funding-received/",
            "can_funding_received_ids",
            "CAN Funding Received",
        )
        fetch_ids("/api/v1/portfolios-url/", "portfolio_url_ids", "Portfolio URLs")
        fetch_ids(
            "/api/v1/procurement-trackers/",
            "procurement_tracker_ids",
            "Procurement Trackers",
        )
        fetch_ids(
            "/api/v1/procurement-tracker-steps/",
            "procurement_tracker_step_ids",
            "Procurement Tracker Steps",
        )
        fetch_ids(
            "/api/v1/procurement-actions/",
            "procurement_action_ids",
            "Procurement Actions",
        )

        print("Shared cache population complete!")
    except Exception as e:
        print(f"Warning: Failed to populate shared cache: {e}")
        import traceback

        traceback.print_exc()


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Event handler for test start - populates shared cache."""
    print("\n" + "=" * 70)
    print("OPS API Performance Test Suite")
    print("=" * 70)
    jwt_token = os.getenv("JWT_TOKEN")
    if jwt_token:
        print("✓ JWT Token: Configured")
        print(f"✓ Token length: {len(jwt_token)} characters")
    else:
        print("✗ JWT Token: NOT SET - Tests will fail!")
        print("  Please set JWT_TOKEN environment variable")
    print(f"✓ API Host: {environment.host}")
    print(f"✓ Throttling: {os.getenv('MIN_WAIT', 1000)}-{os.getenv('MAX_WAIT', 3000)}ms between requests")
    print("=" * 70 + "\n")

    # Populate shared cache before any users spawn
    _populate_shared_cache(environment)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Event handler for test stop."""
    print("\n" + "=" * 70)
    print("Performance Test Complete")
    print("=" * 70 + "\n")
