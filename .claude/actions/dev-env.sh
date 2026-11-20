# Source, don't run: exports this checkout's FRONTEND_PORT, BACKEND_DOMAIN and FRONTEND_URL
# from the repo-root .env (see .claude/actions/README.md), defaulting to 3000 and
# http://localhost:8080. Only those keys are read; the rest of .env is never executed.

_ops_env_file="$(git rev-parse --show-toplevel 2>/dev/null)/.env"

# Prints KEY's value, accepting the forms people write by hand in .env: last match wins, and
# `export KEY=`, spaces around `=`, quotes, a trailing ` # comment` and CRLF line endings are
# all handled. Unlike docker compose it doesn't expand `${VAR}` references, and it also cuts a
# ` #` inside quotes; neither occurs in a port or URL. Always returns 0, so it's safe under
# `set -e`.
_ops_read() {
  [ -f "$_ops_env_file" ] || return 0
  sed -n "s/^[[:space:]]*\(export[[:space:]]\{1,\}\)\{0,1\}$1[[:space:]]*=[[:space:]]*//p" "$_ops_env_file" 2>/dev/null \
    | tail -n 1 | tr -d '\r' | sed 's/[[:space:]]\{1,\}#.*$//; s/[[:space:]]*$//' | tr -d "\"'" || true
}

_ops_fe="$(_ops_read FRONTEND_PORT)"
case "$_ops_fe" in
  '') FRONTEND_PORT=3000 ;;
  *[!0-9]*)
    echo "dev-env.sh: ignoring invalid FRONTEND_PORT '$_ops_fe' in $_ops_env_file; using 3000" >&2
    FRONTEND_PORT=3000
    ;;
  *) FRONTEND_PORT="$_ops_fe" ;;
esac
BACKEND_DOMAIN="$(_ops_read BACKEND_DOMAIN)"
BACKEND_DOMAIN="${BACKEND_DOMAIN:-http://localhost:8080}"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"
export FRONTEND_PORT BACKEND_DOMAIN FRONTEND_URL

unset -f _ops_read
unset _ops_env_file _ops_fe
