#!/usr/bin/env bash
# Per-PR preview environments (OPS-6419, ADR 032). The preview_*.yml workflows are thin
# wrappers around these subcommands; see docs/developers/preview-environments.md.
#
# Usage: preview.sh <subcommand> [args]
#   gate                          decide whether this event deploys, and with which seed mode
#   slots <check|claim> <pr>      count preview slots; claim one with a placeholder app
#   db <mode> <pr> <image>        run preview_seed.sh <mode> in the preview-db job
#   deploy-app <backend|frontend> <pr> <sha> <mode>
#   wait-ready <backend|frontend> <pr> <sha>
#   health <pr>                   wait until /api/v1/health/ reports a working DB connection
#   comment <pr> <status> [sha]   create or update the status comment
#   deployment <start|ready|failed|inactive> <pr> [id]
#                                 GitHub deployment behind the PR's "View deployment" button
#   destroy <pr>                  delete the PR's apps and database
#   reap-list                     list previews to reap, and post TTL warnings
#
# Needs: az (logged in), gh (GH_TOKEN), jq, GNU date. GITHUB_REPOSITORY, GITHUB_OUTPUT and
# GITHUB_STEP_SUMMARY come from Actions.
#
# Secrets copied from the preview-db job are masked and never echoed. Don't add `set -x`
# or `az --debug` to this script.
set -euo pipefail
# A failed lookup inside $(...) must stop the script, not read as empty: the reaper deletes
# things based on these values.
shopt -s inherit_errexit

RG=opre-ops-dev-app-rg
CAE=opre-ops-dev-app-cae
DB_JOB=opre-ops-dev-app-preview-db
DB_CONTAINER=$DB_JOB
PG_SERVER=opre-ops-dev-db-preview-pg-server
PG_RG=opre-ops-dev-db-rg
DOMAIN=ops.opre.acf.gov
IMAGES=ghcr.io/hhs/opre-ops
# Override only to test the cap by hand.
MAX_SLOTS=${PREVIEW_MAX_SLOTS:-8}
TTL_DAYS=5
WARN_DAYS=4
LABEL=preview
MARKER='<!-- ops-preview -->'
WARN_MARKER='<!-- ops-preview-ttl-warning -->'
BOT="github-actions[bot]"
REPO=${GITHUB_REPOSITORY:?}
RUN_URL="${GITHUB_SERVER_URL:-https://github.com}/$REPO/actions/runs/${GITHUB_RUN_ID:-0}"
# The placeholder holds a slot until the real backend image replaces it.
PLACEHOLDER_IMAGE=mcr.microsoft.com/k8se/quickstart:latest

fail() {
  echo "::error::$*" >&2
  exit 1
}

output() {
  echo "$1=$2" >>"${GITHUB_OUTPUT:-/dev/null}"
}

now() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

check_pr() {
  [[ "${1:-}" =~ ^[1-9][0-9]{0,5}$ ]] || fail "invalid PR number '${1:-}'"
}

app_name() {
  echo "opre-ops-pr$2-app-$1"
}

url() {
  echo "https://pr-$1.$DOMAIN"
}

app_exists() {
  az containerapp show -n "$1" -g "$RG" --query name -o tsv >/dev/null 2>&1
}

app_tag() {
  az containerapp show -n "$1" -g "$RG" --query "tags.\"$2\"" -o tsv 2>/dev/null || true
}

# Backend apps holding a slot, as "<created> <pr>" lines, oldest first (ties: lower PR first).
slot_holders() {
  az containerapp list -g "$RG" \
    --query "[?tags.\"preview-pr\" != null && ends_with(name, '-app-backend')].[tags.\"preview-created\", tags.\"preview-pr\"]" \
    -o tsv | sort -t $'\t' -k1,1 -k2,2n
}

mask() {
  local line
  while IFS= read -r line; do
    [ -n "$line" ] && echo "::add-mask::$line"
  done <<<"$1"
  return 0
}

# --- gate ---------------------------------------------------------------------------------

