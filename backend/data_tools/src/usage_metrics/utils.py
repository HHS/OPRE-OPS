"""Usage metrics report job.

Aggregates existing activity data from ``ops_event`` into a usage report and uploads it to
Azure Blob Storage for the UX team. The report is delivered as a two-sheet ``.xlsx`` -- an
"Aggregate" sheet (per-day x division x role counts) plus a "Per-user" sheet listing each named
user who signed in during the reporting window along with their sign-in count and last sign-in.
**No IP addresses** are included in either sheet.

Note: the "Per-user" sheet names individual users, which reverses the counts-only/no-named-rows
posture originally scoped for this report. This was an explicit, approved requirement change
(#4148) -- the report now contains named user data, so read access to the ``reports/`` prefix
must be granted with that in mind.

Follows the ``cleanup_user_sessions`` template: ``__main__`` -> ``get_config(ENV)`` ->
``init_db_from_config`` -> run, with loguru logging.

**Schedule.** One report per sprint, on the last Friday of each two-week sprint. Azure cron cannot
express "every other Friday", so the job fires every Friday and ``should_generate_report`` exits
early on the off-sprint ones (see ``usage_metrics_sprint_anchor_date``). The reporting window is
14 days to match, so consecutive reports tile the calendar with no gap or overlap.

Attribution / counting notes (see the #4148 plan for the full rationale):
- **Only SUCCESS events are counted.** A failed/aborted request still persists an OpsEvent
  (``OpsEventHandler.__exit__`` sets ``event_status = FAILED`` but keeps the event_type), so
  counting all rows would inflate every metric with attempts that never took effect. Events
  whose ``event_status`` is not SUCCESS are skipped entirely.
- **Reporting window.** Only rows whose ``created_on`` falls within the configured lookback
  window are aggregated, so the report is scoped to a period and does not re-read the whole
  append-only audit log on every run (bounded memory/runtime and a period-scoped report).
- **Day bucketing / timezone.** ``created_on`` is a naive ``TIMESTAMP`` populated by
  ``func.now()``; its wall-clock reflects the database session timezone at write time, which is
  UTC for this deployment (the standard for the app's Postgres). Bucketing therefore uses
  ``created_on.date()`` directly and the window cutoff is a naive-UTC datetime, so both sides of
  the comparison are UTC. (Setting the process ``TZ`` would not reinterpret already-stored naive
  values, so it is intentionally not relied on for bucketing.)
- Most events attribute the actor via the inherited ``created_by`` column.
- ``LOGIN_ATTEMPT`` rows have ``created_by = None`` (the login endpoint is not jwt-required),
  so the actor is read from ``event_details['user']['id']`` -- present on SUCCESS rows.
- Events whose actor cannot be resolved (e.g. ``IDLE_LOGOUT`` fired after the session is already
  invalid) are bucketed under division/role ``"UNKNOWN"`` rather than dropped, so those per-row
  counts stay complete.
- Role is a many-to-many relationship; a user holding multiple roles is counted once per
  role, so role sums for a division may exceed the division's own totals. This is documented
  in the report rather than resolved to a single "primary" role.
- **agreements_viewed** is the number of distinct (user, agreement) pairs per bucket, not a raw
  ``GET_AGREEMENT`` row count. That event type is shared by the single-agreement GET, the
  agreement list GET (one per list page / export batch), and both procurement-action GETs, so
  counting rows mostly measured list-page loads and refetches. Only rows whose
  ``event_details`` carry a single ``agreement_id`` are views, and repeat fetches of the same
  agreement by the same user on the same day count once. See ``viewed_agreement_id``.
"""

import io
import os
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone

import sqlalchemy
from loguru import logger
from openpyxl import Workbook
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from data_tools.environment.types import DataToolsConfig
from data_tools.src.azure_utils.utils import build_blob_sas_url, upload_blob
from data_tools.src.common.db import init_db_from_config
from data_tools.src.common.utils import get_config
from data_tools.src.usage_metrics.email_delivery import parse_recipients, send_report_link_email
from models import Division, OpsEvent, OpsEventStatus, OpsEventType, User, UserStatus

