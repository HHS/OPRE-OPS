#!/bin/bash
set -eo pipefail

export PYTHONPATH=.:$PYTHONPATH

echo "Loading 'portfolio_data.json5'..."
DATA=data/portfolio_data.json5 python src/import_static_data/import_data.py

echo "Loading 'funding_partner_data.json5'..."
DATA=data/funding_partner_data.json5 python src/import_static_data/import_data.py

echo "Loading 'funding_source_data.json5'..."
DATA=data/funding_source_data.json5 python src/import_static_data/import_data.py

echo "Loading 'user_data.json5'..."
DATA=data/user_data.json5 python src/import_static_data/import_data.py

echo "Loading 'can_data.json5'..."
DATA=data/can_data.json5 python src/import_static_data/import_data.py

echo "Loading 'agreements_and_blin_data.json5'..."
DATA=data/agreements_and_blin_data.json5 python src/import_static_data/import_data.py

echo "Data Loading Complete!"
