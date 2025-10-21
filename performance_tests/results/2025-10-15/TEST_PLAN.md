# OPS API Performance Test Plan - Azure Environments
**Test Date**: October 15, 2025
**Tester**: John DeAngelis
**Test Tool**: Locust 2.32.4
**Test Type**: Load Testing & Performance Baseline

## Objectives

1. **Establish Performance Baselines**: Measure and document baseline performance metrics for each environment
2. **Identify Bottlenecks**: Detect performance issues and slow endpoints across environments
3. **Compare Environment Performance**: Analyze performance differences between dev, staging, and production
4. **Validate Scalability**: Test system behavior under various load conditions
5. **Document Findings**: Create comprehensive reports for stakeholder review

## Environments Under Test

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Development** | https://dev.ops.opre.acf.gov | Latest development features, frequent deployments |
| **Staging** | https://stg.ops.opre.acf.gov | Pre-production validation, production-like data |
| **Production** | https://ops.opre.acf.gov | Live production system serving real users |

## Test Scenarios

### Scenario 1: Baseline Performance Test (Light Load)
**Objective**: Establish baseline performance metrics with minimal load

- **Users**: 3 concurrent users
- **Spawn Rate**: 1 user/second
- **Duration**: 10 minutes
- **Target**: All environments (dev, staging, production)

**Success Criteria**:
- Response time p50 < 200ms for list endpoints
- Response time p95 < 500ms for list endpoints
- Response time p99 < 1000ms for list endpoints
- Error rate < 1%

### Scenario 2: Normal Load Test
**Objective**: Simulate typical production usage patterns

- **Users**: 10 concurrent users
- **Spawn Rate**: 2 users/second
- **Duration**: 20 minutes
- **Target**: Staging and production (skip dev to avoid overload)

**Success Criteria**:
- Response time p95 < 1000ms
- Error rate < 2%
- No system crashes or timeouts
- Consistent performance throughout test duration

### Scenario 3: Stress Test (was not executed because staging does not have capacity for this)
**Objective**: Determine system limits and breaking points

- **Users**: Start at 10, increase to 50
- **Spawn Rate**: 5 users/second
- **Duration**: 30 minutes (or until failure)
- **Target**: Staging only (NOT production)

**Success Criteria**:
- Identify maximum sustainable user load
- Document degradation patterns
- Verify graceful degradation (no crashes)

### Scenario 4: Spike Test (was not executed because staging does not have capacity for this)
**Objective**: Test system resilience to sudden traffic spikes

- **Phase 1**: 5 users for 5 minutes (baseline)
- **Phase 2**: Spike to 30 users for 2 minutes
- **Phase 3**: Drop to 5 users for 5 minutes (recovery)
- **Target**: Staging only

**Success Criteria**:
- System handles spike without crashes
- Performance degrades gracefully
- System recovers to baseline after spike

## Test Execution Plan

### Pre-Test Checklist

- [ ] Verify all environments are accessible
- [ ] Obtain fresh JWT tokens for each environment (< 30 min old)
- [ ] Set up environment variables for each test
- [ ] Create test results directories
- [ ] Verify Locust installation: `pipenv run locust --version`
- [ ] Test connectivity to each environment
- [ ] Coordinate with DevOps team for staging/production tests
- [ ] Set up monitoring dashboards (if available)

### Test Execution Order

**Day 1: Development Environment**
1. Run Scenario 1 (Baseline) on dev
2. Analyze results
3. Document any issues

**Day 2: Staging Environment**
1. Run Scenario 1 (Baseline) on staging
2. Run Scenario 2 (Normal Load) on staging
3. Run Scenario 3 (Stress Test) on staging
4. Run Scenario 4 (Spike Test) on staging
5. Analyze and compare with dev results

**Day 3: Production Environment**
1. Coordinate with stakeholders (production testing requires approval)
2. Run Scenario 1 (Baseline) on production during off-peak hours
3. Run Scenario 2 (Normal Load) on production during off-peak hours
4. **DO NOT run stress or spike tests on production**
5. Analyze and compare with dev/staging results

## Test Commands

### Development Environment

```bash
# Get JWT token from https://dev.ops.opre.acf.gov/
# DevTools → Application → Local Storage → access_token

export JWT_TOKEN="your-dev-token-here"
export API_HOST="https://dev.ops.opre.acf.gov"

# Verify connectivity
http GET "$API_HOST/api/v1/health/" "Authorization: Bearer $JWT_TOKEN"

# Navigate to ops_api directory
cd backend/ops_api

# Scenario 1: Baseline (10 min, 3 users)
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=$API_HOST \
  --users 3 \
  --spawn-rate 1 \
  --run-time 10m \
  --headless \
  --html ../../performance_tests/results/2025-10-15/dev-baseline.html \
  --csv ../../performance_tests/results/2025-10-15/dev-baseline
```

