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

import json
import os
import random

from locust import HttpUser, between, events, task
from locust.exception import StopUser


class OPSAPIUser(HttpUser):
    """
    Simulates a user interacting with the OPS API.

    The wait_time defines throttling between requests to avoid overloading the API.
    Default: between 1-3 seconds between requests.
    """

    # Throttle requests: wait 1-3 seconds between tasks
    min_wait = int(os.getenv('MIN_WAIT', 1000))
    max_wait = int(os.getenv('MAX_WAIT', 3000))
    wait_time = between(min_wait / 1000, max_wait / 1000)

    def on_start(self):
        """Initialize user session with JWT token."""
        self.jwt_token = os.getenv('JWT_TOKEN')

        if not self.jwt_token:
            print("ERROR: JWT_TOKEN environment variable is required")
            print("Please set JWT_TOKEN before running the tests")
            raise StopUser()

        # Set default headers for all requests
        # NOTE: Do NOT set Content-Type header globally - it causes 400 errors on GET requests
        # Content-Type should only be sent with POST/PUT/PATCH requests
        self.headers = {
            'Authorization': f'Bearer {self.jwt_token}',
            'Accept': 'application/json',
            'User-Agent': 'Locust Performance Test'
        }

        # Configure client headers
        self.client.headers.update(self.headers)

        # Cache for storing IDs retrieved during tests
        self.cache = {
            'can_ids': [],
            'agreement_ids': [],
            'project_ids': [],
            'portfolio_ids': [],
            'bli_ids': []
        }

        # Warm up cache with some IDs
        self._populate_cache()

    def _populate_cache(self):
        """Pre-populate cache with entity IDs for realistic testing."""
        try:
            # Get CANs
            response = self.client.get('/api/v1/cans/', name='/api/v1/cans/ [cache]', catch_response=True)
            if response.status_code == 200:
                data = response.json()
                self.cache['can_ids'] = [item['id'] for item in data if 'id' in item]
                response.success()
            else:
                print(f"Cache populate failed for CANs: {response.status_code} - {response.text[:200]}")
                response.failure(f"Status {response.status_code}")

            # Get Agreements
            response = self.client.get('/api/v1/agreements/', name='/api/v1/agreements/ [cache]', catch_response=True)
            if response.status_code == 200:
                data = response.json()
                self.cache['agreement_ids'] = [item['id'] for item in data if 'id' in item]
                response.success()
            else:
                print(f"Cache populate failed for Agreements: {response.status_code} - {response.text[:200]}")
                response.failure(f"Status {response.status_code}")

            # Get Projects
            response = self.client.get('/api/v1/projects/', name='/api/v1/projects/ [cache]', catch_response=True)
            if response.status_code == 200:
                data = response.json()
                self.cache['project_ids'] = [item['id'] for item in data if 'id' in item]
                response.success()
            else:
                print(f"Cache populate failed for Projects: {response.status_code} - {response.text[:200]}")
                response.failure(f"Status {response.status_code}")

            # Get Portfolios
            response = self.client.get('/api/v1/portfolios/', name='/api/v1/portfolios/ [cache]', catch_response=True)
            if response.status_code == 200:
                data = response.json()
                self.cache['portfolio_ids'] = [item['id'] for item in data if 'id' in item]
                response.success()
            else:
                print(f"Cache populate failed for Portfolios: {response.status_code} - {response.text[:200]}")
                response.failure(f"Status {response.status_code}")

            # Get Budget Line Items
            response = self.client.get('/api/v1/budget-line-items/', name='/api/v1/budget-line-items/ [cache]', catch_response=True)
            if response.status_code == 200:
                data = response.json()
                self.cache['bli_ids'] = [item['id'] for item in data if 'id' in item]
                response.success()
            else:
                print(f"Cache populate failed for BLIs: {response.status_code} - {response.text[:200]}")
                response.failure(f"Status {response.status_code}")

        except Exception as e:
            print(f"Warning: Failed to populate cache: {e}")
            import traceback
            traceback.print_exc()

    # === Authentication & User Tasks ===

    @task(2)
    def get_current_user(self):
        """GET /api/v1/users/me - Get current user profile."""
        self.client.get('/api/v1/users/me', name='/api/v1/users/me')

    # === CAN (Contract Account Number) Tasks ===

    @task(10)
    def list_cans(self):
        """GET /api/v1/cans/ - List all CANs."""
        self.client.get('/api/v1/cans/', name='/api/v1/cans/')

    @task(5)
    def get_can_detail(self):
        """GET /api/v1/cans/{id} - Get specific CAN details."""
        if self.cache['can_ids']:
            can_id = random.choice(self.cache['can_ids'])
            self.client.get(f'/api/v1/cans/{can_id}', name='/api/v1/cans/[id]')

    @task(3)
    def get_can_funding_summary(self):
        """GET /api/v1/cans/{id}/funding-summary - Get CAN funding summary."""
        if self.cache['can_ids']:
            can_id = random.choice(self.cache['can_ids'])
            self.client.get(
                f'/api/v1/cans/{can_id}/funding-summary',
                name='/api/v1/cans/[id]/funding-summary'
            )

    # === Agreement Tasks ===

    @task(10)
    def list_agreements(self):
        """GET /api/v1/agreements/ - List all agreements."""
        self.client.get('/api/v1/agreements/', name='/api/v1/agreements/')

    @task(5)
    def get_agreement_detail(self):
        """GET /api/v1/agreements/{id} - Get specific agreement details."""
        if self.cache['agreement_ids']:
            agreement_id = random.choice(self.cache['agreement_ids'])
            self.client.get(
                f'/api/v1/agreements/{agreement_id}',
                name='/api/v1/agreements/[id]'
            )

    # === Budget Line Item Tasks ===

    @task(8)
    def list_budget_line_items(self):
        """GET /api/v1/budget-line-items/ - List all budget line items."""
        self.client.get('/api/v1/budget-line-items/', name='/api/v1/budget-line-items/')

    @task(4)
    def get_budget_line_item_detail(self):
        """GET /api/v1/budget-line-items/{id} - Get specific budget line item."""
        if self.cache['bli_ids']:
            bli_id = random.choice(self.cache['bli_ids'])
            self.client.get(
                f'/api/v1/budget-line-items/{bli_id}',
                name='/api/v1/budget-line-items/[id]'
            )

    # === Project Tasks ===

    @task(7)
    def list_projects(self):
        """GET /api/v1/projects/ - List all projects."""
        self.client.get('/api/v1/projects/', name='/api/v1/projects/')

    @task(4)
    def get_project_detail(self):
        """GET /api/v1/projects/{id} - Get specific project details."""
        if self.cache['project_ids']:
            project_id = random.choice(self.cache['project_ids'])
            self.client.get(
                f'/api/v1/projects/{project_id}',
                name='/api/v1/projects/[id]'
            )

    # === Portfolio Tasks ===

    @task(6)
    def list_portfolios(self):
        """GET /api/v1/portfolios/ - List all portfolios."""
        self.client.get('/api/v1/portfolios/', name='/api/v1/portfolios/')

    @task(3)
    def get_portfolio_detail(self):
        """GET /api/v1/portfolios/{id} - Get specific portfolio details."""
        if self.cache['portfolio_ids']:
            portfolio_id = random.choice(self.cache['portfolio_ids'])
            self.client.get(
                f'/api/v1/portfolios/{portfolio_id}',
                name='/api/v1/portfolios/[id]'
            )

    # === Search & Filter Tasks ===

    @task(5)
    def search_agreements_by_project(self):
        """GET /api/v1/agreements/?project_id={id} - Filter agreements by project."""
        if self.cache['project_ids']:
            project_id = random.choice(self.cache['project_ids'])
            self.client.get(
                f'/api/v1/agreements/?project_id={project_id}',
                name='/api/v1/agreements/?project_id=[id]'
            )

    @task(5)
    def search_budget_line_items_by_agreement(self):
        """GET /api/v1/budget-line-items/?agreement_id={id} - Filter BLIs by agreement."""
        if self.cache['agreement_ids']:
            agreement_id = random.choice(self.cache['agreement_ids'])
            self.client.get(
                f'/api/v1/budget-line-items/?agreement_id={agreement_id}',
                name='/api/v1/budget-line-items/?agreement_id=[id]'
            )

    @task(4)
    def search_budget_line_items_by_can(self):
        """GET /api/v1/budget-line-items/?can_id={id} - Filter BLIs by CAN."""
        if self.cache['can_ids']:
            can_id = random.choice(self.cache['can_ids'])
            self.client.get(
                f'/api/v1/budget-line-items/?can_id={can_id}',
                name='/api/v1/budget-line-items/?can_id=[id]'
            )

    # === History & Audit Tasks ===

    @task(3)
    def get_agreement_history(self):
        """GET /api/v1/agreements/{id}/history - Get agreement change history."""
        if self.cache['agreement_ids']:
            agreement_id = random.choice(self.cache['agreement_ids'])
            self.client.get(
                f'/api/v1/agreements/{agreement_id}/history',
                name='/api/v1/agreements/[id]/history'
            )

    @task(2)
    def get_can_history(self):
        """GET /api/v1/cans/{id}/history - Get CAN change history."""
        if self.cache['can_ids']:
            can_id = random.choice(self.cache['can_ids'])
            self.client.get(
                f'/api/v1/cans/{can_id}/history',
                name='/api/v1/cans/[id]/history'
            )


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Event handler for test start."""
    print("\n" + "="*70)
    print("OPS API Performance Test Suite")
    print("="*70)
    jwt_token = os.getenv('JWT_TOKEN')
    if jwt_token:
        print("✓ JWT Token: Configured")
        print(f"✓ Token length: {len(jwt_token)} characters")
    else:
        print("✗ JWT Token: NOT SET - Tests will fail!")
        print("  Please set JWT_TOKEN environment variable")
    print(f"✓ API Host: {environment.host}")
    print(f"✓ Throttling: {os.getenv('MIN_WAIT', 1000)}-{os.getenv('MAX_WAIT', 3000)}ms between requests")
    print("="*70 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Event handler for test stop."""
    print("\n" + "="*70)
    print("Performance Test Complete")
    print("="*70 + "\n")
