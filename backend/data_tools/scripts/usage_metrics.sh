#!/bin/sh
set -eo pipefail

# Wrapper for the usage metrics report job. Runs the aggregation + workbook + Blob upload module.
# Invoked by the scheduled Azure Container App Job, which is created by the deployments/usage-metrics
# Terragrunt stack in HHS/OPRE-OPS-Data (see scripts/azure/USAGE_METRICS_JOB.md). ENV and the
# usage-metrics report config are supplied as environment variables.
#
# The cron fires every Friday; the module itself no-ops on Fridays that do not end a sprint, so a
# skipped run is a normal exit 0 with a log line explaining why.

export PYTHONPATH=.:$PYTHONPATH

echo "Activating virtual environment..."
. .venv/bin/activate

echo "ENV is $ENV"

echo "Running usage metrics report..."
python data_tools/src/usage_metrics/utils.py