# Env: EVENT_NAME, EVENT_ACTION, PR_NUMBER, HEAD_SHA, HEAD_REPO (empty on dispatch).
cmd_gate() {
  local pr=${PR_NUMBER:-} sha=${HEAD_SHA:-} mode
  check_pr "$pr"
  if [ "$EVENT_NAME" = workflow_dispatch ]; then
    local info
    info=$(gh api "repos/$REPO/pulls/$pr") || fail "PR $pr not found"
    [ "$(jq -r .state <<<"$info")" = open ] || fail "PR $pr is not open"
    [ "$(jq -r .head.repo.full_name <<<"$info")" = "$REPO" ] || fail "PR $pr is from a fork; previews are same-repo only"
    jq -e --arg l "$LABEL" 'any(.labels[]; .name == $l)' <<<"$info" >/dev/null ||
      fail "PR $pr has no '$LABEL' label; add the label to create a preview"
    sha=$(jq -r .head.sha <<<"$info")
    mode=seed
  else
    [ "${HEAD_REPO:-}" = "$REPO" ] || fail "fork PRs never get previews"
    case "$EVENT_ACTION" in
      labeled) mode=seed ;;
      synchronize | reopened) mode=ensure ;;
      *) fail "unexpected action '$EVENT_ACTION'" ;;
    esac
  fi
  [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || fail "invalid head SHA '$sha'"
  echo "PR $pr at $sha, seed mode $mode"
  output pr "$pr"
  output sha "$sha"
  output mode "$mode"

  # Deploy runs the head's copy of this script. A branch cut before previews existed has
  # none, so stop here instead of failing after the builds.
  local err
  err=$(mktemp)
  if gh api "repos/$REPO/contents/.github/scripts/preview.sh?ref=$sha" --silent 2>"$err"; then
    output outdated false
  else
    grep -q "HTTP 404" "$err" || fail "could not check $sha for preview.sh: $(cat "$err")"
    echo "PR $pr's branch has no .github/scripts/preview.sh; it needs main merged in"
    cmd_comment "$pr" outdated "$sha"
    output outdated true
  fi
}

# --- slots --------------------------------------------------------------------------------

cmd_slots() {
  local action=$1 pr=$2 backend holders count rank
  check_pr "$pr"
  backend=$(app_name backend "$pr")

  if app_exists "$backend"; then
    echo "PR $pr already holds a slot"
    output go true
    return
  fi

  if [ "$action" = check ]; then
    count=$(slot_holders | grep -c . || true)
    if [ "$count" -ge "$MAX_SLOTS" ]; then
      echo "Cap reached: $count of $MAX_SLOTS slots in use"
      cmd_comment "$pr" capped
      output go false
      return
    fi
    echo "$count of $MAX_SLOTS slots in use"
    output go true
    return
  fi

  [ "$action" = claim ] || fail "unknown slots action '$action'"
  echo "Claiming a slot for PR $pr..."
  az containerapp create -n "$backend" -g "$RG" --environment "$CAE" \
    --image "$PLACEHOLDER_IMAGE" --cpu 0.25 --memory 0.5Gi \
    --min-replicas 0 --max-replicas 1 --ingress external --target-port 8080 \
    --tags "preview-pr=$pr" "preview-created=$(now)" "preview-last-deploy=$(now)" -o none

  # Two runs can claim at once. Every run sorts the same way, so only the runs past the cap
  # (the latest claims) back out, and no shared lock is needed.
  holders=$(slot_holders)
  rank=$(awk -F '\t' -v pr="$pr" '$2 == pr { print NR; exit }' <<<"$holders")
  if [ -z "$rank" ] || [ "$rank" -gt "$MAX_SLOTS" ]; then
    echo "Lost the race for the last slot; releasing it"
    az containerapp delete -n "$backend" -g "$RG" --yes -o none
    cmd_comment "$pr" capped
    output go false
    return
  fi
  echo "Claimed slot $rank of $MAX_SLOTS"
  output go true
}

# --- db -----------------------------------------------------------------------------------