# Logger configuration (mirrors cleanup_user_sessions).
format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
logger.remove()
logger.add(
    sys.stdout, format=format, level="INFO", filter=lambda record: ("SafeUserSchema not found" not in record["message"])
)

UNKNOWN = "UNKNOWN"

# Sentinel bucket used when an event's actor cannot be resolved to a user/division/role.
UNKNOWN_ATTRIBUTION = {"division": UNKNOWN, "roles": (UNKNOWN,)}

# Event types whose distinct actor counts as an "active user". These are all jwt-required, so
# their created_by is reliably populated; GET events capture read-only viewers that write
# events would miss.
ACTIVE_USER_EVENT_TYPES = frozenset(
    {
        OpsEventType.GET_AGREEMENT,
        OpsEventType.GET_USER_DETAILS,
        OpsEventType.CREATE_NEW_AGREEMENT,
        OpsEventType.UPDATE_AGREEMENT,
        OpsEventType.DELETE_AGREEMENT,
        OpsEventType.CREATE_BLI,
        OpsEventType.UPDATE_BLI,
        OpsEventType.DELETE_BLI,
        OpsEventType.CREATE_NEW_CAN,
        OpsEventType.UPDATE_CAN,
        OpsEventType.DELETE_CAN,
        OpsEventType.CREATE_PROJECT,
        OpsEventType.UPDATE_PROJECT,
        OpsEventType.CREATE_USER,
        OpsEventType.UPDATE_USER,
    }
)

# Event types that map to a single count column. deactivated_users and agreements_viewed are
# handled separately because they depend on the event payload, not just the event type.
# LOGIN_ATTEMPT maps to "logins" here because only SUCCESS rows reach aggregation, so every
# LOGIN_ATTEMPT that gets counted is a completed login.
EVENT_TYPE_TO_METRIC = {
    OpsEventType.LOGIN_ATTEMPT: "logins",
    OpsEventType.LOGOUT: "logouts",
    OpsEventType.IDLE_LOGOUT: "idle_logouts",
    OpsEventType.CREATE_USER: "new_users",
    OpsEventType.CREATE_NEW_AGREEMENT: "agreements_edited",
    OpsEventType.UPDATE_AGREEMENT: "agreements_edited",
    OpsEventType.DELETE_AGREEMENT: "agreements_edited",
    OpsEventType.CREATE_BLI: "blis_created",
    OpsEventType.CREATE_PROJECT: "projects_created",
}

# Ordered metric columns. Count metrics come after the breakdown dimensions on the Aggregate sheet.
METRIC_COLUMNS = [
    "active_users",
    "logins",
    "logouts",
    "idle_logouts",
    "new_users",
    "deactivated_users",
    "agreements_edited",
    "agreements_viewed",
    "blis_created",
    "projects_created",
]
AGGREGATE_COLUMNS = ["date", "division", "role"] + METRIC_COLUMNS

# Per-user sheet columns. ``last_sign_in_utc`` is explicitly labelled UTC because created_on is a
# naive timestamp stored in UTC; it is rendered as an ISO-8601 string so spreadsheet apps do not
# reinterpret it in the viewer's locale. ``roles`` is a joined string here (one row per user),
# unlike the aggregate sheet which fans out one row per role.
USER_SHEET_COLUMNS = ["name", "email", "division", "roles", "sign_in_count", "last_sign_in_utc"]

# MIME type so a browser downloading the .xlsx via a SAS link saves it correctly rather than
# treating it as application/octet-stream.
XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

# The team's sprint length. The report runs on the last Friday of each sprint, i.e. every other
# Friday -- a cadence plain cron cannot express (cron has no notion of "every other week"), so the
# job's cron fires weekly on Friday and off-sprint runs exit early via ``is_sprint_end``.
SPRINT_LENGTH_DAYS = 14
FRIDAY = 4  # date.weekday(): Monday is 0

