#!/bin/bash
# Claude Action: Monitor E2E Tests in GitHub Actions CI Run
# Usage: monitor-e2e.sh <run_id> [check_interval_seconds]
#
# Monitors a GitHub Actions workflow run for E2E test results.
# Exits early when E2E tests fail or completes when all tests pass.
#
# Parameters:
#   run_id: GitHub Actions run ID
#   check_interval_seconds: Time between checks (default: 60)

set -euo pipefail

RUN_ID="${1:-}"
CHECK_INTERVAL="${2:-60}"

if [ -z "$RUN_ID" ]; then
    echo "Usage: $0 <run_id> [check_interval_seconds]"
    echo ""
    echo "Example: $0 21652174826 60"
    echo ""
    echo "To get the latest run ID:"
    echo "  gh run list --branch <branch> --limit 1 --json databaseId --jq '.[0].databaseId'"
    exit 1
fi

echo "Monitoring CI run: $RUN_ID"
echo "Check interval: ${CHECK_INTERVAL}s"
echo "Run URL: https://github.com/HHS/OPRE-OPS/actions/runs/${RUN_ID}"
echo "Started at: $(date)"
echo "---"

check_count=0
start_time=$(date +%s)

while true; do
    ((check_count++))
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    elapsed=$(($(date +%s) - start_time))
    elapsed_min=$((elapsed / 60))

    # Get run status
    status=$(gh run view "$RUN_ID" --json status --jq '.status' 2>/dev/null || echo "error")

    if [ "$status" = "error" ]; then
        echo "[$timestamp] ERROR: Unable to fetch run status (check #$check_count, ${elapsed_min}m elapsed)"
        sleep "$CHECK_INTERVAL"
        continue
    fi

    echo "[$timestamp] Check #$check_count (${elapsed_min}m elapsed): $status"

    # Check for E2E test failures (only when running)
    if [ "$status" = "in_progress" ]; then
        failed_e2e=$(gh run view "$RUN_ID" --json jobs 2>/dev/null | jq -r '.jobs[] | select(.conclusion=="failure" and (.name | contains("End-to-End"))) | .name' || echo "")

        if [ -n "$failed_e2e" ]; then
            echo "[$timestamp] ⚠️  E2E TEST FAILURES DETECTED:"
            echo "$failed_e2e" | while read -r test_name; do
                echo "  ❌ $test_name"
            done
            echo ""
            echo "[$timestamp] Exiting early due to E2E test failures"
            echo "[$timestamp] View full results: https://github.com/HHS/OPRE-OPS/actions/runs/${RUN_ID}"
            exit 1
        fi

        # Show E2E test progress every other check
        if [ "$((check_count % 2))" -eq 0 ]; then
            e2e_completed=$(gh run view "$RUN_ID" --json jobs 2>/dev/null | jq -r '.jobs[] | select(.status=="completed" and (.name | contains("End-to-End"))) | .name' | wc -l)
            e2e_total=$(gh run view "$RUN_ID" --json jobs 2>/dev/null | jq -r '.jobs[] | select(.name | contains("End-to-End")) | .name' | wc -l)
            if [ "$e2e_total" -gt 0 ]; then
                echo "[$timestamp] E2E tests: $e2e_completed/$e2e_total completed"
            fi
        fi
    fi

    if [ "$status" = "completed" ]; then
        conclusion=$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion')
        echo "[$timestamp] === RUN COMPLETED ==="
        echo "[$timestamp] Conclusion: $conclusion"
        echo "[$timestamp] Total time: ${elapsed_min} minutes"
        echo ""

        # Get E2E test results
        echo "[$timestamp] E2E Test Results:"
        echo "---"

        failed_tests=$(gh run view "$RUN_ID" --json jobs 2>/dev/null | jq -r '.jobs[] | select(.conclusion=="failure" and (.name | contains("End-to-End"))) | .name')
        passed_tests=$(gh run view "$RUN_ID" --json jobs 2>/dev/null | jq -r '.jobs[] | select(.conclusion=="success" and (.name | contains("End-to-End"))) | .name')

        if [ -n "$failed_tests" ]; then
            echo "❌ Failed tests:"
            echo "$failed_tests" | while read -r test; do
                echo "  - $test"
            done
            echo ""
        fi

        passed_count=$(echo "$passed_tests" | grep -c . || echo "0")
        failed_count=$(echo "$failed_tests" | grep -c . || echo "0")

        echo "Summary: $passed_count passed, $failed_count failed"

        if [ "$conclusion" = "success" ]; then
            exit 0
        else
            exit 1
        fi
    fi

    sleep "$CHECK_INTERVAL"
done