cmd_db() {
  local mode=$1 pr=$2 image=$3 env_args exec_name status i
  check_pr "$pr"
  case "$mode" in seed | ensure | migrate | drop) ;; *) fail "unknown db mode '$mode'" ;; esac

  # The job runs one execution per start but nothing stops two starts; wait (best effort)
  # so two previews don't seed at once on the small server.
  for i in $(seq 1 60); do
    [ "$(az containerapp job execution list -n "$DB_JOB" -g "$RG" \
      --query "length([?properties.status == 'Running'])" -o tsv)" = 0 ] && break
    [ "$i" = 1 ] && echo "Waiting for another preview-db execution to finish..."
    sleep 10
  done

  # `job start` replaces the whole container, so pass every env var from the job's own
  # (Terraform-managed) template, plus this PR's database. Secrets stay secretrefs.
  mapfile -t env_args < <(az containerapp job show -n "$DB_JOB" -g "$RG" -o json |
    jq -r '.properties.template.containers[0].env[]
      | select(.name != "PGDATABASE")
      | if .secretRef then "\(.name)=secretref:\(.secretRef)" else "\(.name)=\(.value)" end')
  [ "${#env_args[@]}" -gt 0 ] || fail "could not read env from $DB_JOB"

  echo "Starting preview_seed.sh $mode for ops_pr_$pr with $image..."
  exec_name=$(az containerapp job start -n "$DB_JOB" -g "$RG" \
    --container-name "$DB_CONTAINER" --image "$image" --cpu 0.5 --memory 1Gi \
    --command "./data_tools/scripts/preview_seed.sh" --args "$mode" \
    --env-vars "${env_args[@]}" "PGDATABASE=ops_pr_$pr" \
    --query name -o tsv)
  echo "Execution: $exec_name"

  # The job's replica timeout is 600s.
  for _ in $(seq 1 80); do
    status=$(az containerapp job execution show -n "$DB_JOB" -g "$RG" \
      --job-execution-name "$exec_name" --query properties.status -o tsv || true)
    case "$status" in
      Succeeded)
        echo "preview_seed.sh $mode succeeded"
        return
        ;;
      Failed | Stopped | Degraded) break ;;
    esac
    sleep 10
  done

  local job_id
  job_id=$(az containerapp job show -n "$DB_JOB" -g "$RG" --query id -o tsv)
  fail "preview_seed.sh $mode ended with status '${status:-unknown}'. Logs: https://portal.azure.com/#resource${job_id}/executionHistory (execution $exec_name)"
}

# --- deploy-app ---------------------------------------------------------------------------

