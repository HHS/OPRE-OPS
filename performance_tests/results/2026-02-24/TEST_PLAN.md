# Performance Test Plan - OPRE OPS API

**Test Date:** February 24, 2026
**Test Framework:** Locust
**Target Application:** OPRE OPS Portfolio Management System
**Related Branch:** OPS-5116/portfolio-cans-api-perf

---

## 1. Overview

This document outlines the performance testing strategy for the OPRE OPS API endpoints. The tests are designed to evaluate system performance under load, identify bottlenecks, and establish baseline metrics for response times and throughput.

This test round focuses on validating performance improvements to the Portfolio CANs API endpoints.

## 2. Test Objectives

- Establish baseline performance metrics for all API endpoints
- Validate performance improvements to Portfolio CANs endpoints (OPS-5116)
- Identify slow endpoints that may require optimization
- Validate system behavior under concurrent user load
- Ensure API can handle expected production traffic
- Monitor for memory leaks or resource exhaustion
- Validate error handling under load
- Compare results against previous baselines (2026-02-03)

## 3. Test Environment

### Target Environments
- **Development:** `https://dev.ops.opre.acf.gov`
- **Staging:** `https://stg.ops.opre.acf.gov`
- **Production:** `https://ops.opre.acf.gov` (read-only tests only)

### Test Client
- **Location:** Local machine or CI/CD environment
- **Framework:** Locust 2.x
- **Language:** Python 3.11+

### Authentication
- JWT-based authentication required for all API endpoints
- Token must be set via `JWT_TOKEN` environment variable
- Tokens should have appropriate permissions for test execution

## 4. Test Configuration

### Load Profile
```
User Spawn Rate: 1-10 users/second (configurable)
Max Users: 10-100 concurrent users (configurable)
Test Duration: 5-30 minutes (configurable)
Throttling: 1-3 seconds between requests per user (MIN_WAIT=1000ms, MAX_WAIT=3000ms)
```

### Environment Variables
```bash
JWT_TOKEN=<your-jwt-token>           # Required: Authentication token
API_HOST=http://localhost:8080       # Optional: API base URL
MIN_WAIT=1000                        # Optional: Min wait between requests (ms)
MAX_WAIT=3000                        # Optional: Max wait between requests (ms)
```

## 5. Test Scenarios

### 5.1 Endpoint Categories

The test suite covers the following endpoint categories:

#### Core Entities (High Traffic)
- **Users** - User management and authentication
- **CANs** - Contract Account Numbers (funding sources)
- **Agreements** - Contracts and grants
- **Projects** - Organizational project units
- **Portfolios** - Top-level organizational structure
- **Budget Line Items** - Budget allocations

#### Portfolio CANs (Focus Area - OPS-5116)
- **Portfolio CANs** - CANs filtered by portfolio ID
- **Portfolio Funding Summary** - Aggregated funding data per portfolio
- **CAN Funding Summary** - Aggregated funding data per CAN

#### Procurement
- **Procurement Trackers** - Track procurement workflow status
- **Procurement Tracker Steps** - Individual steps in procurement process
- **Procurement Actions** - Procurement-related actions and events
- **Procurement Shops** - Procurement organizations

#### Supporting Entities
- **Notifications** - System notifications
- **Research Projects** - Research-specific project data
- **Admin/Support Projects** - Administrative project tracking
- **Divisions** - Organizational divisions
- **Agreement Agencies** - External agencies
- **Product Service Codes** - PSC classifications
- **Services Components** - Service categorization

#### Funding & Financial
- **CAN Funding Details** - Detailed funding information
- **CAN Funding Budgets** - Budget allocations
- **CAN Funding Received** - Received funding tracking
- **CAN Funding Summary** - Aggregated funding data
- **Portfolio Funding Summary** - Portfolio-level funding

#### History & Audit
- **Agreement History** - Agreement change tracking
- **CAN History** - CAN change tracking
- **Change Requests** - User change request tracking

