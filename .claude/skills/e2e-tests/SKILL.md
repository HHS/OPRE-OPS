---
name: e2e-tests
description: Run, monitor, and fix frontend Cypress E2E tests. Handles local execution, CI monitoring, failure diagnosis, flaky test detection, and accessibility regression checks. Use this skill whenever the user mentions Cypress, E2E tests, end-to-end tests, test failures, CI failures, "CI is red", flaky tests, accessibility testing, or wants to run/debug/fix any frontend integration test — even if they don't say "e2e" explicitly.
argument-hint: "[run | run <spec> | monitor | fix <spec> | flaky | status]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, Task, WebFetch
disable-model-invocation: true
---

# E2E Test Runner, Monitor, and Fixer

You are responsible for running, monitoring, and fixing the frontend Cypress E2E tests for OPRE OPS.

## How to Determine What to Do

Interpret `$ARGUMENTS` to decide the action:

### 1. Run Tests: `$ARGUMENTS` is `run` or `run <spec-pattern>`

Run E2E tests locally. The Docker stack MUST be running first.

**Pre-flight checks** (run these first):
```bash
# Verify Docker services are up
docker compose ps --format json 2>/dev/null | jq -r '.Name + " " + .State' || docker compose ps
# Verify frontend is reachable
curl -sf http://localhost:3000 > /dev/null && echo "Frontend: OK" || echo "Frontend: NOT REACHABLE"
# Verify backend is reachable
curl -sf http://localhost:8080/api/v1/health/ > /dev/null && echo "Backend: OK" || echo "Backend: NOT REACHABLE"
```

If services are not running, tell the user and suggest:
```bash
docker compose up --build -d
```
Then wait for services to be healthy before proceeding.

**Running tests:**

If a specific spec is provided (e.g., `run agreementList`):
```bash
cd frontend
npx cypress run --config-file ./cypress.config.js --headless --spec "cypress/e2e/*<pattern>*.cy.js" 2>&1 | tee /tmp/cypress-output.log
```

If no spec is provided, run the full suite:
```bash
cd frontend
bun run test:e2e 2>&1 | tee /tmp/cypress-output.log
```

After the run completes, automatically run flaky detection:
```bash
../.github/scripts/detect-flaky-tests.sh /tmp/cypress-output.log
```

Report results to the user:
- Total specs run, passed, failed
- Which specs failed (if any)
- Any flaky tests detected
- For failures, show the relevant error output

### 2. Monitor CI: `$ARGUMENTS` is `monitor` or `status`

Check or monitor the CI E2E test status for the current branch.

**Pre-flight check** (run this first):
```bash
# Verify gh CLI is installed and authenticated
command -v gh > /dev/null && gh auth status 2>&1 | head -3 || echo "gh CLI: NOT AVAILABLE — install with 'brew install gh' and authenticate with 'gh auth login'"
```

If `gh` is not installed or not authenticated, tell the user and stop. All CI commands require `gh`.

**For `status`** (quick check):
```bash
BRANCH=$(git branch --show-current)
./.claude/actions/quick-ci-status.sh "$BRANCH"
```

Also show detailed E2E job status:
```bash
BRANCH=$(git branch --show-current)
RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId,workflowName --jq '.[] | select(.workflowName == "Continuous Integration") | .databaseId')
gh run view "$RUN_ID" --json jobs | jq -r '.jobs[] | select(.name | contains("End-to-End")) | "\(.conclusion // .status)\t\(.name)"' | sort
```

**For `monitor`** (watch until completion):
```bash
BRANCH=$(git branch --show-current)
RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId,workflowName --jq '.[] | select(.workflowName == "Continuous Integration") | .databaseId')
# Use the E2E-specific monitor for focused E2E tracking:
./.claude/actions/monitor-e2e.sh "$RUN_ID" 60
# Or use the full CI monitor for broader coverage:
# ./.claude/actions/monitor-ci.sh "$RUN_ID" 90
```

Report back:
- Which E2E tests passed/failed
- Link to the CI run
- For failures, download and examine the Cypress output logs if available

### 3. Fix Failing Tests: `$ARGUMENTS` is `fix` or `fix <spec-name>`

Diagnose and fix failing E2E tests. Follow this systematic approach:

**Pre-flight check** (run this first):
```bash
# Verify gh CLI is installed and authenticated
command -v gh > /dev/null && gh auth status 2>&1 | head -3 || echo "gh CLI: NOT AVAILABLE — install with 'brew install gh' and authenticate with 'gh auth login'"
```

If `gh` is not installed or not authenticated, tell the user and stop. CI log fetching requires `gh`.

**Step 1: Identify the failure**

If a spec name is provided, find it:
```bash
find frontend/cypress/e2e -name "*<spec>*.cy.js"
```

If no spec is provided, check for recent CI failures:
```bash
BRANCH=$(git branch --show-current)
RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId,workflowName --jq '.[] | select(.workflowName == "Continuous Integration") | .databaseId')
gh run view "$RUN_ID" --json jobs | jq -r '.jobs[] | select(.conclusion=="failure" and (.name | contains("End-to-End"))) | .name'
```

