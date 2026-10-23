#!/bin/ash
set -eo pipefail

# Seed, migrate, or drop a per-PR preview database (see docs/developers/preview-environments.md).
#
# Usage: preview_seed.sh <seed|migrate|ensure|drop>
#   seed     create the database if missing, then reset the schema and load test data
#   migrate  run alembic upgrade head only (keeps data QA entered)
#   ensure   seed if the database does not exist yet, otherwise migrate
#   drop     drop the database, disconnecting any sessions
#
# Env: PGDATABASE (must be ops_pr_<N>), PGHOST, PGPORT, PGUSER, PGPASSWORD,
#      ADMIN_PGUSER, ADMIN_PGPASSWORD

MODE=$1

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

# Only ever touch preview databases: ops_pr_ followed by a number with no leading zero.
case "$PGDATABASE" in
  ops_pr_[1-9]*) ;;
  *) fail "PGDATABASE '$PGDATABASE' is not a preview database (expected ops_pr_<N>)" ;;
esac
case "${PGDATABASE#ops_pr_}" in
  *[!0-9]*) fail "PGDATABASE '$PGDATABASE' is not a preview database (expected ops_pr_<N>)" ;;
esac

admin_psql() {
  psql postgresql://"$ADMIN_PGUSER":"$ADMIN_PGPASSWORD"@"$PGHOST":"$PGPORT"/postgres -v ON_ERROR_STOP=1 "$@"
}

db_exists() {
  [ "$(admin_psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'")" = "1" ]
}

seed() {
  if ! db_exists; then
    echo "Creating database $PGDATABASE..."
    admin_psql -c "CREATE DATABASE $PGDATABASE OWNER $PGUSER"
  fi
  ./data_tools/scripts/import_test_data.sh
}

migrate() {
  ./data_tools/scripts/upgrade_schema.sh
}

case "$MODE" in
  seed) seed ;;
  migrate) migrate ;;
  ensure)
    if db_exists; then
      migrate
    else
      seed
    fi
    ;;
  drop)
    echo "Dropping database $PGDATABASE..."
    admin_psql -c "DROP DATABASE IF EXISTS $PGDATABASE WITH (FORCE)"
    ;;
  *) fail "unknown mode '$MODE' (expected seed, migrate, ensure or drop)" ;;
esac

echo "preview_seed.sh $MODE complete for $PGDATABASE"