#### System & Utilities
- **Health Check** - API health status
- **Version** - API version information
- **Budget Line Items Filters** - Available filter options
- **Portfolio Status** - Portfolio status types
- **Portfolio URLs** - Portfolio URL mappings

### 5.2 Task Weight Distribution

Tasks are weighted to simulate realistic user behavior:

- **High frequency (weight 10-20):** List agreements, list budget line items
- **Medium frequency (weight 4-7):** List CANs, list projects, list portfolios
- **Low frequency (weight 1-3):** Detail views, history queries, system endpoints

### 5.3 Response Structure Handling

The test suite handles two response formats:

**Wrapped Responses** (with pagination metadata):
```json
{
    "data": [...],
    "count": 100,
    "limit": 50,
    "offset": 0
}
```
Endpoints: agreements, CANs, budget-line-items, procurement-trackers, procurement-tracker-steps, procurement-actions

**Flat Array Responses**:
```json
[{...}, {...}, ...]
```
Endpoints: users, projects, portfolios, etc.

## 6. Endpoint Test Coverage

### 6.1 Portfolio CANs Endpoints (Focus Area)

| Endpoint | Method | Task Weight | Expected Improvement |
|----------|--------|-------------|---------------------|
| `/api/v1/cans/?portfolio_id={id}` | GET | 2 | Target optimization |
| `/api/v1/portfolios/{id}/cans/` | GET | 2 | Target optimization |
| `/api/v1/portfolio-funding-summary/{id}` | GET | 2 | Target optimization |
| `/api/v1/portfolio-funding-summary/` | GET | 2 | Baseline comparison |
| `/api/v1/can-funding-summary/?can_ids=[id]` | GET | 3 | Baseline comparison |

### 6.2 Core CRUD Endpoints

| Endpoint | Method | Task Weight | Cache Population |
|----------|--------|-------------|-----------------|
| `/api/v1/agreements/` | GET | 10 | Yes |
| `/api/v1/agreements/{id}` | GET | 5 | - |
| `/api/v1/cans/` | GET | 7 | Yes |
| `/api/v1/cans/{id}` | GET | 5 | - |
| `/api/v1/budget-line-items/` | GET | 20 | Yes (limit=50) |
| `/api/v1/budget-line-items/{id}` | GET | 4 | - |
| `/api/v1/projects/` | GET | 7 | Yes |
| `/api/v1/projects/{id}` | GET | 4 | - |
| `/api/v1/portfolios/` | GET | 6 | Yes |
| `/api/v1/portfolios/{id}` | GET | 3 | - |

### 6.3 Search & Filter Endpoints

| Endpoint | Task Weight | Notes |
|----------|-------------|-------|
| `/api/v1/agreements/?project_id={id}` | 5 | Filter by project |
| `/api/v1/budget-line-items/?agreement_id={id}` | 5 | Filter by agreement |
| `/api/v1/budget-line-items/?can_id={id}` | 4 | Filter by CAN |
| `/api/v1/change-requests/?userId={id}` | 2 | Filter by user |

### 6.4 Known Constraints

- **Budget Line Items:** Maximum limit of 50 items per request (pagination required)
- **All List Endpoints:** Pagination parameters must be single values, not arrays
- **Authentication:** All endpoints require valid JWT token with appropriate permissions

## 7. Success Criteria

### Response Time Targets

| Category | P50 | P90 | P95 | P99 |
|----------|-----|-----|-----|-----|
| Simple GET (detail) | < 100ms | < 200ms | < 300ms | < 500ms |
| List endpoints (no filters) | < 200ms | < 500ms | < 1000ms | < 2000ms |
| Complex queries/aggregations | < 500ms | < 1500ms | < 3000ms | < 5000ms |
| Budget Line Items (known slow) | < 1000ms | < 3000ms | < 5000ms | < 10000ms |
| Portfolio CANs (OPS-5116) | < 300ms | < 800ms | < 1500ms | < 3000ms |

### Error Rate Thresholds
- **Total error rate:** < 1% for all requests
- **5xx errors:** < 0.1% (server errors)
- **4xx errors:** < 0.5% (client errors from cache misses are acceptable)
- **Timeout rate:** < 0.1% (504 Gateway Timeout)