**Step 2: Get failure details**

For CI failures, try to get the logs:
```bash
# Get the failed job ID
JOB_ID=$(gh run view "$RUN_ID" --json jobs | jq -r '.jobs[] | select(.conclusion=="failure" and (.name | contains("End-to-End"))) | .databaseId' | head -1)
gh run view --job "$JOB_ID" --log 2>&1 | tail -100
```

Also check if artifacts are available (Cypress screenshots, logs):
```bash
gh run download "$RUN_ID" --pattern "*cypress*" --dir /tmp/cypress-artifacts 2>/dev/null || echo "No artifacts available"
```

**Step 3: Read and understand the test**

Read the failing spec file and understand:
- What the test is doing step by step
- What selectors and assertions it uses
- What page/component it's testing

**Step 4: Read the related application code**

Based on what the test is testing, read:
- The relevant React component(s)
- The relevant API endpoint(s) if the test involves API calls
- Any recent changes to these files on the current branch:
  ```bash
  git diff main...HEAD -- <relevant-files>
  ```

**Step 5: Identify the root cause**

Common failure categories:
- **Selector changed**: Component restructured, CSS class or data-cy attribute changed
- **Timing issue**: Missing `cy.wait()`, React state not settled, need `cy.waitForEditingState()` or similar
- **Data dependency**: Test data changed, new seed data needed
- **API change**: Backend endpoint path or response shape changed
- **New behavior**: Feature behavior changed, test needs updating to match

**Step 6: Apply the fix**

- Edit the test file to fix the issue
- If the fix involves application code (not just the test), explain the change to the user before making it
- For timing issues, prefer Cypress retry-ability patterns and custom wait commands over hard `cy.wait()`:
  ```javascript
  // Prefer these (from cypress/support/commands.js):
  cy.waitForEditingState(true)
  cy.waitForModalToAppear()
  cy.waitForModalToClose()
  cy.waitForStateChange(selector, expectedText)
  cy.selectAndWaitForChange(selector, value)
  ```

**Step 7: Verify the fix locally** (if Docker stack is running)

```bash
cd frontend
npx cypress run --config-file ./cypress.config.js --headless --spec "cypress/e2e/<spec-file>.cy.js" 2>&1 | tee /tmp/cypress-fix-output.log
```

Report the fix and verification results.

### 4. Flaky Test Analysis: `$ARGUMENTS` is `flaky`

Analyze flaky tests from the most recent CI run.

**Pre-flight check** (run this first):
```bash
# Verify gh CLI is installed and authenticated
command -v gh > /dev/null && gh auth status 2>&1 | head -3 || echo "gh CLI: NOT AVAILABLE — install with 'brew install gh' and authenticate with 'gh auth login'"
```

If `gh` is not installed or not authenticated, tell the user and stop. Flaky analysis requires `gh` to download CI artifacts.

```bash
BRANCH=$(git branch --show-current)
RUN_ID=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId,workflowName --jq '.[] | select(.workflowName == "Continuous Integration") | .databaseId')

# Download Cypress output logs
gh run download "$RUN_ID" --pattern "*cypress-output*" --dir /tmp/flaky-analysis 2>/dev/null

# Run aggregate flaky detection
if [ -d "/tmp/flaky-analysis" ]; then
    ./.github/scripts/aggregate-flaky-tests.sh /tmp/flaky-analysis
else
    echo "No Cypress output artifacts found. Checking job summaries instead..."
    gh run view "$RUN_ID" --json jobs | jq -r '.jobs[] | select(.name | contains("Aggregate Flaky")) | .conclusion + " " + .name'
fi
```

For any flaky tests found:
1. Read the spec file
2. Identify the likely cause of flakiness (usually timing, state, or data-dependent)
3. Suggest specific fixes using retry-able patterns and custom Cypress commands
4. Offer to apply the fixes

### 5. Accessibility Regression: `$ARGUMENTS` is `a11y` or `accessibility`

Analyze or run the accessibility regression tests. CI runs a dedicated `a11y-regression` job that tests 10 specific specs with the `A11Y_REGRESSION_GATE=true` environment variable enabled.

**Run a11y specs locally:**
```bash
cd frontend
A11Y_REGRESSION_GATE=true npx cypress run --config-file ./cypress.config.js --headless --spec "cypress/e2e/agreementList.cy.js,cypress/e2e/agreementsPagination.cy.js,cypress/e2e/agreementDetails.cy.js" 2>&1 | tee /tmp/cypress-a11y-output.log
```

**Check the allowlist:**
Read `frontend/cypress/support/a11yAllowlist.js` to see which a11y violations are temporarily suppressed. Each entry has:
- A rule ID (e.g., `link-name`)
- An expiration date — expired entries should be resolved
- A GitHub issue tracking the fix

When `A11Y_REGRESSION_GATE` is enabled, `cy.checkA11y()` (overridden in `e2e.js`) validates that only allowlisted violations appear. New violations not in the allowlist will fail the test.