# How far back to shift "now" before taking its date, so a run that starts slightly after the
# 23:50 UTC Friday cron is still attributed to that Friday. See ``effective_run_date``. Two hours
# comfortably covers a cold start plus one replica retry while staying far short of the next day.
RUN_DATE_GRACE = timedelta(hours=2)


def build_user_attribution_lookup(session: Session) -> dict[int, dict]:
    """Build a ``user_id -> {division, roles, email, full_name}`` lookup for actor attribution.

    Division resolves to the division ``name`` (or ``UNKNOWN`` when a user has no division);
    roles is a tuple of role names (or ``(UNKNOWN,)`` when a user has none). ``email`` and
    ``full_name`` are carried for the per-user sheet (may be ``None`` when unset on the user).
    """
    division_names = {d.id: d.name for d in session.execute(select(Division)).scalars().all()}

    lookup: dict[int, dict] = {}
    # selectinload avoids an N+1 lazy load of user.roles (one query per user).
    users = session.execute(select(User).options(selectinload(User.roles))).scalars().all()
    for user in users:
        division = division_names.get(user.division, UNKNOWN) if user.division is not None else UNKNOWN
        roles = tuple(role.name for role in user.roles) or (UNKNOWN,)
        lookup[user.id] = {
            "division": division,
            "roles": roles,
            "email": user.email,
            "full_name": user.full_name,
        }
    return lookup


def resolve_actor_id(event: OpsEvent) -> int | None:
    """Resolve the acting user's id for an event.

    ``LOGIN_ATTEMPT`` rows carry ``created_by = None`` (the login endpoint is not jwt-required),
    so the actor id is read from ``event_details['user']['id']`` -- present only on SUCCESS rows.
    All other events use the inherited ``created_by`` column.
    """
    if event.event_type == OpsEventType.LOGIN_ATTEMPT:
        details = event.event_details or {}
        user = details.get("user") if isinstance(details, dict) else None
        if isinstance(user, dict):
            user_id = user.get("id")
            return int(user_id) if isinstance(user_id, int) else None
        return None
    return event.created_by


def is_deactivating_update(event: OpsEvent) -> bool:
    """Return True if an ``UPDATE_USER`` event set the user's status to INACTIVE or LOCKED.

    Deactivation is not its own event (``DEACTIVATE_USER`` is never emitted); it is an
    ``UPDATE_USER`` that sets ``status`` to INACTIVE/LOCKED. The status can arrive two ways:
    - Manual (UI) path: nested under ``event_details['request.json']`` (the captured HTTP body).
    - Automated (``disable_users`` job) path: a top-level ``event_details['status']``.
    """
    if event.event_type != OpsEventType.UPDATE_USER:
        return False
    details = event.event_details or {}
    if not isinstance(details, dict):
        return False
    payload = details.get("request.json")
    status = payload.get("status") if isinstance(payload, dict) else details.get("status")
    return status in (UserStatus.INACTIVE.name, UserStatus.LOCKED.name)


def viewed_agreement_id(event: OpsEvent) -> int | None:
    """Return the agreement id a ``GET_AGREEMENT`` event viewed, or None if it is not a single view.

    ``GET_AGREEMENT`` is emitted by four endpoints, told apart only by the ``event_details`` keys
    each one records:
    - ``GET /agreements/<id>``: ``agreement_id`` -- the only one that is a view of an agreement.
    - ``GET /agreements/``: ``agreement_ids`` (list page, export batches).
    - ``GET /procurement-actions/<id>`` and ``GET /procurement-actions/``: ``procurement_action_id(s)``.
    """
    if event.event_type != OpsEventType.GET_AGREEMENT:
        return None
    details = event.event_details or {}
    if not isinstance(details, dict):
        return None
    agreement_id = details.get("agreement_id")
    # bool is an int subclass; exclude it so a malformed payload cannot count as agreement 1/0.
    return agreement_id if isinstance(agreement_id, int) and not isinstance(agreement_id, bool) else None


