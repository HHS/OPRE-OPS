#!/bin/sh
set -eo pipefail

# Wrapper for the usage metrics report job. Runs the aggregation + CSV + Blob upload module.
# Invoked by the scheduled Azure Container App Job (see scripts/azure/create_usage_metrics_job.sh)
# with ENV and the usage-metrics report config supplied as environment variables.

export PYTHONPATH=.:$PYTHONPATH

echo "Activating virtual environment..."
. .venv/bin/activate

echo "ENV is $ENV"

echo "Running usage metrics report..."
python data_tools/src/usage_metrics/utils.py