For any expired allowlist entries or new violations:
1. Read the spec file and the component it tests
2. Identify the a11y fix needed
3. Suggest the fix (usually adding `aria-label`, fixing heading hierarchy, or adding link text)
4. Offer to apply the fix

### 6. Default: `$ARGUMENTS` is empty or unrecognized

Show a help summary:

```
E2E Test Skill - Available Commands:

  /e2e-tests run                  Run all E2E tests locally
  /e2e-tests run <spec>           Run a specific spec (e.g., "run agreementList")
  /e2e-tests status               Quick CI E2E status check
  /e2e-tests monitor              Monitor CI run until completion
  /e2e-tests fix                  Diagnose and fix failing E2E tests from CI
  /e2e-tests fix <spec>           Fix a specific failing spec
  /e2e-tests flaky                Analyze flaky tests from latest CI run
  /e2e-tests a11y                 Analyze accessibility regression tests and allowlist

Prerequisites:
  - Local runs require Docker stack: docker compose up --build -d
  - CI commands require gh CLI authenticated with GitHub
  - Clean state between runs: docker system prune --volumes
```

## Key File Locations

- **Test specs**: `frontend/cypress/e2e/*.cy.js` (41 spec files)
- **Cypress config (local)**: `frontend/cypress.config.js`
- **Cypress config (CI)**: `frontend/cypress.config.ci.js`
- **Support/commands**: `frontend/cypress/support/commands.js`, `frontend/cypress/support/e2e.js`
- **A11y allowlist**: `frontend/cypress/support/a11yAllowlist.js`
- **Test utilities**: `frontend/cypress/e2e/utils.js`
- **Fixtures**: `frontend/cypress/fixtures/`
- **CI workflow**: `.github/workflows/e2e_test_reusable.yml`
- **CI main workflow** (includes a11y-regression job): `.github/workflows/ci.yml`
- **Flaky detection**: `.github/scripts/detect-flaky-tests.sh`
- **Flaky aggregation**: `.github/scripts/aggregate-flaky-tests.sh`
- **E2E monitoring**: `.claude/actions/monitor-e2e.sh` (E2E-focused)
- **CI monitoring**: `.claude/actions/monitor-ci.sh` (full CI), `.claude/actions/quick-ci-status.sh`

## Local vs CI Configuration Differences

Understanding these differences helps diagnose "passes locally, fails in CI" issues:

| Setting | Local (`cypress.config.js`) | CI (`cypress.config.ci.js`) |
|---------|---------------------------|----------------------------|
| Retries | 2 (3 total attempts) | 3 (4 total attempts) |
| Page load timeout | 180s | 120s |
| Default command timeout | (Cypress default 4s) | 20s |
| Request timeout | (Cypress default 5s) | 20s |
| Memory management | Off | `experimentalMemoryManagement: true` |
| `numTestsKeptInMemory` | (default) | 1 |

CI config is tuned for React 19 + headless Electron performance. If a test times out in CI but not locally, the command/request timeouts are likely the issue. If it passes intermittently, look at the retry count difference.

## Custom Cypress Commands

These are defined in `frontend/cypress/support/commands.js` and `frontend/cypress/support/e2e.js`:

**Authentication:**
- `cy.login()` - Sets mock JWT token to localStorage (low-level, rarely used directly)
- `cy.FakeAuth("system-owner")` - Session-based login as a specific user type (preferred)
- Available types: `system-owner`, `basic`, `division-director`, `budget-team`, `procurement-team`, `power-user`

**State Management (React 19 compatible):**
- `cy.waitForEditingState(true/false)` - Wait for editing indicator
- `cy.waitForModalToAppear()` - Wait for modal visibility
- `cy.waitForModalToClose()` - Wait for modal to close
- `cy.waitForStateChange(selector, expectedText)` - Wait for element text to match
- `cy.selectAndWaitForChange(selector, value)` - Select dropdown value and wait for React state

**Table Verification:**
- `cy.verifyTableColumnValues(selector, expectedValue, timeout)` - Verify all cells in a table column match an expected value

**Debugging:**
- `cy.logLocalStorage()` - Log localStorage contents to Cypress output (useful for debugging auth issues)

**Accessibility:**
- `cy.injectAxe()` - Inject axe-core (overridden in `e2e.js` to suppress link-name violations outside regression gate mode)
- `cy.checkA11y()` - Run accessibility checks (overridden in `e2e.js` — when `A11Y_REGRESSION_GATE=true`, validates against the allowlist in `cypress/support/a11yAllowlist.js`)

## Important Notes

- Always run pre-flight checks before attempting local test runs
- The CI uses `cypress.config.ci.js` with 3 retries (4 attempts total) and extended timeouts
- Local config uses 2 retries (3 attempts total)
- `docker system prune --volumes` is needed between full test runs for clean database state
- E2E tests in CI run in parallel (one job per spec file)
- Never modify `cypress.config.ci.js` timeouts without understanding the CI stability implications
- When fixing tests, prefer Cypress retry-able assertions and custom wait commands over `cy.wait(ms)`