### Staging Environment

```bash
# Get JWT token from https://stg.ops.opre.acf.gov/
export JWT_TOKEN="your-staging-token-here"
export API_HOST="https://stg.ops.opre.acf.gov"

# Verify connectivity
http GET "$API_HOST/api/v1/health/" "Authorization: Bearer $JWT_TOKEN"

cd backend/ops_api

# Scenario 1: Baseline (10 min, 3 users)
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=$API_HOST \
  --users 3 \
  --spawn-rate 1 \
  --run-time 10m \
  --headless \
  --html ../../performance_tests/results/2025-10-15/stg-baseline.html \
  --csv ../../performance_tests/results/2025-10-15/stg-baseline

# Scenario 2: Normal Load (20 min, 10 users)
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=$API_HOST \
  --users 10 \
  --spawn-rate 2 \
  --run-time 20m \
  --headless \
  --html ../../performance_tests/results/2025-10-15/stg-baseline-normal.html \
  --csv ../../performance_tests/results/2025-10-15/stg-baseline-normal
```

### Production Environment

**⚠️ IMPORTANT**:
- Coordinate with stakeholders before testing production
- Run during off-peak hours (e.g., 2-4 AM EST)
- Start with minimal load
- Have rollback plan ready
- Monitor system resources closely

```bash
# Get JWT token from https://ops.opre.acf.gov/
export JWT_TOKEN="your-production-token-here"
export API_HOST="https://ops.opre.acf.gov"

# Verify connectivity
http GET "$API_HOST/api/v1/health/" "Authorization: Bearer $JWT_TOKEN"

cd backend/ops_api

# Scenario 1: Baseline (10 min, 3 users) - OFF PEAK HOURS ONLY
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=$API_HOST \
  --users 3 \
  --spawn-rate 1 \
  --run-time 10m \
  --headless \
  --html ../../performance_tests/results/2025-10-15/production-baseline.html \
  --csv ../../performance_tests/results/2025-10-15/production-baseline

# Scenario 2: Normal Load (20 min, 10 users) - OFF PEAK HOURS ONLY
# Get approval from stakeholders first
pipenv run locust -f ../../performance_tests/locustfile.py \
  --host=$API_HOST \
  --users 10 \
  --spawn-rate 2 \
  --run-time 20m \
  --headless \
  --html ../../performance_tests/results/2025-10-15/production-baseline-normal.html \
  --csv ../../performance_tests/results/2025-10-15/production-baseline-normal
```

## Token Management

**CRITICAL**: JWT tokens expire after 30 minutes!

### Token Refresh Strategy

