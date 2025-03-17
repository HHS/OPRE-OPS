#!/bin/sh
set -eo pipefail

export PYTHONPATH=.:$PYTHONPATH

ENV=$1
DATA_TYPE=$2
INPUT_CSV=$3

echo "Activating virtual environment..."
. .venv/bin/activate

echo "ENV is $ENV"
echo "DATA_TYPE is $DATA_TYPE"
echo "INPUT_CSV is $INPUT_CSV"

echo "Running script..."
python data_tools/src/load_data.py \
--env "${ENV}" \
--type "${DATA_TYPE}" \
--input-csv "${INPUT_CSV}"
