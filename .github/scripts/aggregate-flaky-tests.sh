#!/bin/bash
# Aggregates flaky test results from multiple Cypress output logs
# Usage: aggregate-flaky-tests.sh <logs_directory> [github_summary_file]
#
# This script processes all Cypress output logs in a directory and creates
# a single combined flaky test detection report.

set -euo pipefail

# Input validation
if [ $# -lt 1 ]; then
    echo "Usage: $0 <logs_directory> [github_summary_file]"
    echo ""
    echo "Example: $0 cypress-outputs \$GITHUB_STEP_SUMMARY"
    exit 1
fi

LOGS_DIR="$1"
GITHUB_SUMMARY="${2:-}"

# Check if directory exists
if [ ! -d "$LOGS_DIR" ]; then
    echo "Error: Logs directory not found: $LOGS_DIR"
    exit 1
fi

# Temporary files for results
ALL_FLAKY_TESTS=$(mktemp)
trap 'rm -f "$ALL_FLAKY_TESTS"' EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DETECT_SCRIPT="$SCRIPT_DIR/detect-flaky-tests.sh"

# Process each Cypress output log
echo "🔍 Analyzing Cypress output logs for flaky tests..."
echo ""

TOTAL_LOGS=0
LOGS_WITH_FLAKY=0

# Find all .log files and process them
while IFS= read -r log_file; do
    TOTAL_LOGS=$((TOTAL_LOGS + 1))

    # Run detection script and capture flaky tests
    # The script outputs a markdown table with flaky specs
    FLAKY_SPECS=$("$DETECT_SCRIPT" "$log_file" 2>/dev/null | grep "| \`.*\.cy\.js\` |" | sed 's/^| `\(.*\)` |$/\1/' || true)

    if [ -n "$FLAKY_SPECS" ]; then
        LOGS_WITH_FLAKY=$((LOGS_WITH_FLAKY + 1))
        echo "$FLAKY_SPECS" >> "$ALL_FLAKY_TESTS"
    fi
done < <(find "$LOGS_DIR" -name "*.log" -type f)

# Remove duplicates and sort
sort -u "$ALL_FLAKY_TESTS" -o "$ALL_FLAKY_TESTS"

# Count unique flaky tests
TOTAL_FLAKY=$(wc -l < "$ALL_FLAKY_TESTS" | tr -d ' ')

echo "📊 Analysis complete:"
echo "  - Analyzed $TOTAL_LOGS spec file(s)"
echo "  - Found flaky behavior in $LOGS_WITH_FLAKY spec file(s)"
echo "  - Total unique flaky specs: $TOTAL_FLAKY"
echo ""

# Generate aggregate report
generate_report() {
    echo "## 🔄 Flaky Test Detection - Aggregate Report"
    echo ""
    echo "**Summary:** Analyzed $TOTAL_LOGS E2E test spec(s) across all jobs"
    echo ""

    if [ "$TOTAL_FLAKY" -eq 0 ]; then
        echo "✅ **No flaky tests detected!**"
        echo ""
        echo "All tests passed on their first attempt across all E2E test jobs."
    else
        echo "⚠️ **$TOTAL_FLAKY flaky test(s) detected**"
        echo ""
        echo "The following tests failed initially but passed on retry (indicating flakiness):"
        echo ""
        echo "| Spec File | Status |"
        echo "|-----------|--------|"

        while IFS= read -r spec; do
            echo "| \`$spec\` | ⚠️ Flaky |"
        done < "$ALL_FLAKY_TESTS"

        echo ""
        echo "### What does this mean?"
        echo ""
        echo "These tests exhibited non-deterministic behavior - they failed on first attempt but passed on a subsequent retry."
        echo ""
        echo "**Common causes:**"
        echo "- **Timing issues**: Tests don't wait long enough for async operations"
        echo "- **Race conditions**: Tests depend on timing of concurrent operations"
        echo "- **External dependencies**: Tests rely on unstable external resources"
        echo "- **Test pollution**: Tests affect each other's state"
        echo ""
        echo "### Recommended Actions"
        echo ""
        echo "1. **Prioritize fixes**: Focus on frequently flaky tests first"
        echo "2. **Review each spec**: Click into individual E2E test jobs to see detailed logs"
        echo "3. **Add proper waits**: Use Cypress commands like \`cy.wait()\`, \`cy.intercept()\`"
        echo "4. **Isolate tests**: Ensure tests don't depend on execution order"
        echo "5. **Check artifacts**: Review screenshots and videos from failed attempts"
        echo ""
        echo "### Viewing Individual Reports"
        echo ""
        echo "Each E2E test job has its own detailed flaky test report. To view:"
        echo "1. Scroll down to the \"End-to-End Tests\" section"
        echo "2. Click on individual test jobs (e.g., \"End-to-End Testing (agreementDetails.cy.js)\")"
        echo "3. View the job summary at the top of each job page"
        echo ""
        echo "### Resources"
        echo ""
        echo "- **Testing Guide**: \`.github/scripts/TESTING-FLAKY-DETECTION.md\`"
        echo "- **Local Testing**: Run \`./.github/scripts/quick-effectiveness-test.sh\`"
        echo "- **Cypress Best Practices**: https://docs.cypress.io/guides/references/best-practices"
    fi

    echo ""
    echo "---"
    echo "*Aggregated from $TOTAL_LOGS spec file(s)* • Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
}

# Output to console
generate_report

# Output to GitHub Actions job summary if specified
if [ -n "$GITHUB_SUMMARY" ]; then
    generate_report >> "$GITHUB_SUMMARY"
fi

# Exit with appropriate code (always succeed - don't fail the build)
exit 0