cmd_deploy_app() {
  local kind=$1 pr=$2 sha=$3 mode=$4 app image created seeded port
  check_pr "$pr"
  app=$(app_name "$kind" "$pr")
  image="$IMAGES/ops-$kind:pr-$pr-$sha"
  local -a env=()

  # Read back preview-created and preview-seeded in case --tags replaces the whole set.
  # A backend without preview-seeded is new, so its database was just seeded too (ensure
  # seeds a database that has never finished a seed).
  created=$(app_tag "$(app_name backend "$pr")" preview-created)
  [ -n "$created" ] || created=$(now)
  seeded=$(app_tag "$(app_name backend "$pr")" preview-seeded)
  if [ "$mode" = seed ] || [ -z "$seeded" ]; then
    seeded=$(now)
  fi
  local -a tags=("preview-pr=$pr" "preview-sha=$sha" "preview-last-deploy=$(now)"
    "preview-created=$created" "preview-seeded=$seeded")

  if [ "$kind" = backend ]; then
    port=8080
    local secrets pgpassword jwt_private jwt_public pghost
    secrets=$(az containerapp job secret list -n "$DB_JOB" -g "$RG" --show-values -o json)
    pgpassword=$(jq -r '.[] | select(.name == "pgpassword") | .value' <<<"$secrets")
    jwt_private=$(jq -r '.[] | select(.name == "jwt-private-key") | .value' <<<"$secrets")
    jwt_public=$(jq -r '.[] | select(.name == "jwt-public-key") | .value' <<<"$secrets")
    unset secrets
    mask "$pgpassword"
    mask "$jwt_private"
    mask "$jwt_public"
    if [ -z "$pgpassword" ] || [ -z "$jwt_private" ] || [ -z "$jwt_public" ]; then
      fail "$DB_JOB is missing pgpassword, jwt-private-key or jwt-public-key"
    fi
    pghost=$(az containerapp job show -n "$DB_JOB" -g "$RG" \
      --query "properties.template.containers[0].env[?name=='PGHOST'].value | [0]" -o tsv)
    [ -n "$pghost" ] || fail "could not read PGHOST from $DB_JOB"

    env=(
      "OPS_CONFIG=environment/azure/preview.py"
      "PGHOST=$pghost" "PGPORT=5432" "PGUSER=ops" "PGDATABASE=ops_pr_$pr"
      "PGPASSWORD=secretref:pgpassword"
      "JWT_PRIVATE_KEY=secretref:jwt-private-key"
      "JWT_PUBLIC_KEY=secretref:jwt-public-key"
      "OPS_FRONTEND_URL=$(url "$pr")"
      "HOST_HEADER_PREFIX=$app."
    )
    # `slots claim` created the app, so it exists; set secrets before the update uses them.
    az containerapp secret set -n "$app" -g "$RG" -o none --secrets \
      "pgpassword=$pgpassword" "jwt-private-key=$jwt_private" "jwt-public-key=$jwt_public"
    unset pgpassword jwt_private jwt_public
  else
    port=3000
  fi

  echo "Deploying $image to $app..."
  if app_exists "$app"; then
    local -a env_flag=()
    [ "${#env[@]}" -gt 0 ] && env_flag=(--replace-env-vars "${env[@]}")
    az containerapp update -n "$app" -g "$RG" --image "$image" \
      --cpu 0.25 --memory 0.5Gi --min-replicas 1 --max-replicas 1 \
      "${env_flag[@]}" --tags "${tags[@]}" -o none
  else
    local -a env_flag=()
    [ "${#env[@]}" -gt 0 ] && env_flag=(--env-vars "${env[@]}")
    az containerapp create -n "$app" -g "$RG" --environment "$CAE" --image "$image" \
      --cpu 0.25 --memory 0.5Gi --min-replicas 1 --max-replicas 1 \
      --ingress external --target-port "$port" \
      "${env_flag[@]}" --tags "${tags[@]}" -o none
  fi
}

# --- wait-ready ---------------------------------------------------------------------------

cmd_wait_ready() {
  local kind=$1 pr=$2 sha=$3 app image state
  check_pr "$pr"
  app=$(app_name "$kind" "$pr")
  image="$IMAGES/ops-$kind:pr-$pr-$sha"
  for _ in $(seq 1 60); do
    state=$(az containerapp show -n "$app" -g "$RG" -o json | jq -c '{
      ready: .properties.latestReadyRevisionName,
      latest: .properties.latestRevisionName,
      image: .properties.template.containers[0].image}')
    if jq -e --arg image "$image" '.ready == .latest and .image == $image' <<<"$state" >/dev/null; then
      echo "$app is running $image"
      return
    fi
    local revision provisioning
    revision=$(jq -r .latest <<<"$state")
    provisioning=$(az containerapp revision show -n "$app" -g "$RG" --revision "$revision" \
      --query properties.provisioningState -o tsv 2>/dev/null || true)
    [ "$provisioning" = Failed ] && fail "revision $revision of $app failed to provision"
    sleep 10
  done
  fail "$app did not become ready with $image within 10 minutes: $state"
}

# --- health -------------------------------------------------------------------------------

cmd_health() {
  local pr=$1 health_url body
  check_pr "$pr"
  health_url="$(url "$pr")/api/v1/health/"
  # The endpoint returns 200 even when the DB is down, so read the DB check itself.
  for _ in $(seq 1 30); do
    body=$(curl -fsS --max-time 10 "$health_url" 2>/dev/null || true)
    if jq -e '.checks.database_connection.db_conn_is_ok == true' <<<"$body" >/dev/null 2>&1; then
      echo "$health_url reports a working database connection"
      return
    fi
    sleep 10
  done
  fail "$health_url never reported db_conn_is_ok=true. Last response: ${body:-none}"
}

# --- comment ------------------------------------------------------------------------------

find_comment() {
  gh api --paginate "repos/$REPO/issues/$1/comments?per_page=100" \
    --jq ".[] | select(.user.login == \"$BOT\" and (.body | startswith(\"$2\"))) | .id" | head -n 1
}

