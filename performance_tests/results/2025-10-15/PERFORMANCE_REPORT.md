# OPS API Performance Testing Report

**Test Date**: October 15, 2025
**Test Framework**: Locust 2.32.4
**Test Duration**: Baseline (10 min), Normal Load (20 min)
**Environments Tested**: Development, Staging, Production

---

## Executive Summary

Performance testing was conducted across three environments (dev, staging, production) to establish performance baselines and identify bottlenecks. The tests revealed **critical scalability issues in production** under normal load conditions, with a 10.4% failure rate and widespread 20-second gateway timeouts.

### Key Findings

🔴 **Critical Issues**:
- **Production scalability crisis**: 10.4% failure rate (224/2146 requests) under normal load (10 users)
- **`/api/v1/ops-db-histories/` endpoint**: 100% failure rate across all environments (404/504 errors)
- **`/api/v1/agreement-agencies/` endpoint**: 47 consecutive 404 errors in production

🟡 **Performance Concerns**:
- Gateway timeout threshold set to 20 seconds (too aggressive for slow endpoints)
- Significant response time degradation under load in production
- Several endpoints consistently exceed acceptable performance targets (p95 > 1s)

🟢 **Positive Findings**:
- Development and staging environments perform adequately under light load
- Most endpoints meet performance targets under baseline conditions
- Cache optimization eliminated startup timeout issues

---

## Test Configuration

### Test Scenarios Executed

| Scenario | Users | Spawn Rate | Duration | Environments |
|----------|-------|------------|----------|--------------|
| **Baseline** | 3 | 1/sec | 10 min | Dev, Staging, Production |
| **Normal Load** | 10 | 2/sec | 20 min | Staging, Production |

### Authentication & Setup
- JWT token authentication (30-minute expiration)
- Shared cache pattern implemented to prevent simultaneous cache population
- Proper headers (Authorization, Referer, User-Agent) for all requests

---

## Environment Performance Comparison

### Overall Metrics Summary

| Environment | Test Type | Total Requests | Failures | Failure Rate | Median RT | p95 RT | p99 RT | RPS |
|-------------|-----------|----------------|----------|--------------|-----------|--------|--------|-----|
| **Development** | Baseline | 496 | 10 | 2.02% | 190ms | 1700ms | 14000ms | 0.8 |
| **Staging** | Baseline | 496 | 3 | 0.60% | 180ms | 1200ms | 240000ms | 0.8 |
| **Staging** | Normal Load | 564 | 19 | 3.37% | 210ms | 1900ms | 20000ms | 0.47 |
| **Production** | Baseline | 564 | 19 | 3.37% | 210ms | 1800ms | 20000ms | 0.9 |
| **Production** | Normal Load | 2146 | 224 | **10.44%** | 940ms | 20000ms | 20000ms | 1.8 |

### Performance Target Comparison

| Metric | Target | Acceptable | Critical | Production Normal | Status |
|--------|--------|------------|----------|-------------------|--------|
| Response Time p50 | < 200ms | < 500ms | > 1000ms | **940ms** | ⚠️ Acceptable |
| Response Time p95 | < 500ms | < 1000ms | > 2000ms | **20000ms** | 🔴 Critical |
| Response Time p99 | < 1000ms | < 2000ms | > 5000ms | **20000ms** | 🔴 Critical |
| Error Rate | < 1% | < 5% | > 10% | **10.44%** | 🔴 Critical |
| Throughput (RPS) | > 50 | > 20 | < 10 | 1.8 | 🔴 Critical |

**Analysis**: Production under normal load fails to meet acceptable thresholds for all key metrics except median response time.

---

## Critical Issues Identified

### Issue 1: Production Scalability Failure (CRITICAL)

**Severity**: 🔴 Critical
**Impact**: High - Affects live user experience

**Description**: Production environment experiences catastrophic failure rates under normal load conditions (10 concurrent users).

**Metrics**:
- **Failure Rate**: 10.44% (224 failures out of 2146 requests)
- **Gateway Timeouts**: 20-second timeout threshold hit repeatedly
- **Affected Endpoints**: 36 different endpoints experienced failures