def _new_counts() -> dict[str, int]:
    return {metric: 0 for metric in METRIC_COLUMNS}


def _row_count_metrics(event: OpsEvent) -> list[str]:
    """Return the per-row count columns an event increments (one each).

    The distinct-set metrics (active_users, agreements_viewed) are tallied separately.
    """
    metrics = []
    metric = EVENT_TYPE_TO_METRIC.get(event.event_type)
    if metric is not None:
        metrics.append(metric)
    if is_deactivating_update(event):
        metrics.append("deactivated_users")
    return metrics


# The only event types that can affect the Aggregate sheet: those carrying a metric, those counting
# toward active_users, and UPDATE_USER (the carrier for deactivations -- DEACTIVATE_USER is never
# emitted). Any other type passes through the aggregation loop without touching a single bucket, so
# filtering them out in SQL is behaviour-preserving and keeps a large share of ops_event rows --
# which hold a fat event_details JSON each -- from crossing the wire at all.
AGGREGATE_EVENT_TYPES = frozenset(EVENT_TYPE_TO_METRIC) | ACTIVE_USER_EVENT_TYPES | {OpsEventType.UPDATE_USER}

# Rows are consumed in batches rather than materialised all at once. The job runs with 0.5 GiB, and
# a sprint of ops_event rows (each with an event_details JSON that can include request bodies and
# headers) does not reliably fit. Column-only selects are used alongside this deliberately: loading
# full ORM entities would keep every row alive in the Session identity map for the whole pass, so
# streaming alone would not bound memory.
EVENT_STREAM_BATCH_SIZE = 1_000


def aggregate_events(
    session: Session, lookback_days: int, user_lookup: dict[int, dict] | None = None
) -> dict[tuple[str, str, str], dict[str, int]]:
    """Aggregate ``ops_event`` rows into per-(date, division, role) count buckets.

    Only rows created within the last ``lookback_days`` (a UTC-naive cutoff, matching the naive
    ``created_on`` timestamps) and with ``event_status == SUCCESS`` are counted.

    ``user_lookup`` may be supplied by the caller so that a single attribution lookup is shared with
    :func:`aggregate_user_sign_ins` instead of each pass querying every user and division again.

    Returns a mapping of ``(date_iso, division, role) -> {metric: count}``.
    """
    if user_lookup is None:
        user_lookup = build_user_attribution_lookup(session)

    counts: dict[tuple[str, str, str], dict[str, int]] = defaultdict(_new_counts)
    # Distinct actors per bucket for the active_users metric.
    active_users: dict[tuple[str, str, str], set[int]] = defaultdict(set)
    # Distinct (actor, agreement) pairs per bucket for the agreements_viewed metric.
    viewed: dict[tuple[str, str, str], set[tuple[int, int]]] = defaultdict(set)

    # created_on is a naive TIMESTAMP written in the DB's (UTC) session tz, so compare against a
    # naive-UTC cutoff. This scopes the scan to the reporting window instead of the whole table.
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=lookback_days)
    # Select only the four columns the loop reads, as a streamed Core result. Row objects expose the
    # same attribute names, so resolve_actor_id / is_deactivating_update work on them unchanged.
    stmt = (
        select(OpsEvent.created_on, OpsEvent.event_type, OpsEvent.created_by, OpsEvent.event_details)
        .where(
            OpsEvent.created_on >= cutoff,
            OpsEvent.event_status == OpsEventStatus.SUCCESS,
            OpsEvent.event_type.in_(AGGREGATE_EVENT_TYPES),
        )
        .execution_options(yield_per=EVENT_STREAM_BATCH_SIZE)
    )
    logger.info(f"Aggregating successful ops_event row(s) since {cutoff.date().isoformat()}.")

    seen = 0
    for event in session.execute(stmt):
        seen += 1
        if event.created_on is None:
            continue
        date_iso = event.created_on.date().isoformat()
        actor_id = resolve_actor_id(event)
        attribution = user_lookup.get(actor_id, UNKNOWN_ATTRIBUTION) if actor_id is not None else UNKNOWN_ATTRIBUTION
        agreement_id = viewed_agreement_id(event)
        metrics = _row_count_metrics(event)

        # A multi-role user is counted once per role (fan-out); see module docstring.
        for role in attribution["roles"]:
            key = (date_iso, attribution["division"], role)

            for metric in metrics:
                counts[key][metric] += 1

            if event.event_type in ACTIVE_USER_EVENT_TYPES and actor_id is not None:
                active_users[key].add(actor_id)

            if agreement_id is not None and actor_id is not None:
                viewed[key].add((actor_id, agreement_id))

    logger.info(f"Aggregated {seen:,} relevant successful ops_event row(s).")

    # Fold the distinct-actor and distinct-view sets into the count buckets.
    for key, actors in active_users.items():
        counts[key]["active_users"] = len(actors)
    for key, pairs in viewed.items():
        counts[key]["agreements_viewed"] = len(pairs)

    return counts


