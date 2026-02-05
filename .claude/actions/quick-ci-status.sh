#!/bin/bash
# Claude Action: Quick CI Status Check
# Usage: quick-ci-status.sh [branch_name]
#
# Quickly checks the status of the latest CI run on a branch

set -euo pipefail

BRANCH="${1:-react-19-upgrade}"

echo "=== CI Status for branch: $BRANCH ==="
echo "Time: $(date)"
echo ""

# Get latest run
latest_run=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId,status,conclusion,workflowName,createdAt \
    | jq -r '.[] | select(.workflowName == "Continuous Integration") | "\(.databaseId) \(.status) \(.conclusion) \(.createdAt)"')

if [ -z "$latest_run" ]; then
    echo "❌ No CI runs found for branch: $BRANCH"
    exit 1
fi

read -r run_id status conclusion created_at <<< "$latest_run"

echo "Run ID: $run_id"
echo "Status: $status"
if [ "$status" = "completed" ]; then
    echo "Conclusion: $conclusion"
    if [ "$conclusion" = "success" ]; then
        echo "✅ All checks passed!"
    else
        echo "❌ Some checks failed"
        echo ""
        echo "E2E Test Results:"
        PR_NUM=$(gh pr list --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
        if [ -n "$PR_NUM" ]; then
            gh pr checks "$PR_NUM" 2>&1 | \
                grep -E "(createAgreementWithValidations|approveChangeRequestsAtAgreementLevel|canDetail|saveChangesToEdits)" | \
                grep -E "(pass|fail)" || echo "No E2E results found"
        else
            echo "No PR found for branch"
        fi
    fi
else
    echo "⏳ Run still in progress..."
    started_at=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$created_at" +%s 2>/dev/null || echo "0")
    if [ "$started_at" != "0" ]; then
        now=$(date +%s)
        elapsed=$((now - started_at))
        elapsed_min=$((elapsed / 60))
        echo "Running for: ${elapsed_min} minutes"
    fi
fi

echo ""
echo "View run: https://github.com/HHS/OPRE-OPS/actions/runs/${run_id}"