**Most Affected Endpoints**:
1. `/api/v1/ops-db-histories/` - 26 failures (504 Gateway Timeout)
2. `/api/v1/budget-line-items/?limit=10&offset=0` - 13 failures (504 Gateway Timeout)
3. `/api/v1/agreements/` - 10 failures (504 Gateway Timeout)
4. `/api/v1/administrative-and-support-projects/` - 6 failures (504 Gateway Timeout)
5. `/api/v1/notifications/` - 6 failures (504 Gateway Timeout)

**Root Cause Hypothesis**:
- Database query performance issues (missing indexes, inefficient queries)
- Insufficient connection pool sizing for production load
- Gateway timeout threshold (20s) too aggressive for complex queries
- Potential N+1 query problems in ORM relationships

**Recommendations**:
1. **IMMEDIATE**: Review and optimize database queries for timeout-prone endpoints
2. Increase gateway timeout threshold to 60s for complex queries
3. Add database query performance monitoring (slow query logs)
4. Implement database connection pooling analysis
5. Review SQLAlchemy relationship loading strategies (lazy vs eager loading)
6. Consider implementing query result caching for frequently accessed data

---

### Issue 2: `/api/v1/ops-db-histories/` Endpoint Failure (CRITICAL)

**Severity**: 🔴 Critical
**Impact**: Medium - Endpoint appears non-functional

**Description**: This endpoint has a 100% failure rate across all test scenarios and environments.

**Failure Breakdown by Environment**:
- **Development Baseline**: 10 failures (404 Not Found)
- **Staging Baseline**: 2 failures (504 Gateway Timeout)
- **Production Baseline**: 6 failures (504 Gateway Timeout)
- **Production Normal**: 26 failures (504 Gateway Timeout)

**Analysis**: The endpoint either:
1. Does not exist (404 in dev suggests routing issue)
2. Has severe performance issues causing consistent timeouts
3. Requires specific query parameters not being provided by the test

**Recommendations**:
1. **IMMEDIATE**: Verify endpoint exists and is properly routed
2. If endpoint is deprecated, remove from API or add deprecation notice
3. If endpoint is active, investigate database query performance
4. Add query parameter validation and better error messages
5. Consider removing this endpoint from production if unused

---

### Issue 3: `/api/v1/agreement-agencies/` Missing Data (HIGH)

**Severity**: 🟠 High
**Impact**: Medium - Data integrity issue

**Description**: 47 consecutive 404 errors in production normal load test, plus 10 failures in production baseline.

**Failure Pattern**:
```
GET /api/v1/agreement-agencies/ - HTTPError('404 Client Error: Not Found')
```

**Analysis**: This appears to be a data availability issue rather than a performance issue. The endpoint exists but returns 404, suggesting:
1. Missing reference data in production database
2. Endpoint expecting query parameters that aren't provided
3. Authentication/authorization issue for specific data

**Recommendations**:
1. Verify `agreement-agencies` reference data exists in production database
2. Check if endpoint requires specific query parameters
3. Review endpoint logic for proper error handling (should return empty array, not 404)
4. Add data validation checks in deployment pipeline

---

### Issue 4: Slow Individual Endpoints

**Severity**: 🟡 Medium
**Impact**: Medium - User experience degradation

**Slowest Endpoints by Environment**:

#### Development Baseline (3 users):
1. `/api/v1/agreements/[id]` - 14226ms avg (158s max) ⚠️
2. `/api/v1/budget-line-items/[id]` - 7300ms avg (22s max)
3. `/api/v1/can-funding-details/[id]` - 3900ms avg (8s max)

#### Staging Baseline (3 users):
1. `/api/v1/ops-db-histories/` - 240s timeout (4 minutes)
2. `/api/v1/agreements/[id]` - 3200ms avg (6s max)
3. `/api/v1/portfolios/[id]/cans/` - 2400ms avg (5s max)

#### Production Baseline (3 users):
1. `/api/v1/ops-db-histories/` - 20s timeout
2. `/api/v1/agreements/[id]` - 4100ms avg (20s max)
3. `/api/v1/budget-line-items/[id]` - 3800ms avg (19s max)