def aggregate_user_sign_ins(
    session: Session, lookback_days: int, user_lookup: dict[int, dict] | None = None
) -> list[dict]:
    """Aggregate successful sign-ins into one row per user for the "Per-user" sheet.

    A sign-in is a ``LOGIN_ATTEMPT`` row with ``event_status == SUCCESS`` inside the reporting
    window (same UTC-naive cutoff and window as :func:`aggregate_events`). One completed login
    (one ``/auth/login/`` POST) writes exactly one such row and creates one new ``UserSession``
    (the login flow always deactivates prior sessions and creates a fresh one), so counting these
    rows is a faithful count of sign-in sessions -- i.e. how many times the user had to sign in.

    Counting is keyed on the resolved actor id ONLY (never fanned out per role, unlike the
    aggregate sheet), so a user holding multiple roles is counted once per login, not once per
    role. Users with no successful login in the window are absent from the result.

    Name/email/division/roles come from the live ``ops_user`` row; when a user id is no longer in
    that table (e.g. hard-deleted after signing in) they fall back to the ``event_details['user']``
    snapshot captured at login time, so the row still renders rather than going blank.

    Returns a list of dicts (keyed by :data:`USER_SHEET_COLUMNS`), sorted by division then name.
    """
    if user_lookup is None:
        user_lookup = build_user_attribution_lookup(session)

    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=lookback_days)
    # Column-only and streamed, for the same memory reasons as aggregate_events above.
    stmt = (
        select(OpsEvent.created_on, OpsEvent.event_type, OpsEvent.created_by, OpsEvent.event_details)
        .where(
            OpsEvent.created_on >= cutoff,
            OpsEvent.event_status == OpsEventStatus.SUCCESS,
            OpsEvent.event_type == OpsEventType.LOGIN_ATTEMPT,
        )
        .execution_options(yield_per=EVENT_STREAM_BATCH_SIZE)
    )
    events = session.execute(stmt)

    # Per actor: sign-in count, most recent sign-in, and the login-time identity snapshot (used
    # only as a fallback when the actor is no longer in the live user table).
    counts: Counter[int] = Counter()
    last_sign_in: dict[int, datetime] = {}
    snapshots: dict[int, dict] = {}

    skipped = 0
    for event in events:
        if event.created_on is None:
            continue
        actor_id = resolve_actor_id(event)
        if actor_id is None:
            skipped += 1
            continue
        counts[actor_id] += 1
        if actor_id not in last_sign_in or event.created_on > last_sign_in[actor_id]:
            last_sign_in[actor_id] = event.created_on
        details = event.event_details or {}
        user_snapshot = details.get("user") if isinstance(details, dict) else None
        if isinstance(user_snapshot, dict):
            snapshots[actor_id] = user_snapshot

    if skipped:
        logger.info(f"Skipped {skipped:,} successful login row(s) with no resolvable actor id.")

    rows: list[dict] = []
    for actor_id, count in counts.items():
        attribution = user_lookup.get(actor_id)
        snapshot = snapshots.get(actor_id, {})
        if attribution is not None:
            name = attribution["full_name"] or snapshot.get("full_name")
            email = attribution["email"] or snapshot.get("email")
            division = attribution["division"]
            roles = ", ".join(attribution["roles"])
        else:
            # Actor no longer in the live user table -- use the login-time snapshot.
            name = snapshot.get("full_name")
            email = snapshot.get("email")
            division = UNKNOWN
            roles = UNKNOWN
        rows.append(
            {
                "name": name,
                "email": email,
                "division": division,
                "roles": roles,
                "sign_in_count": count,
                "last_sign_in_utc": last_sign_in[actor_id].isoformat(),
            }
        )

    rows.sort(key=lambda r: ((r["division"] or ""), (r["name"] or ""), (r["email"] or "")))
    return rows


