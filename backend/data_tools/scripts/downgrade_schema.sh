#!/bin/ash
set -eo pipefail

export PYTHONPATH=.:..:$PYTHONPATH

echo "Activating virtual environment..."
. .venv/bin/activate

echo "Downgrading DB Schema..."
alembic downgrade -1
echo "Schema Downgrade Complete!"