#### Production Normal Load (10 users):
1. `/api/v1/agreements/[id]` - 6100ms avg (20s max)
2. `/api/v1/budget-line-items/[id]` - 5900ms avg (20s max)
3. `/api/v1/can-funding-details/[id]` - 5100ms avg (20s max)

**Analysis**: Response times degrade significantly as load increases. The 158-second max response time in development for `/api/v1/agreements/[id]` is particularly concerning.

**Recommendations**:
1. Optimize `/api/v1/agreements/[id]` endpoint (likely N+1 query issue)
2. Review eager loading strategy for agreement relationships
3. Implement database query result caching for detail endpoints
4. Add database query performance monitoring
5. Consider implementing read replicas for detail queries

---

## Performance Metrics by Environment

### Development Environment (dev.ops.opre.acf.gov)

**Test**: Baseline (3 users, 10 minutes)

**Overall Performance**:
- Total Requests: 496
- Failures: 10 (2.02%)
- Median Response Time: 190ms
- Average Response Time: 1192ms
- RPS: 0.8

**Top Performing Endpoints** (fastest):
1. `/api/v1/health/` - 48ms avg
2. `/api/v1/can-funding-received/[id]` - 110ms avg
3. `/api/v1/cans/[id]` - 140ms avg
4. `/api/v1/portfolios/[id]` - 150ms avg

**Worst Performing Endpoints** (slowest):
1. `/api/v1/agreements/[id]` - 14226ms avg (158s max) ⚠️
2. `/api/v1/budget-line-items/[id]` - 7300ms avg (22s max)
3. `/api/v1/can-funding-details/[id]` - 3900ms avg (8s max)

**Failure Analysis**:
- 10x `/api/v1/ops-db-histories/` - 404 Not Found

**Assessment**: Development environment shows acceptable baseline performance but has one extreme outlier endpoint (`agreements/[id]`). The 158-second response time suggests a severe performance issue that needs immediate investigation.

---

### Staging Environment (stg.ops.opre.acf.gov)

#### Baseline Test (3 users, 10 minutes)

**Overall Performance**:
- Total Requests: 496
- Failures: 3 (0.60%)
- Median Response Time: 180ms
- Average Response Time: 4044ms (skewed by timeout)
- RPS: 0.8

**Top Performing Endpoints** (fastest):
1. `/api/v1/health/` - 42ms avg
2. `/api/v1/cans/[id]` - 130ms avg
3. `/api/v1/portfolios/[id]` - 140ms avg

**Worst Performing Endpoints** (slowest):
1. `/api/v1/ops-db-histories/` - 240s timeout (4 minutes)
2. `/api/v1/agreements/[id]` - 3200ms avg (6s max)
3. `/api/v1/portfolios/[id]/cans/` - 2400ms avg (5s max)

**Failure Analysis**:
- 2x `/api/v1/ops-db-histories/` - 504 Gateway Timeout
- 1x `/api/v1/agreement-history/[id]` - 404 Not Found

**Assessment**: Staging baseline performance is good overall (0.6% failure rate) but the 4-minute timeout on `ops-db-histories` is concerning.

#### Normal Load Test (10 users, 20 minutes)

**Overall Performance**:
- Total Requests: 564
- Failures: 19 (3.37%)
- Median Response Time: 210ms
- Average Response Time: 1959ms
- RPS: 0.47

**Assessment**: Staging shows degradation under normal load but remains within acceptable thresholds. The increased failure rate (3.37%) indicates the environment can handle 10 concurrent users but is approaching capacity limits.

---

### Production Environment (ops.opre.acf.gov)

#### Baseline Test (3 users, 10 minutes)

**Overall Performance**:
- Total Requests: 564
- Failures: 19 (3.37%)
- Median Response Time: 210ms
- Average Response Time: 1956ms
- RPS: 0.9

**Top Performing Endpoints** (fastest):
1. `/api/v1/health/` - 45ms avg
2. `/api/v1/can-funding-received/[id]` - 120ms avg
3. `/api/v1/cans/[id]` - 150ms avg

