#!/bin/ash
set -eo pipefail

export PYTHONPATH=.:..:$PYTHONPATH

echo "Activating virtual environment..."
. .venv/bin/activate

echo "Loading demo data..."
if [ "$ENV" = "local" ]; then
 echo "Local environment detected. Loading seed data..."
  for file in $(ls ./data_tools/demo_data/*.sql | sort -g); do
    echo "Loading $file..."
    psql postgresql://postgres:local_password@db:5432/postgres -f $file
  done
else
  echo "Local environment detected. Loading seed data..."
  for file in $(ls ./data_tools/demo_data/*.sql | sort -g); do
    echo "Loading $file..."
    psql postgresql://"$ADMIN_PGUSER":"$ADMIN_PGPASSWORD"@"$PGHOST":"$PGPORT"/"$PGDATABASE" -f $file
  done
fi

echo "Data Loading Complete!"