# Status: deploying, ready, failed, capped, outdated, or removed (REASON env gives the cause).
cmd_comment() {
  local pr=$1 status=$2 sha=${3:-} id body line seeded
  check_pr "$pr"
  id=$(find_comment "$pr" "$MARKER")
  seeded=$(app_tag "$(app_name backend "$pr")" preview-seeded)

  case "$status" in
    deploying) line="Deploying (this takes about 10 to 15 minutes)" ;;
    ready) line="Ready" ;;
    failed) line="Deploy failed. See the [run logs]($RUN_URL)." ;;
    capped) line="Not deployed: all $MAX_SLOTS preview slots are in use. Free a slot (remove the \`$LABEL\` label from a PR that no longer needs one), then push a commit or re-add the label here. There is no automatic retry." ;;
    outdated) line="Not deployed: this branch is older than the preview workflows. Merge \`main\` into it, then push (or re-add the \`$LABEL\` label)." ;;
    removed) line="Removed (${REASON:-label removed or PR closed}). Re-add the \`$LABEL\` label to bring it back with fresh data." ;;
    *) fail "unknown comment status '$status'" ;;
  esac

  if [ "$status" = removed ] || [ "$status" = outdated ]; then
    # Never start a thread just to say it's gone.
    [ "$status" = removed ] && [ -z "$id" ] && return 0
    body="$MARKER
### Preview environment

**Status:** $line"
  else
    body="$MARKER
### Preview environment

