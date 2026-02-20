#!/bin/bash
# Detects flaky E2E tests by parsing Cypress output for retry patterns
# Usage: detect-flaky-tests.sh <cypress_output_file> [github_summary_file]
#
# This script identifies spec files that failed initially but passed on retry,
# indicating true flakiness. Results are formatted for GitHub Actions job summaries.

set -euo pipefail

# Input validation
if [ $# -lt 1 ]; then
    echo "Usage: $0 <cypress_output_file> [github_summary_file]"
    echo ""
    echo "Example: $0 cypress.log \$GITHUB_STEP_SUMMARY"
    exit 1
fi

CYPRESS_LOG="$1"
GITHUB_SUMMARY="${2:-}"

# Check if input file exists
if [ ! -f "$CYPRESS_LOG" ]; then
    echo "Error: Cypress output file not found: $CYPRESS_LOG"
    exit 1
fi

# Temporary files for results
FLAKY_TESTS=$(mktemp)
SPEC_RESULTS=$(mktemp)
trap 'rm -f "$FLAKY_TESTS" "$SPEC_RESULTS"' EXIT

# Parse Cypress output to track spec runs and their results
# This awk script:
# 1. Identifies when a spec starts running (with or without retry indicator)
# 2. Tracks whether that run had failures
# 3. Records specs that had retry attempts and ultimately passed
awk '
BEGIN {
    current_spec = ""
    has_failures = 0
}

# Match "Running: path/to/spec.cy.js" or "Running: path/to/spec.cy.js (Attempt X of Y)"
/^Running:.*\.cy\.js/ {
    # Save previous spec results if we were tracking one
    if (current_spec != "") {
        # Record: spec_name final_result
        print current_spec, has_failures
    }

    # Extract spec filename
    for(i=1; i<=NF; i++) {
        if($i ~ /\.cy\.js/) {
            spec = $i
            sub(/.*\//, "", spec)  # Remove path
            current_spec = spec
            break
        }
    }

    # Check if this is a retry attempt and mark it for this spec
    if ($0 ~ /\(Attempt [2-9] of [0-9]\)/) {
        spec_had_retry[current_spec] = 1
    }

    # Reset failure flag for this run
    has_failures = 0
}

# Match lines with "X failing" to detect failures
/[0-9]+ failing/ {
    has_failures = 1
}

END {
    # Save the last spec
    if (current_spec != "") {
        print current_spec, has_failures
    }
}
' "$CYPRESS_LOG" > "$SPEC_RESULTS"

# Process the results to find truly flaky tests:
# Specs that had retry attempts and ultimately passed (no failures in final run)
awk '
{
    spec = $1
    has_failures = $2

    # Track the final result for each spec (last occurrence wins)
    spec_final_result[spec] = has_failures
}

END {
    # Read spec_had_retry array from the previous awk output
    # We need to check both conditions in a single pass
}
' "$SPEC_RESULTS" > /dev/null

# Simpler approach: combine both parsing steps into one
awk '
BEGIN {
    current_spec = ""
    has_failures = 0
}

# Match "Running: path/to/spec.cy.js" or "Running: path/to/spec.cy.js (Attempt X of Y)"
/^Running:.*\.cy\.js/ {
    # Extract spec filename
    for(i=1; i<=NF; i++) {
        if($i ~ /\.cy\.js/) {
            spec = $i
            sub(/.*\//, "", spec)  # Remove path
            current_spec = spec
            break
        }
    }

    # Check if this is a retry attempt and mark it for this spec
    if ($0 ~ /\(Attempt [2-9] of [0-9]\)/) {
        spec_had_retry[current_spec] = 1
    }

    # Reset failure flag for this run
    has_failures = 0
}

# Match lines with "X failing" to detect failures
/[0-9]+ failing/ {
    has_failures = 1
    # Record the failure status for the current spec
    if (current_spec != "") {
        spec_final_result[current_spec] = has_failures
    }
}

# Match lines with "X passing" - indicates end of spec run
/[0-9]+ passing/ {
    # If we have only passing (no failures), record success
    if (current_spec != "" && has_failures == 0) {
        spec_final_result[current_spec] = 0
    }
}

END {
    for (spec in spec_had_retry) {
        # Only report specs that:
        # 1. Had a retry attempt (failed initially)
        # 2. Ultimately passed (final result = 0 or not recorded as failure)
        if (spec_had_retry[spec] == 1 && spec_final_result[spec] == 0) {
            print spec
        }
    }
}
' "$CYPRESS_LOG" | sort -u > "$FLAKY_TESTS"

# Count flaky tests
FLAKY_COUNT=$(wc -l < "$FLAKY_TESTS" | tr -d ' ')

# Generate report
generate_report() {
    echo "## 🔄 Flaky Test Detection Report"
    echo ""

    if [ "$FLAKY_COUNT" -eq 0 ]; then
        echo "✅ **No flaky tests detected!**"
        echo ""
        echo "All tests passed on first attempt."
    else
        echo "⚠️ **$FLAKY_COUNT flaky test(s) detected**"
        echo ""
        echo "The following tests failed initially but passed on retry (indicating flakiness):"
        echo ""
        echo "| Spec File |"
        echo "|-----------|"

        while IFS= read -r spec; do
            echo "| \`$spec\` |"
        done < "$FLAKY_TESTS"

        echo ""
        echo "### What does this mean?"
        echo ""
        echo "These tests failed on first attempt but passed on a subsequent retry. This behavior indicates:"
        echo "- **Test flakiness**: Non-deterministic test behavior"
        echo "- **Possible causes**: Timing issues, race conditions, external dependencies, or test pollution"
        echo ""
        echo "### Recommended Actions"
        echo ""
        echo "1. **Review the test**: Examine the spec file for timing-dependent assertions"
        echo "2. **Check for race conditions**: Look for async operations without proper waits"
        echo "3. **Consider tagging**: If consistently flaky, tag with \`@flaky\` for tracking"
        echo "4. **Investigate CI logs**: Review screenshots and stack traces in artifacts"
        echo ""
        echo "### Tracking Flaky Tests"
        echo ""
        echo "To track known flaky tests, consider using cypress-grep:"
        echo "\`\`\`javascript"
        echo "it('test name @flaky', () => { ... })"
        echo "\`\`\`"
    fi

    echo ""
    echo "---"
    echo "*Generated by flaky test detection* • $(date '+%Y-%m-%d %H:%M:%S %Z')"
}

# Output to console
generate_report

# Output to GitHub Actions job summary if specified
if [ -n "$GITHUB_SUMMARY" ]; then
    generate_report >> "$GITHUB_SUMMARY"
fi

# Exit with appropriate code
if [ "$FLAKY_COUNT" -gt 0 ]; then
    echo ""
    echo "⚠️  Warning: $FLAKY_COUNT flaky test(s) detected"
    # Don't fail the job, just warn
    exit 0
else
    exit 0
fi