def _force_text_cells(cells) -> None:
    """Stop openpyxl from reinterpreting user-supplied strings as formulas.

    Assigning a string that begins with ``=`` makes openpyxl write the cell as a formula, so a user
    whose name or email starts with ``=`` renders in Excel as ``#NAME?`` instead of their name --
    the per-user sheet silently misreports who signed in. Re-asserting the type as a string keeps
    the literal text. The leading characters Excel also treats as formula starters (``+``, ``-``,
    ``@``) are included, since the same data reaches spreadsheets other than Excel.
    """
    for cell in cells:
        if isinstance(cell.value, str) and cell.value.startswith(("=", "+", "-", "@")):
            # Assigning .value is what infers the type, so the override has to come after it --
            # here the value is already set, so reasserting data_type is enough and it survives a
            # save/load round trip.
            cell.data_type = "s"


def build_workbook(counts: dict[tuple[str, str, str], dict[str, int]], user_rows: list[dict]) -> bytes:
    """Render the aggregate counts and per-user sign-ins into a two-sheet ``.xlsx`` (as bytes).

    Sheet "Aggregate" holds one row per date x division x role. Sheet "Per-user" lists one row
    per user who signed in during the window. Written with openpyxl directly (no pandas) to keep
    the job's memory footprint small.
    """
    wb = Workbook()

    aggregate_sheet = wb.active
    aggregate_sheet.title = "Aggregate"
    aggregate_sheet.append(AGGREGATE_COLUMNS)
    for date_iso, division, role in sorted(counts.keys()):
        bucket = counts[(date_iso, division, role)]
        aggregate_sheet.append([date_iso, division, role] + [bucket[metric] for metric in METRIC_COLUMNS])

    user_sheet = wb.create_sheet("Per-user")
    user_sheet.append(USER_SHEET_COLUMNS)
    for row in user_rows:
        user_sheet.append([row[column] for column in USER_SHEET_COLUMNS])
        _force_text_cells(user_sheet[user_sheet.max_row])

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()


def parse_lookback_days(lookback_days: str) -> int:
    """Validate and convert the configured lookback-days value to a positive int.

    A non-positive window (``0`` or negative) yields a cutoff at/after ``now`` that matches no
    historical rows, so the job would silently upload an empty report. Fail fast instead.
    """
    try:
        days = int(lookback_days)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid usage_metrics_lookback_days value: {lookback_days!r}. Must be an integer.") from e
    if days <= 0:
        raise ValueError(f"usage_metrics_lookback_days must be > 0, got {days}.")
    return days


def parse_sprint_anchor_date(anchor_date: str) -> date:
    """Validate and convert the configured sprint-anchor value to a ``date``.

    The anchor identifies which Fridays end a sprint. A non-Friday anchor would shift every
    scheduled run off the Friday the cron fires on -- the report would then never generate -- so
    that is rejected here rather than silently producing a job that no-ops forever.
    """
    try:
        anchor = date.fromisoformat(anchor_date.strip())
    except (AttributeError, TypeError, ValueError) as e:
        raise ValueError(
            f"Invalid usage_metrics_sprint_anchor_date value: {anchor_date!r}. Must be an ISO date, e.g. 2026-09-11."
        ) from e
    if anchor.weekday() != FRIDAY:
        raise ValueError(
            f"usage_metrics_sprint_anchor_date must be a Friday (a sprint-end date), got {anchor.isoformat()} "
            f"({anchor.strftime('%A')})."
        )
    return anchor