| | |
|---|---|
| **URL** | $(url "$pr") |
| **Commit** | ${sha:+\`${sha:0:7}\`} |
| **Status** | $line |
| **Last seeded** | ${seeded:-not yet} |

**Log in:** choose *Sign in with FakeAuth* and pick a role: System Owner, Budget Team Member, Procurement Team Member, Division Director, User Demo, Administrative Power User or Read Only User.

**Data:** the first deploy seeds test data. Later pushes only run migrations, so data you enter survives fix commits. To reset it, open **Actions > Preview Create > Run workflow** and enter \`$pr\`.

**Lifetime:** removed when the PR closes, the \`$LABEL\` label is removed, or after $TTL_DAYS days with no pushes or comments (with a warning a day before).

**Limits:** FakeAuth only; no Storybook, \`/docs\` or document upload. If you edit a migration that already ran here, reseed.

[Docs](https://github.com/$REPO/blob/main/docs/developers/preview-environments.md) · [Latest run]($RUN_URL)"
  fi

  if [ -n "$id" ]; then
    gh api -X PATCH "repos/$REPO/issues/comments/$id" -f body="$body" >/dev/null
  else
    gh api "repos/$REPO/issues/$pr/comments" -f body="$body" >/dev/null
  fi
}

# --- deployment ---------------------------------------------------------------------------

# One `preview` environment shared by all PRs; each PR's deployments carry their own task so
# they can be found again. transient_environment and auto_inactive=false stop one PR's deploy
# from marking another PR's deployment inactive.
deployment_task() {
  echo "deploy:pr-$1"
}

set_deployment_status() {
  local id=$1 state=$2 pr=$3
  jq -n --arg state "$state" --arg url "$(url "$pr")" --arg log "$RUN_URL" \
    '{state: $state, log_url: $log, auto_inactive: false}
     + (if $state == "success" then {environment_url: $url} else {} end)' |
    gh api "repos/$REPO/deployments/$id/statuses" --input - >/dev/null
}

# Outputs `deployment_id` for start; the other actions take it (inactive takes none).
cmd_deployment() {
  local action=$1 pr=$2 id=${3:-} ref ids
  check_pr "$pr"
  case "$action" in
    start)
      # The head branch (not the merge ref or main) so the deployment shows on the PR for
      # label, push and reseed runs alike.
      ref=$(gh api "repos/$REPO/pulls/$pr" --jq .head.ref)
      id=$(jq -n --arg ref "$ref" --arg task "$(deployment_task "$pr")" --arg desc "Preview for PR $pr" \
        --argjson pr "$pr" \
        '{ref: $ref, task: $task, environment: "preview", description: $desc, payload: {pr: $pr},
          auto_merge: false, required_contexts: [], transient_environment: true,
          production_environment: false}' |
        gh api "repos/$REPO/deployments" --input - --jq .id)
      set_deployment_status "$id" in_progress "$pr"
      output deployment_id "$id"
      ;;
    ready)
      [[ "$id" =~ ^[0-9]+$ ]] || fail "invalid deployment id '$id'"
      set_deployment_status "$id" success "$pr"
      # Earlier deployments of this PR now point at an older commit.
      ids=$(gh api --paginate "repos/$REPO/deployments?environment=preview&task=$(deployment_task "$pr")&per_page=100" \
        --jq ".[] | select(.id != $id) | .id")
      for other in $ids; do
        set_deployment_status "$other" inactive "$pr"
      done
      ;;
    failed)
      [[ "$id" =~ ^[0-9]+$ ]] || fail "invalid deployment id '$id'"
      set_deployment_status "$id" failure "$pr"
      ;;
    inactive)
      # A PR that never deployed has none, which is fine.
      ids=$(gh api --paginate "repos/$REPO/deployments?environment=preview&task=$(deployment_task "$pr")&per_page=100" \
        --jq '.[].id')
      for id in $ids; do
        set_deployment_status "$id" inactive "$pr"
      done
      echo "Marked $(wc -w <<<"$ids" | tr -d ' ') deployment(s) inactive for PR $pr"
      ;;
    *) fail "unknown deployment action '$action'" ;;
  esac
}

# --- destroy ------------------------------------------------------------------------------

cmd_destroy() {
  local pr=$1 kind app
  check_pr "$pr"
  for kind in frontend backend; do
    app=$(app_name "$kind" "$pr")
    if app_exists "$app"; then
      echo "Deleting $app..."
      az containerapp delete -n "$app" -g "$RG" --yes -o none
    else
      echo "$app is already gone"
    fi
  done
  cmd_db drop "$pr" "$IMAGES/ops-data-tools:dev"
  cmd_deployment inactive "$pr"
}

# --- reap-list ----------------------------------------------------------------------------

epoch() {
  [ -n "${1:-}" ] && date -u -d "$1" +%s || echo 0
}

# Latest of: the last deploy, the head commit, and the newest human comment or review.
# The workflow's own comments are excluded, so warnings never reset the clock. The deploy
# time comes from the app list the reaper already fetched, so there's no second Azure call
# whose failure could read as "never deployed".
last_activity() {
  local pr=$1 sha=$2 deploy=$3 commit human
  commit=$(gh api "repos/$REPO/commits/$sha" --jq .commit.committer.date)
  human=$({
    gh api --paginate "repos/$REPO/issues/$pr/comments?per_page=100" \
      --jq ".[] | select(.user.login != \"$BOT\") | .created_at"
    gh api --paginate "repos/$REPO/pulls/$pr/comments?per_page=100" \
      --jq ".[] | select(.user.login != \"$BOT\") | .created_at"
    gh api --paginate "repos/$REPO/pulls/$pr/reviews?per_page=100" \
      --jq ".[] | select(.user.login != \"$BOT\") | .submitted_at // empty"
  } | sort | tail -n 1)
  printf '%s\n' "$(epoch "$deploy")" "$(epoch "$commit")" "$(epoch "$human")" | sort -n | tail -n 1
}

warn_ttl() {
  local pr=$1 activity=$2 last_warning body
  last_warning=$(gh api --paginate "repos/$REPO/issues/$pr/comments?per_page=100" \
    --jq ".[] | select(.user.login == \"$BOT\" and (.body | startswith(\"$WARN_MARKER\"))) | .created_at" |
    sort | tail -n 1)
  # One warning per idle stretch: skip if one was already posted since the last activity.
  if [ -n "$last_warning" ] && [ "$(epoch "$last_warning")" -gt "$activity" ]; then
    return
  fi
  if [ "${DRY_RUN:-false}" = true ]; then
    echo "  (dry run) would post the TTL warning"
    return
  fi
  body="$WARN_MARKER
This preview has had no pushes or comments for $WARN_DAYS days and will be removed in about a day. Push a commit or leave a comment to keep it."
  gh api "repos/$REPO/issues/$pr/comments" -f body="$body" >/dev/null
}

# Env: DRY_RUN. Outputs `prs`, a JSON list of {pr, reason} for preview_destroy.yml.
cmd_reap_list() {
  local apps dbs prs pr info reason now_s activity idle_days reap="[]" err
  err=$(mktemp)
  local app_list
  app_list=$(az containerapp list -g "$RG" -o json)
  apps=$(jq -r '.[].name' <<<"$app_list" |
    sed -nE 's/^opre-ops-pr([1-9][0-9]*)-app-(backend|frontend)$/\1/p')
  dbs=$(az postgres flexible-server db list -s "$PG_SERVER" -g "$PG_RG" --query "[].name" -o tsv |
    sed -nE 's/^ops_pr_([1-9][0-9]*)$/\1/p')
  prs=$(printf '%s\n%s\n' "$apps" "$dbs" | grep . | sort -un || true)
  now_s=$(date -u +%s)

  {
    echo "### Preview reaper$([ "${DRY_RUN:-false}" = true ] && echo ' (dry run)')"
    echo
    echo "| PR | Apps | Database | Result |"
    echo "|---|---|---|---|"
  } >>"${GITHUB_STEP_SUMMARY:-/dev/null}"

  for pr in $prs; do
    reason=""
    local has_apps=no has_db=no
    grep -qx "$pr" <<<"$apps" && has_apps=yes
    grep -qx "$pr" <<<"$dbs" && has_db=yes

    # Only a 404 means the PR is gone. Any other error fails the run, so a GitHub outage
    # never reaps live previews.
    if ! info=$(gh api "repos/$REPO/pulls/$pr" 2>"$err"); then
      grep -q "HTTP 404" "$err" || fail "could not look up PR $pr: $(cat "$err")"
      reason="PR not found"
    elif [ "$(jq -r .state <<<"$info")" != open ]; then
      reason="PR closed"
    elif ! jq -e --arg l "$LABEL" 'any(.labels[]; .name == $l)' <<<"$info" >/dev/null; then
      reason="label removed"
    else
      activity=$(last_activity "$pr" "$(jq -r .head.sha <<<"$info")" \
        "$(jq -r --arg n "$(app_name backend "$pr")" '.[] | select(.name == $n) | .tags["preview-last-deploy"] // empty' <<<"$app_list")")
      idle_days=$(((now_s - activity) / 86400))
      if [ "$idle_days" -ge "$TTL_DAYS" ]; then
        reason="inactive for $idle_days days"
      elif [ "$idle_days" -ge "$WARN_DAYS" ]; then
        echo "PR $pr: idle $idle_days days, warning"
        warn_ttl "$pr" "$activity"
      fi
    fi

    if [ -n "$reason" ]; then
      echo "PR $pr: reap ($reason)"
      reap=$(jq -c --argjson pr "$pr" --arg reason "$reason" '. + [{pr: $pr, reason: $reason}]' <<<"$reap")
    else
      echo "PR $pr: keep"
    fi
    echo "| $pr | $has_apps | $has_db | ${reason:+reap: }${reason:-keep} |" >>"${GITHUB_STEP_SUMMARY:-/dev/null}"
  done

  if [ "${DRY_RUN:-false}" = true ]; then
    echo "Dry run: would reap $reap"
    reap="[]"
  fi
  output prs "$reap"
}

# --- main ---------------------------------------------------------------------------------

sub=${1:-}
shift || true
case "$sub" in
  gate) cmd_gate "$@" ;;
  slots) cmd_slots "$@" ;;
  db) cmd_db "$@" ;;
  deploy-app) cmd_deploy_app "$@" ;;
  wait-ready) cmd_wait_ready "$@" ;;
  health) cmd_health "$@" ;;
  comment) cmd_comment "$@" ;;
  deployment) cmd_deployment "$@" ;;
  destroy) cmd_destroy "$@" ;;
  reap-list) cmd_reap_list "$@" ;;
  *) fail "usage: preview.sh <gate|slots|db|deploy-app|wait-ready|health|comment|deployment|destroy|reap-list> [args]" ;;
esac