**Worst Performing Endpoints** (slowest):
1. `/api/v1/ops-db-histories/` - 20s timeout (all 6 requests failed)
2. `/api/v1/agreements/[id]` - 4100ms avg (20s max)
3. `/api/v1/budget-line-items/[id]` - 3800ms avg (19s max)

**Failure Analysis**:
- 6x `/api/v1/ops-db-histories/` - 504 Gateway Timeout
- 10x `/api/v1/agreement-agencies/` - 404 Not Found
- 3x `/api/v1/can-funding-received/[id]` - 404 Not Found

**Assessment**: Production baseline shows higher failure rate (3.37%) than staging baseline (0.6%), indicating production has existing performance issues even under light load.

#### Normal Load Test (10 users, 20 minutes) ⚠️ CRITICAL

**Overall Performance**:
- Total Requests: 2146
- Failures: 224 (10.44%) 🔴
- Median Response Time: 940ms
- Average Response Time: 6613ms
- RPS: 1.8

**Response Time Distribution**:
- p50: 940ms (Acceptable)
- p95: 20000ms (Critical - gateway timeout)
- p99: 20000ms (Critical - gateway timeout)

**Top Performing Endpoints** (fastest):
1. `/api/v1/health/` - 180ms avg
2. `/api/v1/can-funding-received/[id]` - 630ms avg
3. `/api/v1/cans/[id]` - 750ms avg

**Worst Performing Endpoints** (slowest):
1. `/api/v1/agreements/[id]` - 6100ms avg (20s max)
2. `/api/v1/budget-line-items/[id]` - 5900ms avg (20s max)
3. `/api/v1/can-funding-details/[id]` - 5100ms avg (20s max)
4. `/api/v1/portfolios/[id]` - 4800ms avg (20s max)
5. `/api/v1/projects/[id]` - 4600ms avg (20s max)

**Failure Analysis** (36 unique endpoints failed):
- 26x `/api/v1/ops-db-histories/` - 504 Gateway Timeout
- 13x `/api/v1/budget-line-items/?limit=10&offset=0` - 504 Gateway Timeout
- 10x `/api/v1/agreements/` - 504 Gateway Timeout
- 47x `/api/v1/agreement-agencies/` - 404 Not Found
- 6x `/api/v1/administrative-and-support-projects/` - 504 Gateway Timeout
- 6x `/api/v1/notifications/` - 504 Gateway Timeout
- Plus 30 other endpoints with 1-5 failures each

**Assessment**: 🔴 **CRITICAL FAILURE** - Production cannot handle normal load (10 concurrent users). 10.44% failure rate is unacceptable for production. The widespread 20-second timeouts across 36 different endpoints indicate systemic performance issues.

---

## Gateway Timeout Analysis

### Timeout Configuration Issue

**Observation**: Nearly all failures in production normal load are 504 Gateway Timeout errors with exactly 20-second response times.

**Current Configuration**: Gateway timeout appears to be set at 20 seconds

**Impact**: This threshold is too aggressive for endpoints that:
- Perform complex database queries
- Aggregate data across multiple tables
- Process historical records
- Handle large result sets

**Affected Operations**:
- Detail views with nested relationships (`/api/v1/agreements/[id]`)
- List endpoints with complex filters (`/api/v1/budget-line-items/`)
- History/audit trail endpoints (`/api/v1/ops-db-histories/`)
- Aggregation endpoints (`/api/v1/can-funding-summary/`)

**Recommendation**:
1. Increase gateway timeout to 60 seconds for API endpoints
2. Implement tiered timeout strategy:
   - Simple GET operations: 10s
   - List operations: 30s
   - Detail operations with relationships: 60s
   - Complex aggregations: 90s
3. Add application-level timeout warnings before gateway timeout
4. Optimize queries to complete within target timeframes

---

## Database Performance Analysis

### Query Performance Concerns

**Evidence of Database Issues**:
1. **Consistent timeout patterns**: Same endpoints timeout across multiple test runs
2. **Load sensitivity**: Response times increase dramatically with concurrent users
3. **Detail endpoint slowness**: Endpoints retrieving single records by ID are extremely slow

**Likely Root Causes**:

