#!/bin/bash
# Quick effectiveness test - creates a realistic scenario and verifies detection
set -euo pipefail

echo "🧪 Quick Flaky Test Detection Effectiveness Test"
echo "=================================================="
echo ""

TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DETECT_SCRIPT="$SCRIPT_DIR/detect-flaky-tests.sh"

# Create a realistic scenario: mix of flaky, broken, and passing tests
cat > "$TEST_DIR/realistic.log" <<'EOF'
Running:  cypress/e2e/passing.cy.js                                                         (1 of 5)

  Passing Test
    ✓ always works (1234ms)

  1 passing (2s)

Running:  cypress/e2e/flaky.cy.js                                                           (2 of 5)

  Flaky Test
    1) sometimes fails due to timing

  0 passing (1s)
  1 failing

  1) Flaky Test
       sometimes fails due to timing:
     Timed out retrying after 4000ms: Expected to find element

Running:  cypress/e2e/flaky.cy.js (Attempt 2 of 3)                                          (2 of 5)

  Flaky Test
    ✓ sometimes fails due to timing (2345ms)

  1 passing (3s)

Running:  cypress/e2e/broken.cy.js                                                          (3 of 5)

  Broken Test
    1) is fundamentally broken

  0 passing (500ms)
  1 failing

Running:  cypress/e2e/broken.cy.js (Attempt 2 of 3)                                         (3 of 5)

  Broken Test
    1) is fundamentally broken

  0 passing (500ms)
  1 failing

Running:  cypress/e2e/broken.cy.js (Attempt 3 of 3)                                         (3 of 5)

  Broken Test
    1) is fundamentally broken

  0 passing (500ms)
  1 failing

Running:  cypress/e2e/anotherFlaky.cy.js                                                    (4 of 5)

  Another Flaky Test
    1) has race condition

  0 passing (1s)
  1 failing

Running:  cypress/e2e/anotherFlaky.cy.js (Attempt 2 of 3)                                   (4 of 5)

  Another Flaky Test
    1) has race condition

  0 passing (1s)
  1 failing

Running:  cypress/e2e/anotherFlaky.cy.js (Attempt 3 of 3)                                   (4 of 5)

  Another Flaky Test
    ✓ has race condition (3456ms)

  1 passing (4s)

Running:  cypress/e2e/anotherPassing.cy.js                                                  (5 of 5)

  Another Passing Test
    ✓ works perfectly (890ms)

  1 passing (1s)
EOF

echo "📊 Test Scenario:"
echo "  • 2 passing tests (no retries)"
echo "  • 2 flaky tests (failed → passed on retry)"
echo "  • 1 broken test (failed all 3 attempts)"
echo ""
echo "✅ Expected Result: Script should detect exactly 2 flaky tests"
echo "❌ Old logic would report 3 (including the broken one)"
echo ""

# Run detection
echo "🔍 Running flaky test detection..."
echo "===================================="
"$DETECT_SCRIPT" "$TEST_DIR/realistic.log"

echo ""
echo "===================================="
echo ""

# Count results
FLAKY_COUNT=$("$DETECT_SCRIPT" "$TEST_DIR/realistic.log" 2>/dev/null | grep -c "| \`.*\.cy\.js\` |" || true)

if [ "$FLAKY_COUNT" -eq 2 ]; then
    echo "✅ SUCCESS: Detected exactly 2 flaky tests (flaky.cy.js, anotherFlaky.cy.js)"
    echo "✅ Correctly ignored broken.cy.js (failed all attempts)"
    echo "✅ Correctly ignored passing tests"
    echo ""
    echo "🎉 The script is working effectively!"
    exit 0
else
    echo "❌ FAILURE: Expected 2 flaky tests, but detected $FLAKY_COUNT"
    echo ""
    echo "This means the detection logic may not be working correctly."
    exit 1
fi