1. **Before each test**: Get a fresh token (especially for tests > 30 min)
2. **During long tests**:
   - For tests > 30 min, plan to restart with fresh token
   - Or use Locust web UI (http://localhost:8089) to monitor and restart manually
3. **Token checklist**:
   ```bash
   # Check token age
   echo $JWT_TOKEN | cut -d'.' -f2 | base64 -d | jq '.exp'

   # Verify token works
   http GET "$API_HOST/api/v1/health/" "Authorization: Bearer $JWT_TOKEN"
   ```

## Monitoring During Tests

### What to Monitor

1. **Locust Metrics**:
   - Requests per second (RPS)
   - Response time percentiles (p50, p95, p99)
   - Failure rate
   - Number of active users

2. **System Metrics** (if accessible):
   - CPU utilization
   - Memory usage
   - Database connections
   - Network I/O

3. **Application Logs**:
   - Error rates
   - Slow query logs
   - Exception traces

### Stop Conditions

Stop the test immediately if:
- Error rate > 10%
- Response time p99 > 30 seconds
- System becomes unresponsive
- Database connections exhausted
- Stakeholder requests halt

## Expected Results

### Performance Baselines (Target Metrics)

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Response Time p50 | < 200ms | < 500ms | > 1000ms |
| Response Time p95 | < 500ms | < 1000ms | > 2000ms |
| Response Time p99 | < 1000ms | < 2000ms | > 5000ms |
| Error Rate | < 1% | < 5% | > 10% |
| Throughput (RPS) | > 50 | > 20 | < 10 |

### Environment Comparison

Expected performance ranking (fastest to slowest):
1. **Development**: May be slower due to debug settings and smaller infrastructure
2. **Staging**: Should be similar to production
3. **Production**: Optimized configuration, but higher baseline load

## Results Documentation

### For Each Test Run, Document:

1. **Test metadata**:
   - Environment tested
   - Date/time
   - Test scenario
   - Test duration
   - Number of users

2. **Performance metrics**:
   - Total requests
   - Requests per second
   - Response time percentiles (p50, p95, p99)
   - Error rate and error types
   - Slowest endpoints

3. **Observations**:
   - Any errors or failures
   - Performance anomalies
   - System behavior under load
   - Notable patterns

4. **Generated files**:
   - HTML report: `<env>-<scenario>.html`
   - CSV files: `<env>-<scenario>_stats.csv`, `<env>-<scenario>_stats_history.csv`, `<env>-<scenario>_failures.csv`
   - Screenshots of Locust UI (if applicable)

## Post-Test Analysis

### Analysis Tasks

1. **Compare environments**:
   - Create comparison charts for response times
   - Identify performance gaps between environments
   - Document inconsistencies

2. **Identify bottlenecks**:
   - List slowest endpoints (p95 > 1s)
   - Categorize issues (database, network, application logic)
   - Prioritize for optimization

3. **Generate executive summary**:
   - Overall findings
   - Critical issues
   - Recommendations
   - Next steps

### Deliverables

1. **Individual test reports**: HTML reports for each test run
2. **Comparison report**: Cross-environment analysis
3. **Executive summary**: High-level findings and recommendations
4. **Raw data**: CSV files for further analysis
5. **Screenshots**: Key charts and metrics

## Risk Assessment

### Development Environment
- **Risk**: Low
- **Impact**: Low (isolated environment)
- **Mitigation**: None required

### Staging Environment
- **Risk**: Low-Medium
- **Impact**: Medium (may affect QA testing)
- **Mitigation**:
  - Coordinate with QA team
  - Schedule during off-hours
  - Monitor and stop if issues arise

### Production Environment
- **Risk**: High
- **Impact**: High (affects live users)
- **Mitigation**:
  - **Require stakeholder approval**
  - Test during off-peak hours (2-4 AM EST)
  - Start with minimal load (5 users)
  - Have incident response plan ready
  - Monitor continuously
  - Stop immediately if issues arise
  - **DO NOT run stress tests on production**

## Approval and Sign-off

### Required Approvals

- [ ] **Development Testing**: Team Lead approval
- [ ] **Staging Testing**: QA Team coordination
- [ ] **Production Testing**:
  - [ ] Product Owner approval
  - [ ] DevOps Team approval
  - [ ] Scheduled maintenance window (if needed)

### Sign-off

**Prepared by**: ___________________ Date: ___________

**Approved by**: ___________________ Date: ___________

**Production Test Approval**: ___________________ Date: ___________

## Appendix A: Environment-Specific Notes

### Development (dev.ops.opre.acf.gov)
- Latest code deployments
- May have debug settings enabled
- Smaller infrastructure (lower capacity)
- Data may be in flux

### Staging (stg.ops.opre.acf.gov)
- Production-like configuration
- Stable data for testing
- Similar infrastructure to production
- Safe for stress testing

### Production (ops.opre.acf.gov)
- Live user data
- Optimized configuration
- Full infrastructure
- **Extra caution required**

## Appendix B: Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Token expired (> 30 min old)
   - Wrong environment token
   - Solution: Get fresh token from correct environment

2. **High Error Rates**:
   - System overloaded
   - Network issues
   - Solution: Reduce load, check logs

3. **Connection Errors**:
   - Network timeout
   - Firewall blocking
   - Solution: Verify connectivity, check with DevOps

### Support Contacts

- **DevOps Team**: [Contact info]
- **QA Team**: [Contact info]
- **Product Owner**: [Contact info]

## Appendix C: Results File Structure

```
performance_tests/results/2025-10-15/
├── TEST_PLAN.md (this file)
├── dev-baseline.html
├── dev-baseline_stats.csv
├── dev-baseline_stats_history.csv
├── dev-baseline_failures.csv
├── staging-baseline.html
├── stg-baseline_stats.csv
├── stg-baseline_stats_history.csv
├── stg-baseline_failures.csv
├── stg-normal-load.html
├── st-normal-load_stats.csv
├── stg-normal-load_stats_history.csv
├── stg-normal-load_failures.csv
├── stg-stress-test.html
├── stg-stress-test_stats.csv
├── stg-stress-test_stats_history.csv
├── stg-stress-test_failures.csv
├── production-baseline.html
├── production-baseline_stats.csv
├── production-baseline_stats_history.csv
├── production-baseline_failures.csv
├── production-normal-load.html
├── production-normal-load_stats.csv
├── production-normal-load_stats_history.csv
├── production-normal-load_failures.csv
├── PERFORMANCE_REPORT.md (created post-test)
```