#### 1. N+1 Query Problem
**Symptoms**: Detail endpoints (`/agreements/[id]`, `/budget-line-items/[id]`) are disproportionately slow

**Example Issue**: Retrieving an agreement might trigger:
- 1 query for the agreement
- N queries for budget line items (one per BLI)
- N queries for each BLI's related CAN
- N queries for each BLI's status history

**Solution**: Implement eager loading with SQLAlchemy's `joinedload()` or `selectinload()`

#### 2. Missing Database Indexes
**Symptoms**: List endpoints with filters/queries are slow

**Likely Missing Indexes**:
- Foreign key columns (agreement_id, can_id, project_id, etc.)
- Frequently filtered columns (fiscal_year, status, portfolio_id)
- Composite indexes for common query patterns

**Solution**: Analyze slow query logs and add appropriate indexes

#### 3. Large Table Scans
**Symptoms**: `/api/v1/ops-db-histories/` times out consistently

**Possible Causes**:
- Table has grown very large (millions of audit records)
- No pagination implemented
- No date range filtering
- Missing indexes on timestamp columns

**Solution**: Implement pagination, date filters, and appropriate indexes

#### 4. Insufficient Connection Pool
**Symptoms**: Performance degrades with concurrent users

**Analysis**: With only 10 concurrent users causing 10% failure rate, the connection pool may be exhausted

**Solution**: Review and increase database connection pool size in production configuration

---

## Recommendations

### Immediate Actions (Within 1 Week)

#### Priority 1: Production Stability
1. **Increase gateway timeout** from 20s to 60s to prevent false timeout failures
2. **Investigate `/api/v1/ops-db-histories/`** endpoint:
   - Verify endpoint is needed (100% failure rate suggests it may be deprecated)
   - If needed, implement pagination and date filtering
   - Add appropriate database indexes
   - Consider archiving old audit records
3. **Fix `/api/v1/agreement-agencies/`** 404 errors:
   - Verify reference data exists in production
   - Fix endpoint to return empty array instead of 404

#### Priority 2: Database Performance
1. **Enable slow query logging** in production (queries > 1 second)
2. **Analyze top 10 slowest queries** and optimize:
   - `/api/v1/agreements/[id]`
   - `/api/v1/budget-line-items/[id]`
   - `/api/v1/can-funding-details/[id]`
3. **Review SQLAlchemy relationship loading**:
   - Implement eager loading for detail endpoints
   - Use `selectinload()` for one-to-many relationships
   - Use `joinedload()` for many-to-one relationships
4. **Add missing database indexes**:
   - Foreign key columns
   - Frequently filtered columns
   - Composite indexes for common queries

#### Priority 3: Monitoring
1. **Implement application performance monitoring (APM)**:
   - Track endpoint response times
   - Monitor database query performance
   - Alert on error rate thresholds
2. **Add database connection pool monitoring**
3. **Set up automated performance regression testing**

---

### Short-Term Actions (Within 1 Month)

1. **Implement result caching**:
   - Redis/Memcached for frequently accessed data
   - Cache detail views with 5-minute TTL
   - Cache list views with 1-minute TTL
   - Invalidate cache on data mutations

2. **Optimize endpoint response payloads**:
   - Review what data is actually needed by frontend
   - Implement field selection (sparse fieldsets)
   - Remove unnecessary nested relationships
   - Use pagination consistently

3. **Database optimization**:
   - Analyze and optimize table schemas
   - Review and optimize all database indexes
   - Implement database connection pooling tuning
   - Consider read replicas for heavy read operations

4. **Load testing improvements**:
   - Implement continuous load testing in CI/CD
   - Test with higher user loads (20, 50, 100 users)
   - Test spike scenarios
   - Test with production-like data volumes

---

### Long-Term Actions (Within 3 Months)

1. **Architectural improvements**:
   - Consider implementing GraphQL for flexible data fetching
   - Evaluate microservices architecture for high-traffic endpoints
   - Implement event sourcing for audit trails
   - Consider CQRS pattern for read-heavy operations

2. **Scalability enhancements**:
   - Implement horizontal scaling for API servers
   - Set up load balancer with health checks
   - Implement circuit breakers for failing endpoints
   - Add rate limiting to prevent abuse

