# Testing Flaky Test Detection Effectiveness

This guide provides methods to verify the flaky test detection script works correctly in real-world scenarios.

## Quick Test: Synthetic Test Cases

The fastest way to verify basic functionality:

```bash
# Run the built-in test suite
./.github/scripts/test-flaky-detection.sh
```

**What this validates:**
- ✅ Detects tests that failed then passed
- ✅ Ignores tests that passed on first attempt
- ✅ Ignores tests that failed all retry attempts
- ✅ Error handling for missing files

## Method 1: Intentionally Flaky Test (Recommended)

Create a test that's actually flaky to verify detection in a real E2E run.

### Setup

```bash
# Create the flaky test
bash ./.github/scripts/create-flaky-test.sh

# Add to cypress config (or run with single spec)
```

### Run Test

```bash
cd frontend

# Option A: Run just the flaky test multiple times
for i in {1..5}; do
    echo "=== Run $i ==="
    bun run cypress run \
        --config-file cypress.config.ci.js \
        --spec cypress/e2e/flakyTest.cy.js \
        2>&1 | tee -a /tmp/flaky-test-output.log
done

# Option B: Run with all E2E tests
docker compose up db data-import --build -d
bun run test:e2e 2>&1 | tee /tmp/cypress-output.log
```

### Analyze Results

```bash
# Run detection script
./.github/scripts/detect-flaky-tests.sh /tmp/flaky-test-output.log

# Expected: Should report flakyTest.cy.js as flaky (if it failed then passed)
```

### Cleanup

```bash
rm frontend/cypress/e2e/flakyTest.cy.js
```

## Method 2: Test Against CI Logs

Download actual CI logs from a PR run and test against them.

### Download CI Logs

```bash
# Find recent CI runs
gh run list --branch feature/flaky-test-detection --limit 5

# Download logs from a specific E2E test job
gh run view <RUN_ID> --log-failed > /tmp/ci-logs.txt

# Or download from a specific job
gh run view <RUN_ID> --job <JOB_ID> --log > /tmp/ci-job-logs.txt
```

### Analyze CI Logs

```bash
# Run detection
./.github/scripts/detect-flaky-tests.sh /tmp/ci-logs.txt

# Compare with actual CI behavior
# - Check GitHub Actions job summary for flaky tests
# - Verify the script's findings match reality
```

## Method 3: Historical Analysis

Test against known flaky tests from past CI runs.

```bash
# Find a CI run with known flaky behavior
gh run list --workflow="Continuous Integration" --limit 20

# Download and analyze
gh run view <RUN_ID> --log > /tmp/historical-run.log
./.github/scripts/detect-flaky-tests.sh /tmp/historical-run.log
```

## Method 4: Local E2E Test Run

Run E2E tests locally with retries enabled to capture real flakiness.

### Setup

```bash
# Start the application
docker compose up --build -d

# Wait for services to be ready
sleep 30
```

### Run Tests with Retry Tracking

```bash
cd frontend

# Run with CI config (includes retries)
bun run cypress run --config-file cypress.config.ci.js 2>&1 | tee /tmp/local-e2e.log

# Analyze
./.github/scripts/detect-flaky-tests.sh /tmp/local-e2e.log
```

### Expected Outcomes

If you have flaky tests in your suite:
- Script should report only tests that failed initially but passed on retry
- Should NOT report tests that passed first time
- Should NOT report tests that failed all attempts

## Effectiveness Metrics

To measure effectiveness, track:

1. **False Positive Rate**: Tests flagged as flaky that are actually broken
   - Should be **near 0%** with the updated script
   - Old script would have high FP rate during bad CI runs

2. **True Positive Rate**: Known flaky tests that get detected
   - Should be **100%** if they exhibit retry behavior

3. **Actionability**: Can developers fix flagged tests?
   - Flagged tests should have actual timing/race condition issues
   - Not just consistently broken features

## Validation Checklist

- [ ] Synthetic tests pass (test-flaky-detection.sh)
- [ ] Intentionally flaky test gets detected when it retries
- [ ] Intentionally flaky test is NOT detected when it passes first time
- [ ] Consistently broken test is NOT flagged as flaky
- [ ] CI runs with no retries report "No flaky tests detected"
- [ ] Script output is readable and actionable
- [ ] GitHub Actions job summary displays correctly

## Troubleshooting

### Script reports no flaky tests but CI had retries

Check if the retried tests actually passed:
```bash
# Look for specs with retries that still failed
grep -E "Attempt [2-9]" /tmp/cypress-output.log | grep -A 20 "failing"
```

### Script reports wrong tests

Verify the Cypress output format matches expectations:
```bash
# Check the actual format
grep -E "^Running:" /tmp/cypress-output.log | head -10
grep -E "passing|failing" /tmp/cypress-output.log | head -10
```

### Script crashes or has errors

Run with verbose output:
```bash
bash -x ./.github/scripts/detect-flaky-tests.sh /tmp/cypress-output.log
```

## Next Steps

After validating effectiveness:

1. **Monitor in production**: Watch PR CI runs for accurate detection
2. **Track metrics**: Keep count of detected flaky tests over time
3. **Fix flagged tests**: Use reports to improve test reliability
4. **Iterate**: Adjust detection logic if false positives/negatives occur