### Throughput Targets
- **Minimum RPS:** 10 requests/second with 10 concurrent users
- **Target RPS:** 50 requests/second with 50 concurrent users
- **Peak RPS:** 100+ requests/second with 100 concurrent users

### Resource Utilization
- **API Server CPU:** < 80% average utilization
- **API Server Memory:** No memory leaks, stable memory usage
- **Database Connections:** No connection pool exhaustion

## 8. Execution Instructions

### 8.1 Prerequisites

1. Start the application stack:
```bash
docker compose up --build
```

2. Generate JWT token:
```bash
# Use appropriate method to generate JWT token for your environment
# Example: Login to the application and extract token from browser dev tools
export JWT_TOKEN="your-jwt-token-here"
```

3. Verify API is accessible:
```bash
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:8080/api/v1/health/
```

### 8.2 Running Tests

**Basic test run (headless) - Development:**
```bash
cd performance_tests
locust -f locustfile.py --host=https://dev.ops.opre.acf.gov \
  --users 10 --spawn-rate 1 --run-time 5m --headless \
  --html results/2026-02-24/dev-baseline.html \
  --csv results/2026-02-24/dev-baseline
```

**Basic test run (headless) - Staging:**
```bash
cd performance_tests
locust -f locustfile.py --host=https://stg.ops.opre.acf.gov \
  --users 10 --spawn-rate 1 --run-time 5m --headless \
  --html results/2026-02-24/stg-baseline.html \
  --csv results/2026-02-24/stg-baseline
```

**Normal load test - Staging:**
```bash
cd performance_tests
locust -f locustfile.py --host=https://stg.ops.opre.acf.gov \
  --users 10 --spawn-rate 2 --run-time 15m --headless \
  --html results/2026-02-24/stg-baseline-normal.html \
  --csv results/2026-02-24/stg-baseline-normal
```

**Production testing (read-only):**
```bash
export JWT_TOKEN="production-read-only-token"
locust -f locustfile.py --host=https://ops.opre.acf.gov \
  --users 10 --spawn-rate 2 --run-time 15m --headless \
  --html results/2026-02-24/prod-baseline.html \
  --csv results/2026-02-24/prod-baseline
```

**Interactive web UI:**
```bash
cd performance_tests
locust -f locustfile.py --host=http://localhost:8080
# Open browser to http://localhost:8089
```

**Custom throttling:**
```bash
MIN_WAIT=500 MAX_WAIT=2000 locust -f locustfile.py --host=http://localhost:8080
```

### 8.3 Test Phases

**Phase 1: Cache Population (Automatic)**
- Runs once at test start
- Populates SHARED_CACHE with entity IDs
- Used to select random IDs for detail endpoint tests
- Handles 504 timeouts gracefully

**Phase 2: Load Generation**
- Users spawned at configured rate
- Each user executes weighted tasks
- Throttling ensures realistic request pacing
- Continues for configured duration

**Phase 3: Results Collection**
- Statistics collected throughout test
- HTML report generated
- CSV files exported for analysis
- Failures and exceptions logged

## 9. Results Analysis

### 9.1 Key Metrics to Review

**Response Times:**
- Median (P50), P90, P95, P99 response times per endpoint
- Identify endpoints with high latency
- Compare against success criteria targets
- Compare Portfolio CANs endpoints against 2026-02-03 baseline

**Throughput:**
- Total requests per second (RPS)
- Requests per endpoint
- User concurrency vs. throughput scaling

**Error Analysis:**
- Total failure rate
- Breakdown by error type (4xx, 5xx, timeouts)
- Specific endpoints with high failure rates

**Cache Performance:**
- Number of items cached per entity type
- Endpoints returning 0 items (may indicate missing test data)

### 9.2 Expected Output Files

