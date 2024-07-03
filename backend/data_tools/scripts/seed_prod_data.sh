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

echo "Loading initial seed data..."
if [ "$ENV" = "local" ]; then
 echo "Local environment detected. Loading seed data..."
  for file in ./data_tools/initial_prod_seed_data/*.sql; do
    echo "Loading $file..."
    psql postgresql://postgres:local_password@db:5432/postgres -f $file
  done
else
  echo "Local environment detected. Loading seed data..."
  for file in ./data_tools/initial_prod_seed_data/*.sql; do
    echo "Loading $file..."
    psql postgresql://"$ADMIN_PGUSER":"$ADMIN_PGPASSWORD"@"$PGHOST":"$PGPORT"/"$PGDATABASE" -f $file
  done
fi

echo "Data Loading Complete!"
