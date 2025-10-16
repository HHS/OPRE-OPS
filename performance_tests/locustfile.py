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
import time

from locust import HttpUser, between, events, task
from locust.exception import StopUser
from loguru import logger


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
        """Initialize user session with JWT token."""
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

        # Cache for storing IDs retrieved during tests
        self.cache = {
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
            "portfolio_url_ids": [],
        }

        # Add small random delay before cache population to stagger requests from multiple users
        # This prevents all users from hitting slow endpoints simultaneously
        time.sleep(random.uniform(0.1, 1.0))

        # Warm up cache with some IDs
        self._populate_cache()

    def _populate_cache(self):
        """
        Pre-populate cache with entity IDs for realistic testing.

        Note: Failures during cache population are handled gracefully and don't count
        as test failures since they occur during initialization.
        """
        try:
            # Get CANs
            with self.client.get("/api/v1/cans/", name="/api/v1/cans/ [cache]", catch_response=True) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["can_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                elif response.status_code == 504:
                    # Timeout during cache population - mark as success to avoid counting as failure
                    print(f"Cache populate timeout for CANs (504) - continuing with empty cache")
                    response.success()
                else:
                    print(f"Cache populate failed for CANs: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

            # Get Agreements
            with self.client.get(
                "/api/v1/agreements/", name="/api/v1/agreements/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["agreement_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                elif response.status_code == 504:
                    print(f"Cache populate timeout for Agreements (504) - continuing with empty cache")
                    response.success()
                else:
                    print(f"Cache populate failed for Agreements: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

            # Get Projects
            with self.client.get(
                "/api/v1/projects/", name="/api/v1/projects/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["project_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                elif response.status_code == 504:
                    print(f"Cache populate timeout for Projects (504) - continuing with empty cache")
                    response.success()
                else:
                    print(f"Cache populate failed for Projects: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

            # Get Portfolios
            with self.client.get(
                "/api/v1/portfolios/", name="/api/v1/portfolios/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["portfolio_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                elif response.status_code == 504:
                    print(f"Cache populate timeout for Portfolios (504) - continuing with empty cache")
                    response.success()
                else:
                    print(f"Cache populate failed for Portfolios: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

            # Get Budget Line Items
            with self.client.get(
                "/api/v1/budget-line-items/", name="/api/v1/budget-line-items/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["bli_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                elif response.status_code == 504:
                    # Timeout during cache population - this endpoint can be slow
                    print(f"Cache populate timeout for BLIs (504) - continuing with empty cache")
                    response.success()
                else:
                    print(f"Cache populate failed for BLIs: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

            # Get Notifications
            with self.client.get(
                "/api/v1/notifications/", name="/api/v1/notifications/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["notification_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(f"Cache populate failed for Notifications: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

            # Get Users
            with self.client.get("/api/v1/users/", name="/api/v1/users/ [cache]", catch_response=True) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["user_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(f"Cache populate failed for Users: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

            # Get Research Projects
            with self.client.get(
                "/api/v1/research-projects/", name="/api/v1/research-projects/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["research_project_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(
                        f"Cache populate failed for Research Projects: {response.status_code} - {response.text[:200]}"
                    )
                    response.success()  # Don't fail during cache warmup

            # Get Admin/Support Projects
            with self.client.get(
                "/api/v1/administrative-and-support-projects/",
                name="/api/v1/administrative-and-support-projects/ [cache]",
                catch_response=True,
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["admin_support_project_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(
                        f"Cache populate failed for Admin/Support Projects: {response.status_code} - {response.text[:200]}"
                    )
                    response.success()  # Don't fail during cache warmup

            # Get Divisions
            with self.client.get(
                "/api/v1/divisions/", name="/api/v1/divisions/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["division_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(f"Cache populate failed for Divisions: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

            # Get Procurement Shops
            with self.client.get(
                "/api/v1/procurement-shops/", name="/api/v1/procurement-shops/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["procurement_shop_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(
                        f"Cache populate failed for Procurement Shops: {response.status_code} - {response.text[:200]}"
                    )
                    response.success()  # Don't fail during cache warmup

            # Get Product Service Codes
            with self.client.get(
                "/api/v1/product-service-codes/", name="/api/v1/product-service-codes/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["product_service_code_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(
                        f"Cache populate failed for Product Service Codes: {response.status_code} - {response.text[:200]}"
                    )
                    response.success()  # Don't fail during cache warmup

            # Get Services Components
            with self.client.get(
                "/api/v1/services-components/", name="/api/v1/services-components/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["services_component_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(
                        f"Cache populate failed for Services Components: {response.status_code} - {response.text[:200]}"
                    )
                    response.success()  # Don't fail during cache warmup

            # Get Agreement Agencies
            with self.client.get(
                "/api/v1/agreement-agencies/", name="/api/v1/agreement-agencies/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["agreement_agency_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(
                        f"Cache populate failed for Agreement Agencies: {response.status_code} - {response.text[:200]}"
                    )
                    response.success()  # Don't fail during cache warmup

            # Get CAN Funding Details
            with self.client.get(
                "/api/v1/can-funding-details/", name="/api/v1/can-funding-details/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["can_funding_details_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(
                        f"Cache populate failed for CAN Funding Details: {response.status_code} - {response.text[:200]}"
                    )
                    response.success()  # Don't fail during cache warmup

            # Get CAN Funding Budgets
            with self.client.get(
                "/api/v1/can-funding-budgets/", name="/api/v1/can-funding-budgets/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["can_funding_budget_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(
                        f"Cache populate failed for CAN Funding Budgets: {response.status_code} - {response.text[:200]}"
                    )
                    response.success()  # Don't fail during cache warmup

            # Get Portfolio Urls
            with self.client.get(
                "/api/v1/portfolios-url/", name="/api/v1/portfolios-url/ [cache]", catch_response=True
            ) as response:
                if response.status_code == 200:
                    data = response.json()
                    self.cache["portfolio_url_ids"] = [item["id"] for item in data if "id" in item]
                    response.success()
                else:
                    print(f"Cache populate failed for Portfolio Urls: {response.status_code} - {response.text[:200]}")
                    response.success()  # Don't fail during cache warmup

        except Exception as e:
            print(f"Warning: Failed to populate cache: {e}")
            import traceback

            traceback.print_exc()

    # === Authentication & User Tasks ===

    @task(3)
    def list_users(self):
        """GET /api/v1/users/ - List all users."""
        self.client.get("/api/v1/users/", name="/api/v1/users/")

    @task(2)
    def get_user_detail(self):
        """GET /api/v1/users/{id} - Get specific user details."""
        if self.cache.get("user_ids"):
            user_id = random.choice(self.cache["user_ids"])
            self.client.get(f"/api/v1/users/{user_id}", name="/api/v1/users/[id]")

    # === CAN (Contract Account Number) Tasks ===

    @task(7)
    def list_cans(self):
        """GET /api/v1/cans/ - List all CANs."""
        self.client.get("/api/v1/cans/", name="/api/v1/cans/")

    @task(5)
    def get_can_detail(self):
        """GET /api/v1/cans/{id} - Get specific CAN details."""
        if self.cache["can_ids"]:
            can_id = random.choice(self.cache["can_ids"])
            self.client.get(f"/api/v1/cans/{can_id}", name="/api/v1/cans/[id]")

    # === Agreement Tasks ===

    @task(10)
    def list_agreements(self):
        """GET /api/v1/agreements/ - List all agreements."""
        self.client.get("/api/v1/agreements/", name="/api/v1/agreements/")

    @task(5)
    def get_agreement_detail(self):
        """GET /api/v1/agreements/{id} - Get specific agreement details."""
        if self.cache["agreement_ids"]:
            agreement_id = random.choice(self.cache["agreement_ids"])
            self.client.get(f"/api/v1/agreements/{agreement_id}", name="/api/v1/agreements/[id]")

    # === Notification     Tasks ===
    @task(10)
    def list_notifications(self):
        """GET /api/v1/notifications/ - List all notifications."""
        self.client.get("/api/v1/notifications/", name="/api/v1/notifications/")

    @task(5)
    def get_notification_detail(self):
        """GET /api/v1/notifications/{id} - Get specific notification details."""
        if self.cache["notification_ids"]:
            notification_id = random.choice(self.cache["notification_ids"])
            self.client.get(f"/api/v1/notifications/{notification_id}", name="/api/v1/notifications/[id]")

    # === Budget Line Item Tasks ===

    @task(10)
    def list_budget_line_items(self):
        """GET /api/v1/budget-line-items/ - List all budget line items."""
        self.client.get("/api/v1/budget-line-items/", name="/api/v1/budget-line-items/")

    @task(4)
    def get_budget_line_item_detail(self):
        """GET /api/v1/budget-line-items/{id} - Get specific budget line item."""
        if self.cache["bli_ids"]:
            bli_id = random.choice(self.cache["bli_ids"])
            self.client.get(f"/api/v1/budget-line-items/{bli_id}", name="/api/v1/budget-line-items/[id]")

    # === Project Tasks ===

    @task(7)
    def list_projects(self):
        """GET /api/v1/projects/ - List all projects."""
        self.client.get("/api/v1/projects/", name="/api/v1/projects/")

    @task(4)
    def get_project_detail(self):
        """GET /api/v1/projects/{id} - Get specific project details."""
        if self.cache["project_ids"]:
            project_id = random.choice(self.cache["project_ids"])
            self.client.get(f"/api/v1/projects/{project_id}", name="/api/v1/projects/[id]")

    # === Portfolio Tasks ===

    @task(6)
    def list_portfolios(self):
        """GET /api/v1/portfolios/ - List all portfolios."""
        self.client.get("/api/v1/portfolios/", name="/api/v1/portfolios/")

    @task(3)
    def get_portfolio_detail(self):
        """GET /api/v1/portfolios/{id} - Get specific portfolio details."""
        if self.cache["portfolio_ids"]:
            portfolio_id = random.choice(self.cache["portfolio_ids"])
            self.client.get(f"/api/v1/portfolios/{portfolio_id}", name="/api/v1/portfolios/[id]")

    # === Search & Filter Tasks ===

    @task(5)
    def search_agreements_by_project(self):
        """GET /api/v1/agreements/?project_id={id} - Filter agreements by project."""
        if self.cache["project_ids"]:
            project_id = random.choice(self.cache["project_ids"])
            self.client.get(f"/api/v1/agreements/?project_id={project_id}", name="/api/v1/agreements/?project_id=[id]")

    @task(5)
    def search_budget_line_items_by_agreement(self):
        """GET /api/v1/budget-line-items/?agreement_id={id} - Filter BLIs by agreement."""
        if self.cache["agreement_ids"]:
            agreement_id = random.choice(self.cache["agreement_ids"])
            self.client.get(
                f"/api/v1/budget-line-items/?agreement_id={agreement_id}",
                name="/api/v1/budget-line-items/?agreement_id=[id]",
            )

    @task(4)
    def search_budget_line_items_by_can(self):
        """GET /api/v1/budget-line-items/?can_id={id} - Filter BLIs by CAN."""
        if self.cache["can_ids"]:
            can_id = random.choice(self.cache["can_ids"])
            self.client.get(
                f"/api/v1/budget-line-items/?can_id={can_id}", name="/api/v1/budget-line-items/?can_id=[id]"
            )

    # === History & Audit Tasks ===

    @task(3)
    def get_agreement_history(self):
        """GET /api/v1/agreement-history/{agreement_id} - Get agreement change history."""
        if self.cache["agreement_ids"]:
            agreement_id = random.choice(self.cache["agreement_ids"])
            self.client.get(f"/api/v1/agreement-history/{agreement_id}", name="/api/v1/agreement-history/[id]")

    @task(2)
    def get_can_history(self):
        """GET /api/v1/can-history/?can_id={id} - Get CAN change history."""
        if self.cache["can_ids"]:
            can_id = random.choice(self.cache["can_ids"])
            self.client.get(f"/api/v1/can-history/?can_id={can_id}", name="/api/v1/can-history/?can_id=[id]")

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
        if self.cache["can_funding_budget_ids"]:
            can_funding_budget_id = random.choice(self.cache["can_funding_budget_ids"])
            self.client.get(
                f"/api/v1/can-funding-budgets/{can_funding_budget_id}", name="/api/v1/can-funding-budgets/[id]"
            )

    @task(3)
    def list_can_funding_details(self):
        """GET /api/v1/can-funding-details/ - List CAN funding details."""
        self.client.get("/api/v1/can-funding-details/", name="/api/v1/can-funding-details/")

    @task(2)
    def get_can_funding_detail_item(self):
        """GET /api/v1/can-funding-details/{id} - Get specific CAN funding detail."""
        if self.cache["can_funding_details_ids"]:
            can_id = random.choice(self.cache["can_funding_details_ids"])
            self.client.get(f"/api/v1/can-funding-details/{can_id}", name="/api/v1/can-funding-details/[id]")

    @task(3)
    def list_can_funding_received(self):
        """GET /api/v1/can-funding-received/ - List CAN funding received."""
        self.client.get("/api/v1/can-funding-received/", name="/api/v1/can-funding-received/")

    @task(2)
    def get_can_funding_received_detail(self):
        """GET /api/v1/can-funding-received/{id} - Get specific CAN funding received."""
        if self.cache["can_ids"]:
            can_id = random.choice(self.cache["can_ids"])
            self.client.get(f"/api/v1/can-funding-received/{can_id}", name="/api/v1/can-funding-received/[id]")

    @task(3)
    def get_can_funding_summary(self):
        """GET /api/v1/can-funding-summary - Get CAN funding summary."""
        if self.cache["can_ids"]:
            can_id = random.choice(self.cache["can_ids"])
            self.client.get(
                f"/api/v1/can-funding-summary/?can_ids={can_id}", name="/api/v1/can-funding-summary?can_ids=[id]"
            )

    @task(2)
    def get_cans_by_portfolio(self):
        """GET /api/v1/cans/portfolio/{id} - Get CANs by portfolio."""
        if self.cache["portfolio_ids"]:
            portfolio_id = random.choice(self.cache["portfolio_ids"])
            self.client.get(f"/api/v1/cans/portfolio/{portfolio_id}", name="/api/v1/cans/portfolio/[id]")

    # === Portfolio Extended Tasks ===

    @task(2)
    def get_portfolio_funding_summary(self):
        """GET /api/v1/portfolio-funding-summary/{id} - Get portfolio funding summary."""
        if self.cache["portfolio_ids"]:
            portfolio_id = random.choice(self.cache["portfolio_ids"])
            self.client.get(
                f"/api/v1/portfolio-funding-summary/{portfolio_id}", name="/api/v1/portfolio-funding-summary/[id]"
            )

    @task(2)
    def get_portfolio_cans(self):
        """GET /api/v1/portfolios/{id}/cans/ - Get portfolio CANs."""
        if self.cache["portfolio_ids"]:
            portfolio_id = random.choice(self.cache["portfolio_ids"])
            self.client.get(f"/api/v1/portfolios/{portfolio_id}/cans/", name="/api/v1/portfolios/[id]/cans/")

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
        if self.cache["portfolio_url_ids"]:
            portfolio_url_id = random.choice(self.cache["portfolio_url_ids"])
            self.client.get(f"/api/v1/portfolios-url/{portfolio_url_id}", name="/api/v1/portfolios-url/[id]")

    # === Research Projects Tasks ===

    @task(5)
    def list_research_projects(self):
        """GET /api/v1/research-projects/ - List research projects."""
        self.client.get("/api/v1/research-projects/", name="/api/v1/research-projects/")

    @task(3)
    def get_research_project_detail(self):
        """GET /api/v1/research-projects/{id} - Get specific research project."""
        if self.cache["research_project_ids"]:
            project_id = random.choice(self.cache["research_project_ids"])
            self.client.get(f"/api/v1/research-projects/{project_id}", name="/api/v1/research-projects/[id]")

    @task(3)
    def get_research_project_funding_summary(self):
        """GET /api/v1/research-project-funding-summary/ - Get research project funding summary."""
        if self.cache["portfolio_ids"]:
            portfolio_id = random.choice(self.cache["portfolio_ids"])
            self.client.get(
                f"/api/v1/research-project-funding-summary/?portfolioId={portfolio_id}&fiscalYear=2023",
                name="/api/v1/research-project-funding-summary/?portfolioId=[id]&fiscalYear=2023",
            )

    # === Administrative and Support Projects Tasks ===

    @task(4)
    def list_admin_support_projects(self):
        """GET /api/v1/administrative-and-support-projects/ - List admin/support projects."""
        self.client.get(
            "/api/v1/administrative-and-support-projects/", name="/api/v1/administrative-and-support-projects/"
        )

    @task(2)
    def get_admin_support_project_detail(self):
        """GET /api/v1/administrative-and-support-projects/{id} - Get specific admin/support project."""
        if self.cache["admin_support_project_ids"]:
            project_id = random.choice(self.cache["admin_support_project_ids"])
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
        if self.cache["agreement_agency_ids"]:
            agency_id = random.choice(self.cache["agreement_agency_ids"])
            self.client.get(f"/api/v1/agreement-agencies/{agency_id}", name="/api/v1/agreement-agencies/[id]")

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
        if self.cache["division_ids"]:
            division_id = random.choice(self.cache["division_ids"])
            self.client.get(f"/api/v1/divisions/{division_id}", name="/api/v1/divisions/[id]")

    # === Budget Line Item Extended Tasks ===

    @task(3)
    def get_budget_line_items_filters(self):
        """GET /api/v1/budget-line-items-filters/ - Get budget line item filter options."""
        self.client.get("/api/v1/budget-line-items-filters/", name="/api/v1/budget-line-items-filters/")

    # === Product & Service Tasks ===

    @task(4)
    def list_product_service_codes(self):
        """GET /api/v1/product-service-codes/ - List product service codes."""
        self.client.get("/api/v1/product-service-codes/", name="/api/v1/product-service-codes/")

    @task(2)
    def get_product_service_code_detail(self):
        """GET /api/v1/product-service-codes/{id} - Get specific product service code."""
        if self.cache["product_service_code_ids"]:
            code_id = random.choice(self.cache["product_service_code_ids"])
            self.client.get(f"/api/v1/product-service-codes/{code_id}", name="/api/v1/product-service-codes/[id]")

    @task(4)
    def list_services_components(self):
        """GET /api/v1/services-components/ - List services components."""
        self.client.get("/api/v1/services-components/", name="/api/v1/services-components/")

    @task(2)
    def get_services_component_detail(self):
        """GET /api/v1/services-components/{id} - Get specific services component."""
        if self.cache["services_component_ids"]:
            component_id = random.choice(self.cache["services_component_ids"])
            self.client.get(f"/api/v1/services-components/{component_id}", name="/api/v1/services-components/[id]")

    # === Procurement Tasks ===

    @task(4)
    def list_procurement_shops(self):
        """GET /api/v1/procurement-shops/ - List procurement shops."""
        self.client.get("/api/v1/procurement-shops/", name="/api/v1/procurement-shops/")

    @task(2)
    def get_procurement_shop_detail(self):
        """GET /api/v1/procurement-shops/{id} - Get specific procurement shop."""
        if self.cache["procurement_shop_ids"]:
            shop_id = random.choice(self.cache["procurement_shop_ids"])
            self.client.get(f"/api/v1/procurement-shops/{shop_id}", name="/api/v1/procurement-shops/[id]")

    @task(3)
    def list_procurement_steps(self):
        """GET /api/v1/procurement-steps/ - List procurement steps."""
        self.client.get("/api/v1/procurement-steps/", name="/api/v1/procurement-steps/")

    # === Additional System Tasks ===

    @task(2)
    def list_ops_db_histories(self):
        """GET /api/v1/ops-db-histories/ - List database operation histories."""
        self.client.get("/api/v1/ops-db-histories/", name="/api/v1/ops-db-histories/")

    @task(2)
    def list_change_requests(self):
        """GET /api/v1/change-requests/?userId=[id] - List change requests for a user."""
        if self.cache["user_ids"]:
            user_id = random.choice(self.cache["user_ids"])
            self.client.get(f"/api/v1/change-requests/?userId={user_id}", name="/api/v1/change-requests/?userId=[id]")

    @task(5)
    def get_agreement_one(self):
        """GET /api/v1/agreements/1 - Get agreement with ID 1."""
        self.client.get("/api/v1/agreements/1", name="/api/v1/agreements/1")

    @task(20)
    def get_first_page_of_budget_line_items(self):
        """GET /api/v1/budget-line-items/?limit=10&offset=0 - Get first page of budget line items."""
        self.client.get(
            "/api/v1/budget-line-items/?limit=10&offset=0", name="/api/v1/budget-line-items/?limit=10&offset=0"
        )


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Event handler for test start."""
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


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Event handler for test stop."""
    print("\n" + "=" * 70)
    print("Performance Test Complete")
    print("=" * 70 + "\n")
