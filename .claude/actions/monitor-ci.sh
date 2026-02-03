#!/bin/bash
# Claude Action: Monitor GitHub Actions CI Run
# Usage: monitor-ci.sh <run_id> [check_interval_seconds]
#
# Monitors a GitHub Actions workflow run until completion and displays test results.
# Automatically fetches E2E test status when run completes.

set -euo pipefail

RUN_ID="${1:-}"
CHECK_INTERVAL="${2:-60}"
OUTPUT_FILE="${3:-/tmp/ci-monitor-${RUN_ID}.log}"

if [ -z "$RUN_ID" ]; then
    echo "Usage: $0 <run_id> [check_interval_seconds] [output_file]"
    echo ""
    echo "Example: $0 21633978658 60"
    echo ""
    echo "To get the latest run ID:"
    echo "  gh run list --branch <branch> --limit 1"
    exit 1
fi

echo "Monitoring CI run: $RUN_ID"
echo "Check interval: ${CHECK_INTERVAL}s"
echo "Output file: $OUTPUT_FILE"
echo "Run URL: https://github.com/HHS/OPRE-OPS/actions/runs/${RUN_ID}"
echo "---"
echo "$(date): Started monitoring" > "$OUTPUT_FILE"

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
        echo "[$timestamp] ERROR: Unable to fetch run status (check #$check_count, ${elapsed_min}m elapsed)" | tee -a "$OUTPUT_FILE"
        sleep "$CHECK_INTERVAL"
        continue
    fi

    echo "[$timestamp] Check #$check_count (${elapsed_min}m elapsed): $status" | tee -a "$OUTPUT_FILE"

    if [ "$status" = "completed" ]; then
        conclusion=$(gh run view "$RUN_ID" --json conclusion --jq '.conclusion')
        echo "[$timestamp] === RUN COMPLETED ===" | tee -a "$OUTPUT_FILE"
        echo "[$timestamp] Conclusion: $conclusion" | tee -a "$OUTPUT_FILE"
        echo "[$timestamp] Total time: ${elapsed_min} minutes" | tee -a "$OUTPUT_FILE"
        echo "" | tee -a "$OUTPUT_FILE"

        # Get E2E test results
        echo "[$timestamp] Fetching E2E test results..." | tee -a "$OUTPUT_FILE"
        gh pr checks 4941 2>&1 | \
            grep -E "(createAgreementWithValidations|approveChangeRequestsAtAgreementLevel|canDetail|saveChangesToEdits)" | \
            grep -E "(pass|fail)" | \
            tee -a "$OUTPUT_FILE" || echo "No E2E test results found" | tee -a "$OUTPUT_FILE"

        exit 0
    fi

    sleep "$CHECK_INTERVAL"
done
