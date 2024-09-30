#!/bin/sh
set -eo pipefail

export PYTHONPATH=.:$PYTHONPATH


echo "Activating virtual environment..."
. .venv/bin/activate

echo "Running script..."
