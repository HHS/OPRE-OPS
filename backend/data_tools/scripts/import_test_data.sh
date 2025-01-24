#!/bin/ash
set -eo pipefail

export PYTHONPATH=.:..:$PYTHONPATH

echo "Activating virtual environment..."
. .venv/bin/activate

echo "Creating DB..."
if [ "$ENV" = "local" ]; then
  echo "Local environment detected. Dropping and recreating 'ops' schema..."
  psql postgresql://postgres:local_password@db:5432/postgres -c 'DROP SCHEMA IF EXISTS ops CASCADE;CREATE SCHEMA ops;GRANT ALL ON SCHEMA ops TO ops;'
else
  echo "Non-local environment detected. Dropping and recreating 'ops' schema..."
  psql postgresql://"$ADMIN_PGUSER":"$ADMIN_PGPASSWORD"@"$PGHOST":"$PGPORT"/"$PGDATABASE" -c 'DROP SCHEMA IF EXISTS ops CASCADE;CREATE SCHEMA ops;GRANT ALL ON SCHEMA ops TO ops;'
fi

echo "Upgrading DB..."
alembic upgrade head

echo "Loading 'ops_event.json5'..."
DATA=./data_tools/data/ops_event.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'user_data.json5'..."
DATA=./data_tools/data/user_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'ops_event.json5'..."
DATA=./data_tools/data/ops_event.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'vendor_and_contact_data.json5'..."
DATA=./data_tools/data/vendor_and_contact_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'portfolio_data.json5'..."
DATA=./data_tools/data/portfolio_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'funding_partner_data.json5'..."
DATA=./data_tools/data/funding_partner_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'funding_source_data.json5'..."
DATA=./data_tools/data/funding_source_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'research_project_data.json5'..."
DATA=./data_tools/./data/research_project_data.json5 python ./data_tools/src/import_static_data/import_data.py &&

echo "Loading 'can_data.json5'..."
DATA=./data_tools/data/can_data.json5 python ./data_tools/src/import_static_data/import_data.py

echo "Loading 'first_contract_data.json5'..."
DATA=./data_tools/data/first_contract_data.json5 python ./data_tools/src/import_static_data/import_data.py &&

echo "Loading 'agreements_and_blin_data.json5'..."
DATA=./data_tools/data/agreements_and_blin_data.json5 python ./data_tools/src/import_static_data/import_data.py


echo "Data Loading Complete!"
