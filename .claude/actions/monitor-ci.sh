#!/bin/bash
# Claude Action: Monitor GitHub Actions CI Run
# Usage: monitor-ci.sh <run_id> [check_interval_seconds] [exit_on_e2e_failure]
#
# Monitors a GitHub Actions workflow run until completion and displays test results.
# Optionally exits early when E2E test failures are detected.
#
# Parameters:
#   run_id: GitHub Actions run ID
#   check_interval_seconds: Time between checks (default: 60)
#   exit_on_e2e_failure: Exit when E2E tests fail (true/false, default: true)

set -euo pipefail

RUN_ID="${1:-}"
CHECK_INTERVAL="${2:-60}"
EXIT_ON_E2E_FAILURE="${3:-true}"
OUTPUT_FILE="/tmp/ci-monitor-${RUN_ID}.log"

if [ -z "$RUN_ID" ]; then
    echo "Usage: $0 <run_id> [check_interval_seconds] [exit_on_e2e_failure]"
    echo ""
    echo "Example: $0 21633978658 60 true"
    echo ""
    echo "To get the latest run ID:"
    echo "  gh run list --branch <branch> --limit 1"
    exit 1
fi

echo "Monitoring CI run: $RUN_ID"
echo "Check interval: ${CHECK_INTERVAL}s"
echo "Exit on E2E failure: $EXIT_ON_E2E_FAILURE"
echo "Output file: $OUTPUT_FILE"
echo "Run URL: https://github.com/HHS/OPRE-OPS/actions/runs/${RUN_ID}"
echo "---"
echo "$(date): Started monitoring" > "$OUTPUT_FILE"

check_count=0
start_time=$(date +%s)

# Get PR number from run
PR_NUM=$(gh run view "$RUN_ID" --json headBranch --jq '.headBranch' | xargs -I {} gh pr list --head {} --json number --jq '.[0].number' 2>/dev/null || echo "")

while true; do
    ((check_count++))
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    elapsed=$(($(date +%s) - start_time))
    elapsed_min=$((elapsed / 60))

    # Get run status
    status=$(gh run view "$RUN_ID" --json status --jq '.status' 2>/dev/null || echo "error")

    if [ "$status" = "error" ]; then
        echo "[$timestamp] ERROR: Unable to fetch run status (check #$check_count, ${elapsed_min}m elapsed)" | tee -a "$OUTPUT_FILE"
        sleep "$CHECK_INTERVAL"
        continue
    fi

    echo "[$timestamp] Check #$check_count (${elapsed_min}m elapsed): $status" | tee -a "$OUTPUT_FILE"

    # Check for E2E test failures from current run only (skip if queued/waiting)
    if [ "$status" != "queued" ] && [ "$status" != "waiting" ] && [ "$EXIT_ON_E2E_FAILURE" = "true" ]; then
        # Get job failures from this specific run
        failed_e2e=$(gh run view "$RUN_ID" --json jobs 2>/dev/null | jq -r '.jobs[] | select(.conclusion=="failure" and (.name | contains("End-to-End"))) | .name' || echo "")

        if [ -n "$failed_e2e" ]; then
            echo "[$timestamp] ⚠️  E2E TEST FAILURES DETECTED:" | tee -a "$OUTPUT_FILE"
            echo "$failed_e2e" | while read -r test_name; do
                echo "  ❌ $test_name" | tee -a "$OUTPUT_FILE"
            done
            echo "" | tee -a "$OUTPUT_FILE"
            echo "[$timestamp] Exiting early due to E2E test failures (run still in progress)" | tee -a "$OUTPUT_FILE"
            echo "[$timestamp] View full results: https://github.com/HHS/OPRE-OPS/actions/runs/${RUN_ID}" | tee -a "$OUTPUT_FILE"
            exit 1
        fi

        # Show E2E test progress from this run
        if [ "$((check_count % 2))" -eq 0 ]; then  # Every other check
            e2e_completed=$(gh run view "$RUN_ID" --json jobs 2>/dev/null | jq -r '.jobs[] | select(.status=="completed" and (.name | contains("End-to-End"))) | .name' | wc -l)
            e2e_total=$(gh run view "$RUN_ID" --json jobs 2>/dev/null | jq -r '.jobs[] | select(.name | contains("End-to-End")) | .name' | wc -l)
            if [ "$e2e_total" -gt 0 ]; then
                echo "[$timestamp] E2E tests: $e2e_completed/$e2e_total completed" | tee -a "$OUTPUT_FILE"
            fi
        fi
    fi

    if [ "$status" = "completed" ]; then
        conclusion=$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion')
        echo "[$timestamp] === RUN COMPLETED ===" | tee -a "$OUTPUT_FILE"
        echo "[$timestamp] Conclusion: $conclusion" | tee -a "$OUTPUT_FILE"
        echo "[$timestamp] Total time: ${elapsed_min} minutes" | tee -a "$OUTPUT_FILE"
        echo "" | tee -a "$OUTPUT_FILE"

        # Get E2E test results
        if [ -n "$PR_NUM" ]; then
            echo "[$timestamp] E2E Test Results:" | tee -a "$OUTPUT_FILE"
            echo "---" | tee -a "$OUTPUT_FILE"

            failed_tests=$(gh pr checks "$PR_NUM" --json name,state 2>/dev/null | jq -r '.[] | select(.state=="FAILURE" and (.name | contains("End-to-End"))) | .name')
            passed_tests=$(gh pr checks "$PR_NUM" --json name,state 2>/dev/null | jq -r '.[] | select(.state=="SUCCESS" and (.name | contains("End-to-End"))) | .name')

            if [ -n "$failed_tests" ]; then
                echo "❌ Failed tests:" | tee -a "$OUTPUT_FILE"
                echo "$failed_tests" | while read -r test; do
                    echo "  - $test" | tee -a "$OUTPUT_FILE"
                done
                echo "" | tee -a "$OUTPUT_FILE"
            fi

            passed_count=$(echo "$passed_tests" | grep -c . || echo "0")
            failed_count=$(echo "$failed_tests" | grep -c . || echo "0")

            echo "Summary: $passed_count passed, $failed_count failed" | tee -a "$OUTPUT_FILE"
        else
            echo "[$timestamp] No PR found for run, skipping E2E test summary" | tee -a "$OUTPUT_FILE"
        fi

        if [ "$conclusion" = "success" ]; then
            exit 0
        else
            exit 1
        fi
    fi

    sleep "$CHECK_INTERVAL"
done
