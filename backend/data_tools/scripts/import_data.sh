#!/bin/bash
set -eo pipefail

export PYTHONPATH=.:..:$PYTHONPATH

cd data_tools
python -m pip install --no-cache-dir --upgrade pip==22.2.2 pipenv==2022.10.12
python -m pipenv install --dev --system --deploy
cd ..

echo "Loading DB..."
python ./data_tools/src/import_static_data/load_db.py

echo "Loading 'portfolio_data.json5'..."
DATA=./data_tools/data/portfolio_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'funding_partner_data.json5'..."
DATA=./data_tools/data/funding_partner_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'funding_source_data.json5'..."
DATA=./data_tools/data/funding_source_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'research_project_data.json5'..."
DATA=./data_tools/./data/research_project_data.json5 python ./data_tools/src/import_static_data/import_data.py &&

echo "Loading 'user_data.json5'..."
DATA=./data_tools/data/user_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'team_leader_data.json5'..."
DATA=./data_tools/data/team_leader_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'can_data.json5'..."
DATA=./data_tools/data/can_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'agreements_and_blin_data.json5'..."
DATA=./data_tools/data/agreements_and_blin_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Data Loading Complete!"
