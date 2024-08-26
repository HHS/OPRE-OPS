#!/bin/ash
set -eo pipefail

export PYTHONPATH=.:..:$PYTHONPATH

echo "Activating virtual environment..."
. .venv/bin/activate

echo "Searching for users with over 60 days of inactivity and moving their account to inactive status..."
python ./data_tools/src/update_data/update_expired_users.py