```
results/2026-02-24/
├── TEST_PLAN.md (this file)
├── dev-baseline.html             # Dev environment HTML report
├── dev-baseline_stats.csv        # Dev aggregated statistics
├── dev-baseline_stats_history.csv # Dev time-series data
├── dev-baseline_failures.csv     # Dev failed requests
├── dev-baseline_exceptions.csv   # Dev Python exceptions
├── stg-baseline.html             # Staging HTML report
├── stg-baseline_stats.csv        # Staging aggregated statistics
├── stg-baseline_stats_history.csv # Staging time-series data
├── stg-baseline_failures.csv     # Staging failed requests
├── stg-baseline_exceptions.csv   # Staging Python exceptions
├── stg-baseline-normal.html      # Staging normal load HTML report
├── stg-baseline-normal_stats.csv # Staging normal load statistics
├── prod-baseline.html            # Production HTML report (if run)
└── prod-baseline_stats.csv       # Production statistics (if run)
```

### 9.3 Known Issues

**Cache Population:**
- Some endpoints may return 0 items if test data is not populated
- This is expected for new endpoints without seed data
- Budget Line Items may timeout (504) due to large dataset

**Slow Endpoints:**
- `/api/v1/budget-line-items/` - Known to be slow with large datasets
- Complex aggregation endpoints may exceed 1s response time

### 9.4 Comparison with Previous Baseline

Compare results against 2026-02-03 baseline, focusing on:
- Portfolio CANs endpoints (`/api/v1/cans/?portfolio_id={id}`, `/api/v1/portfolios/{id}/cans/`)
- Portfolio Funding Summary endpoints
- Overall throughput and error rates

## 10. Next Steps

### 10.1 Post-Test Actions

1. **Review Results:**
   - Analyze HTML report and CSV data
   - Identify slowest endpoints
   - Document any errors or anomalies

2. **Compare Baselines:**
   - Compare against 2026-02-03 test results
   - Validate Portfolio CANs performance improvements
   - Track performance trends over time

3. **Optimization Recommendations:**
   - Flag endpoints exceeding targets
   - Suggest query optimizations
   - Recommend caching strategies

4. **Update Test Plan:**
   - Document findings
   - Adjust success criteria if needed
   - Add new endpoints as features are added

### 10.2 Continuous Testing

- **Pre-deployment:** Run performance tests before each production deployment
- **Nightly runs:** Automated performance regression testing
- **Post-deployment:** Validate production performance with read-only tests
- **Monthly baselines:** Establish monthly performance baselines for trend analysis

---

## Appendix A: Troubleshooting

### Common Issues

**Issue: JWT_TOKEN not set**
```
ERROR: JWT_TOKEN environment variable is required
Solution: Export JWT_TOKEN before running tests
```

**Issue: 400 Bad Request on Budget Line Items**
```
✗ Budget Line Items: Failed (400)
Solution: Ensure limit parameter is ≤ 50
```

**Issue: 504 Gateway Timeout**
```
⚠ Budget Line Items: Timeout (504)
Solution: This is expected for large datasets, test continues with empty cache
```

**Issue: 401 Unauthorized**
```
Solution: Token expired or invalid, generate new JWT_TOKEN
```

**Issue: Connection refused**
```
Solution: Verify API is running (docker compose up)
```

### Debug Mode

Enable detailed logging:
```bash
locust -f locustfile.py --host=http://localhost:8080 --loglevel DEBUG
```

---

## Appendix B: Test Data Requirements

For comprehensive test coverage, ensure the following test data exists:

- **CANs:** At least 10 CANs with various fiscal years
- **Agreements:** At least 20 agreements across multiple projects
- **Budget Line Items:** At least 50 BLIs with various statuses
- **Projects:** At least 10 projects across portfolios
- **Portfolios:** At least 3-5 portfolios
- **Procurement Trackers:** At least 10 trackers
- **Procurement Tracker Steps:** At least 20 steps across trackers
- **Procurement Actions:** At least 15 actions across agreements
- **Users:** At least 10 users with various roles
- **Notifications:** At least 20 notifications

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-24 | Initial test plan for Portfolio CANs performance (OPS-5116) | Performance Testing Team |
