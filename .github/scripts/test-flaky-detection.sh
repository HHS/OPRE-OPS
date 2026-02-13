#!/bin/bash
# Test script for flaky test detection
# Creates sample Cypress output and verifies the detection script works correctly

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DETECT_SCRIPT="$SCRIPT_DIR/detect-flaky-tests.sh"

echo "=== Testing Flaky Test Detection Script ==="
echo ""

# Create test output files
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT

# Test 1: No flaky tests (all pass on first attempt)
echo "Test 1: No flaky tests detected"
echo "-----------------------------------"
cat > "$TEST_DIR/no-flaky.log" <<'EOF'
Running:  cypress/e2e/loginPage.cy.js                                                       (1 of 3)

  Login Page
    ✓ should load the login page (1234ms)
    ✓ should display logo (567ms)

  2 passing (2s)

Running:  cypress/e2e/mainPage.cy.js                                                        (2 of 3)

  Main Page
    ✓ should display dashboard (890ms)

  1 passing (1s)
EOF

echo "Expected: ✅ No flaky tests"
echo "Result:"
"$DETECT_SCRIPT" "$TEST_DIR/no-flaky.log"
echo ""
echo ""

# Test 2: Flaky tests detected (passed on retry)
echo "Test 2: Flaky tests detected"
echo "-----------------------------------"
cat > "$TEST_DIR/flaky.log" <<'EOF'
Running:  cypress/e2e/agreementDetails.cy.js                                                (1 of 5)

  Agreement Details
    1) should show modal when navigating between tabs
    ✓ should display agreement info (2345ms)

  1 passing (3s)
  1 failing

  1) Agreement Details
       should show modal when navigating between tabs:
     Timed out retrying after 4000ms: Expected to find element: `[data-cy="modal"]`, but never found it.

Running:  cypress/e2e/agreementDetails.cy.js (Attempt 2 of 3)                               (1 of 5)

  Agreement Details
    ✓ should show modal when navigating between tabs (1234ms)
    ✓ should display agreement info (2345ms)

  2 passing (4s)

Running:  cypress/e2e/canList.cy.js                                                         (2 of 5)

  CAN List
    ✓ should display all CANs (1000ms)
    1) fiscal year filtering with FY budgets equalling 5,000,000

  1 passing (1s)
  1 failing

Running:  cypress/e2e/canList.cy.js (Attempt 2 of 3)                                        (2 of 5)

  CAN List
    ✓ should display all CANs (1000ms)
    1) fiscal year filtering with FY budgets equalling 5,000,000

  1 passing (1s)
  1 failing

Running:  cypress/e2e/canList.cy.js (Attempt 3 of 3)                                        (2 of 5)

  CAN List
    ✓ should display all CANs (1000ms)
    ✓ fiscal year filtering with FY budgets equalling 5,000,000 (2000ms)

  2 passing (3s)

Running:  cypress/e2e/loginPage.cy.js                                                       (3 of 5)

  Login Page
    ✓ should load the login page (1234ms)

  1 passing (2s)
EOF

echo "Expected: ⚠️  2 flaky tests (agreementDetails.cy.js, canList.cy.js)"
echo "Result:"
"$DETECT_SCRIPT" "$TEST_DIR/flaky.log"
echo ""
echo ""

# Test 3: File doesn't exist
echo "Test 3: Missing file handling"
echo "-----------------------------------"
echo "Expected: Error message about missing file"
echo "Result:"
"$DETECT_SCRIPT" "$TEST_DIR/nonexistent.log" 2>&1 || echo "(Expected failure)"
echo ""
echo ""

echo "=== All Tests Complete ==="
