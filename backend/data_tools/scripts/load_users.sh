#!/bin/sh
set -eo pipefail

export PYTHONPATH=.:$PYTHONPATH

ENV=$1
INPUT_CSV=$2

echo "Activating virtual environment..."
. .venv/bin/activate

echo "ENV is $ENV"
echo "INPUT_CSV is $INPUT_CSV"

echo "Running script..."
python data_tools/src/load_data.py \
--env "${ENV}" \
--type users \
--input-csv "${INPUT_CSV}"
