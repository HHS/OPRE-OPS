#!/bin/bash
# Creates an intentionally flaky test for testing detection
# This test will randomly fail ~50% of the time

cat > frontend/cypress/e2e/flakyTest.cy.js <<'EOF'
describe("Flaky Test for Detection Testing", () => {
    it("randomly fails to test flaky detection", () => {
        // This test will fail ~50% of the time
        const shouldPass = Math.random() > 0.5;

        if (!shouldPass) {
            cy.log("Intentionally failing to simulate flakiness");
            throw new Error("Random failure to test flaky detection");
        }

        cy.log("Test passed this time");
        expect(true).to.be.true;
    });
});
EOF

echo "✅ Created intentionally flaky test at frontend/cypress/e2e/flakyTest.cy.js"
echo ""
echo "To test:"
echo "1. Add flakyTest.cy.js to frontend/cypress.config.ci.js specPattern"
echo "2. Run E2E tests in CI mode: cd frontend && bun run test:e2e 2>&1 | tee /tmp/cypress-output.log"
echo "3. Analyze: ./.github/scripts/detect-flaky-tests.sh /tmp/cypress-output.log"
echo ""
echo "To clean up:"
echo "rm frontend/cypress/e2e/flakyTest.cy.js"
