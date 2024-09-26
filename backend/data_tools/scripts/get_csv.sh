#!/bin/sh
set -eo pipefail

export PYTHONPATH=.:$PYTHONPATH

ENV=$1
INPUT_CSV=$2
OUTPUT_CSV=$3

echo "Activating virtual environment..."
. .venv/bin/activate

echo "Running script..."
python data_tools/src/load_cans/main.py \
--env "${ENV}" \
--input_csv "${INPUT_CSV}" \
--output_csv "${OUTPUT_CSV}"
