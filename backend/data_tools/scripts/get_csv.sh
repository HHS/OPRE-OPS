#!/bin/sh
set -eo pipefail

export PYTHONPATH=.:$PYTHONPATH

ENV=$1
INPUT_CSV=$2
OUTPUT_CSV=$3

echo "Activating virtual environment..."
. .venv/bin/activate

echo "ENV is $ENV"
echo "INPUT_CSV is $INPUT_CSV"
echo "OUTPUT_CSV is $OUTPUT_CSV"

echo "Running script..."
python data_tools/src/load_cans/main.py \
--env "${ENV}" \
--input-csv "${INPUT_CSV}" \
--output-csv "${OUTPUT_CSV}"
