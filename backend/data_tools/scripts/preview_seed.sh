#!/bin/ash
# shellcheck shell=dash
set -eo pipefail

# Seed, migrate, or drop a per-PR preview database.
#
# Usage: preview_seed.sh <seed|migrate|ensure|drop>
#   seed     create the database if missing, then reset the schema and load test data
#   migrate  run alembic upgrade head only (keeps data QA entered)
#   ensure   seed unless a previous seed finished, otherwise migrate
#   drop     drop the database, disconnecting any sessions
#
# A finished seed is recorded as a comment on the database, so a seed that fails
# partway is retried by the next `ensure` instead of being migrated forever.
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

# import_test_data.sh grants the ops schema to the role named "ops", so the app's
# role must be that one or it would get no privileges on the seeded schema.
[ "$PGUSER" = "ops" ] || fail "PGUSER must be 'ops' (got '$PGUSER')"

admin_psql() {
  psql postgresql://"$ADMIN_PGUSER":"$ADMIN_PGPASSWORD"@"$PGHOST":"$PGPORT"/postgres -v ON_ERROR_STOP=1 "$@"
}

SEEDED_MARKER="preview-seeded"

# Callers use these in `if`, where `set -e` is off, so a failed query must exit
# explicitly; otherwise a connection error would read as "missing" and trigger a reseed.
db_exists() {
  out=$(admin_psql -tAc "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'") ||
    fail "could not query pg_database for $PGDATABASE"
  [ "$out" = "1" ]
}

db_seeded() {
  out=$(admin_psql -tAc "SELECT shobj_description(oid, 'pg_database') FROM pg_database WHERE datname = '$PGDATABASE'") ||
    fail "could not read the seed marker for $PGDATABASE"
  [ "$out" = "$SEEDED_MARKER" ]
}

# Up to 8 previews share one B1ms server (35 usable connections). Each backend's pool
# is 2 + 3, so 8 leaves room for migrations and a psql session while stopping one
# preview from starving the rest. Idempotent, so it also fixes older databases.
limit_connections() {
  admin_psql -c "ALTER DATABASE $PGDATABASE CONNECTION LIMIT 8"
}

seed() {
  if db_exists; then
    admin_psql -c "COMMENT ON DATABASE $PGDATABASE IS NULL"
  else
    echo "Creating database $PGDATABASE..."
    admin_psql -c "CREATE DATABASE $PGDATABASE OWNER $PGUSER"
  fi
  limit_connections
  ./data_tools/scripts/import_test_data.sh
  admin_psql -c "COMMENT ON DATABASE $PGDATABASE IS '$SEEDED_MARKER'"
}

migrate() {
  ./data_tools/scripts/upgrade_schema.sh
}

case "$MODE" in
  seed) seed ;;
  migrate) migrate ;;
  ensure)
    if db_seeded; then
      limit_connections
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