3. **Database scaling**:
   - Implement read replicas
   - Consider database sharding for large tables
   - Implement database query result caching
   - Archive historical data to separate tables/database

4. **Performance culture**:
   - Establish performance budgets for endpoints
   - Implement performance testing in CI/CD pipeline
   - Add performance metrics to sprint reviews
   - Create performance optimization backlog

---

## Conclusion

The performance testing revealed **critical scalability issues in production** that require immediate attention. While the application performs adequately under light load (3 users), it experiences catastrophic failure rates (10.44%) under normal load conditions (10 users).

### Critical Findings Summary:

1. 🔴 **Production cannot handle normal production load** (10 concurrent users)
2. 🔴 **`/api/v1/ops-db-histories/` endpoint has 100% failure rate** across all environments
3. 🔴 **Gateway timeout configuration (20s) is too aggressive** for complex queries
4. 🟠 **Database query performance issues** evident across multiple endpoints
5. 🟠 **Missing data or misconfigured endpoints** (`/api/v1/agreement-agencies/`)

### Success Metrics for Resolution:

Before considering production ready for normal load:
- Error rate < 1% with 10 concurrent users
- p95 response time < 2000ms for all endpoints
- Zero 504 Gateway Timeout errors
- All endpoints have < 5% failure rate
- Successful stress test with 20+ concurrent users

### Next Steps:

1. **Immediate** (This Week): Increase gateway timeout, investigate failing endpoints
2. **Short-term** (This Month): Optimize database queries, add indexes, implement caching
3. **Long-term** (3 Months): Architectural improvements, scalability enhancements

The good news is that these issues are solvable with proper database optimization, caching strategies, and configuration tuning. The shared cache optimization implemented during this testing phase demonstrates that targeted improvements can have significant impact.

---

## Appendix: Test Execution Details

### Test Environment Configuration
- **Locust Version**: 2.32.4
- **Python Version**: 3.x (pipenv managed)
- **Authentication**: JWT Bearer tokens (30-minute expiration)
- **Cache Strategy**: Shared cache populated once at test start

### Test Files Generated
```
performance_tests/results/2025-10-15/
├── TEST_PLAN.md
├── dev-baseline.html
├── dev-baseline_stats.csv
├── dev-baseline_stats_history.csv
├── dev-baseline_failures.csv
├── stg-baseline.html
├── stg-baseline_stats.csv
├── stg-baseline_stats_history.csv
├── stg-baseline_failures.csv
├── stg-baseline-normal.html
├── stg-baseline-normal_stats.csv
├── stg-baseline-normal_stats_history.csv
├── stg-baseline-normal_failures.csv
├── production-baseline.html
├── production-baseline_stats.csv
├── production-baseline_stats_history.csv
├── production-baseline_failures.csv
├── production-baseline-normal.html
├── production-baseline-normal_stats.csv
├── production-baseline-normal_stats_history.csv
├── production-baseline-normal_failures.csv
└── PERFORMANCE_REPORT.md (this file)
```

### Locust Test Suite Coverage

The test suite exercises **46 different API endpoints** covering:
- Authentication and health checks
- CAN (Contract Account Number) operations
- Agreement operations
- Budget line item operations
- Project and portfolio operations
- Administrative and support projects
- Notifications and change requests
- Historical and audit trail data
- Reference data endpoints

### Shared Cache Optimization

During test development, a critical optimization was implemented to prevent cache population timeouts:

**Problem**: With N concurrent users, each user attempted to populate their own cache, causing N simultaneous requests to slow endpoints like `/api/v1/budget-line-items/`, resulting in 504 timeouts.

**Solution**: Implemented shared cache pattern:
- Cache populated once at test start (before users spawn)
- All users share single SHARED_CACHE dictionary
- Reduced N simultaneous requests to 1 request
- Added 120-second timeout for cache population
- Used pagination (`?limit=100&offset=0`) for large datasets

**Result**: Successfully eliminated cache population timeout issues.

---

**Report Prepared**: October 16, 2025
**Report Version**: 1.0
**Next Review**: After implementing immediate recommendations
