#!/bin/ash
set -eo pipefail

export PYTHONPATH=.:..:$PYTHONPATH

echo "Activating virtual environment..."
. .venv/bin/activate

echo "Upgrading DB Schema..."
alembic upgrade head
echo "Schema Upgrade Complete!"