def effective_run_date(now_utc: datetime) -> date:
    """Return the date this run should be attributed to, tolerating a start just after midnight.

    The cron fires at 23:50 UTC Friday, leaving only ten minutes before the UTC date rolls over to
    Saturday. A container cold start, a slow image pull, or a replica retry can easily cross that
    boundary -- and ``is_sprint_end`` would then see a Saturday, skip the run as "not a sprint-end
    Friday", and exit 0. That failure is near-invisible (the execution still reports Succeeded) and
    costs a whole sprint: the next run's 14-day window does not reach back far enough to recover the
    missed days, so that activity never appears in any report.

    Subtracting a grace period before taking the date maps those just-after-midnight starts back
    onto the Friday the cron intended, and cannot misclassify an on-time run: 23:50 minus the grace
    is still the same Friday. It also keeps the dated blob name aligned with the sprint-end date.
    """
    return (now_utc - RUN_DATE_GRACE).date()


def is_sprint_end(today: date, anchor: date) -> bool:
    """Return whether ``today`` is the last Friday of a sprint, counting from ``anchor``.

    Sprint ends fall every ``SPRINT_LENGTH_DAYS`` from the anchor in both directions, so this holds
    for dates before the anchor too (Python's ``%`` is non-negative for a positive modulus). Since
    the anchor is validated as a Friday and the period is a whole number of weeks, a date matching
    this is necessarily a Friday.
    """
    return (today - anchor).days % SPRINT_LENGTH_DAYS == 0


def should_generate_report(config: DataToolsConfig, today: date) -> bool:
    """Return whether this run should generate a report.

    The job's cron fires every Friday but the report is wanted only on the last Friday of each
    two-week sprint, so off-sprint runs are skipped here. ``usage_metrics_force_run`` bypasses the
    check for local runs and for test-firing the scheduled job off-schedule.
    """
    if config.usage_metrics_force_run:
        logger.info("usage_metrics_force_run is set; generating report regardless of the sprint schedule.")
        return True

    anchor = parse_sprint_anchor_date(config.usage_metrics_sprint_anchor_date)
    if is_sprint_end(today, anchor):
        return True

    next_end = today + timedelta(days=-(today - anchor).days % SPRINT_LENGTH_DAYS)
    logger.info(
        f"{today.isoformat()} is not a sprint-end Friday (anchor {anchor.isoformat()}, "
        f"next sprint end {next_end.isoformat()}); skipping this run."
    )
    return False


def deliver_report_link(config: DataToolsConfig, account_url: str, container: str, blob_name: str) -> None:
    """Email a time-limited SAS download link for ``blob_name`` to the UX team.

    No-ops (with a log line) unless email delivery is fully configured -- ACS connection string,
    sender, at least one recipient, and the storage account key that signs the link. This keeps
    local/dev runs from attempting to send mail while letting the same code path light up in an
    environment that has ACS wired.

    Both secrets this needs -- the storage account key that signs the SAS and the ACS connection
    string that authenticates the send -- are injected as Container App secrets by the
    ``deployments/usage-metrics`` Terraform stack, so the job needs no Key Vault access at run time.
    The link points at the dated report blob so each sprint's email references that sprint's specific
    report, and it stays valid for ``usage_metrics_sas_expiry_days`` days.
    """
    connection_string = config.acs_connection_string
    sender = config.email_sender_address
    recipients = parse_recipients(config.usage_metrics_email_recipients)
    account_key = config.file_storage_account_key

    if not (connection_string and sender and recipients and account_key):
        # warning rather than info: by the time this runs the report is already in Blob storage, so
        # this is the only signal that a *misconfigured* environment silently sent nothing. An
        # environment with no recipients configured is expected to land here on every run.
        logger.warning(
            "Email delivery not fully configured (connection string/sender/recipients/storage key); "
            "skipping report email. The report itself was still uploaded."
        )
        return

    try:
        expiry_days = int(config.usage_metrics_sas_expiry_days)
    except (TypeError, ValueError) as e:
        raise ValueError(
            f"Invalid usage_metrics_sas_expiry_days value: {config.usage_metrics_sas_expiry_days!r}. "
            "Must be an integer."
        ) from e
    if expiry_days <= 0:
        raise ValueError(f"usage_metrics_sas_expiry_days must be > 0, got {expiry_days}.")

    download_url = build_blob_sas_url(account_url, container, blob_name, account_key, expiry_days)

    send_report_link_email(connection_string, sender, recipients, download_url, expiry_days)


def run_usage_metrics(conn: sqlalchemy.engine.Engine, config: DataToolsConfig) -> bytes | None:
    """Generate the usage report and deliver it (Blob upload or local file).

    Produces a single two-sheet **.xlsx** per sprint: an "Aggregate" sheet (per-day x division x
    role counts) and a "Per-user" sign-in sheet. When ``usage_metrics_storage_account_url`` is set
    (remote/azure), the workbook is uploaded to Blob storage as both a dated file (trend history)
    and a ``-latest`` file (a stable link) -- two blobs total. Otherwise (local/dev/pytest) it is
    written to the working directory.

    The scheduled job's cron fires every Friday; on the Fridays that do not end a sprint this
    returns ``None`` without touching the database or Blob storage. Otherwise returns the generated
    workbook bytes.
    """
    today_utc = effective_run_date(datetime.now(timezone.utc))
    if not should_generate_report(config, today_utc):
        return None

    # Read the upload target before the expensive work: AzureConfig raises when it is unset, and
    # discovering that after a full aggregation pass and workbook build wastes the whole run.
    account_url = config.usage_metrics_storage_account_url

    lookback_days = parse_lookback_days(config.usage_metrics_lookback_days)
    with Session(conn) as session:
        # Built once and shared: both passes need the same user/division/role attribution, and it
        # loads every user with their roles eagerly, so doing it twice doubles that cost for nothing.
        user_lookup = build_user_attribution_lookup(session)
        counts = aggregate_events(session, lookback_days, user_lookup)
        user_rows = aggregate_user_sign_ins(session, lookback_days, user_lookup)
    logger.info(
        f"Aggregated into {len(counts):,} date x division x role row(s) and "
        f"{len(user_rows):,} per-user sign-in row(s)."
    )
    workbook_bytes = build_workbook(counts, user_rows)

    today = today_utc.isoformat()
    prefix = config.usage_metrics_report_prefix
    dated_xlsx_blob = f"{prefix}/usage-metrics-{today}.xlsx"
    latest_xlsx_blob = f"{prefix}/usage-metrics-latest.xlsx"

    if account_url:
        container = config.usage_metrics_container_name
        logger.info(f"Uploading usage report to {account_url}/{container}.")
        upload_blob(account_url, container, dated_xlsx_blob, workbook_bytes, content_type=XLSX_CONTENT_TYPE)
        upload_blob(account_url, container, latest_xlsx_blob, workbook_bytes, content_type=XLSX_CONTENT_TYPE)
        logger.info(f"Uploaded usage report workbook ({latest_xlsx_blob}).")
        # Email the UX team a download link to this sprint's dated report (no-ops unless ACS is set).
        deliver_report_link(config, account_url, container, dated_xlsx_blob)
    else:
        local_xlsx_path = f"usage-metrics-{today}.xlsx"
        with open(local_xlsx_path, "wb") as f:
            f.write(workbook_bytes)
        logger.info(f"No storage account configured; wrote usage report to {local_xlsx_path}.")

    return workbook_bytes


if __name__ == "__main__":
    logger.info("Starting Usage Metrics report process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    run_usage_metrics(db_engine, script_config)

    logger.info("Usage Metrics report process complete.")
