"""Usage metrics report job.

Aggregates existing activity data from ``ops_event`` into a per-day x division x role
usage report (counts only -- no per-user rows, no IP addresses) and uploads it to Azure
Blob Storage for the UX team.

Follows the ``cleanup_user_sessions`` template: ``__main__`` -> ``get_config(ENV)`` ->
``init_db_from_config`` -> run, with loguru logging.

Attribution / counting notes (see the #4148 plan for the full rationale):
- **Only SUCCESS events are counted.** A failed/aborted request still persists an OpsEvent
  (``OpsEventHandler.__exit__`` sets ``event_status = FAILED`` but keeps the event_type), so
  counting all rows would inflate every metric with attempts that never took effect. Events
  whose ``event_status`` is not SUCCESS are skipped entirely.
- **Reporting window.** Only rows whose ``created_on`` falls within the configured lookback
  window are aggregated, so the report is scoped to a period and does not re-read the whole
  append-only audit log on every run (bounded memory/runtime and a period-scoped CSV).
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
"""

import csv
import io
import os
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import sqlalchemy
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from data_tools.environment.types import DataToolsConfig
from data_tools.src.azure_utils.utils import upload_blob
from data_tools.src.common.db import init_db_from_config
from data_tools.src.common.utils import get_config
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
logger.add(
    sys.stderr, format=format, level="INFO", filter=lambda record: ("SafeUserSchema not found" not in record["message"])
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

# Event types that map to a single count column. deactivated_users is handled separately
# because it depends on the UPDATE_USER payload, not just the event type.
EVENT_TYPE_TO_METRIC = {
    OpsEventType.LOGOUT: "logouts",
    OpsEventType.IDLE_LOGOUT: "idle_logouts",
    OpsEventType.CREATE_USER: "new_users",
    OpsEventType.CREATE_NEW_AGREEMENT: "agreements_edited",
    OpsEventType.UPDATE_AGREEMENT: "agreements_edited",
    OpsEventType.DELETE_AGREEMENT: "agreements_edited",
    OpsEventType.GET_AGREEMENT: "agreements_viewed",
    OpsEventType.CREATE_BLI: "blis_created",
    OpsEventType.CREATE_PROJECT: "projects_created",
}

# Ordered CSV columns. Count metrics come after the breakdown dimensions.
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
CSV_COLUMNS = ["date", "division", "role"] + METRIC_COLUMNS


def build_user_attribution_lookup(session: Session) -> dict[int, dict]:
    """Build a ``user_id -> {division, roles}`` lookup for actor attribution.

    Division resolves to the division ``name`` (or ``UNKNOWN`` when a user has no division);
    roles is a tuple of role names (or ``(UNKNOWN,)`` when a user has none).
    """
    division_names = {d.id: d.name for d in session.execute(select(Division)).scalars().all()}

    lookup: dict[int, dict] = {}
    # selectinload avoids an N+1 lazy load of user.roles (one query per user).
    users = session.execute(select(User).options(selectinload(User.roles))).scalars().all()
    for user in users:
        division = division_names.get(user.division, UNKNOWN) if user.division is not None else UNKNOWN
        roles = tuple(role.name for role in user.roles) or (UNKNOWN,)
        lookup[user.id] = {"division": division, "roles": roles}
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
    ``UPDATE_USER`` whose request payload sets ``status`` to INACTIVE/LOCKED.
    """
    if event.event_type != OpsEventType.UPDATE_USER:
        return False
    details = event.event_details or {}
    payload = details.get("request.json") if isinstance(details, dict) else None
    if not isinstance(payload, dict):
        return False
    status = payload.get("status")
    return status in (UserStatus.INACTIVE.name, UserStatus.LOCKED.name)


def _new_counts() -> dict[str, int]:
    return {metric: 0 for metric in METRIC_COLUMNS}


def aggregate_events(session: Session, lookback_days: int) -> dict[tuple[str, str, str], dict[str, int]]:
    """Aggregate ``ops_event`` rows into per-(date, division, role) count buckets.

    Only rows created within the last ``lookback_days`` (a UTC-naive cutoff, matching the naive
    ``created_on`` timestamps) and with ``event_status == SUCCESS`` are counted.

    Returns a mapping of ``(date_iso, division, role) -> {metric: count}``.
    """
    user_lookup = build_user_attribution_lookup(session)

    counts: dict[tuple[str, str, str], dict[str, int]] = defaultdict(_new_counts)
    # Distinct actors per bucket for the active_users metric.
    active_users: dict[tuple[str, str, str], set[int]] = defaultdict(set)

    # created_on is a naive TIMESTAMP written in the DB's (UTC) session tz, so compare against a
    # naive-UTC cutoff. This scopes the scan to the reporting window instead of the whole table.
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=lookback_days)
    stmt = select(OpsEvent).where(
        OpsEvent.created_on >= cutoff,
        OpsEvent.event_status == OpsEventStatus.SUCCESS,
    )
    events = session.execute(stmt).scalars().all()
    logger.info(f"Aggregating {len(events):,} successful ops_event row(s) since {cutoff.date().isoformat()}.")

    for event in events:
        if event.created_on is None:
            continue
        date_iso = event.created_on.date().isoformat()
        actor_id = resolve_actor_id(event)
        attribution = user_lookup.get(actor_id, UNKNOWN_ATTRIBUTION) if actor_id is not None else UNKNOWN_ATTRIBUTION

        # A multi-role user is counted once per role (fan-out); see module docstring.
        for role in attribution["roles"]:
            key = (date_iso, attribution["division"], role)

            if event.event_type == OpsEventType.LOGIN_ATTEMPT:
                # Only SUCCESS rows reach here, so every LOGIN_ATTEMPT is a completed login.
                counts[key]["logins"] += 1
            else:
                metric = EVENT_TYPE_TO_METRIC.get(event.event_type)
                if metric is not None:
                    counts[key][metric] += 1

            if is_deactivating_update(event):
                counts[key]["deactivated_users"] += 1

            if event.event_type in ACTIVE_USER_EVENT_TYPES and actor_id is not None:
                active_users[key].add(actor_id)

    # Fold the distinct-actor sets into the count buckets.
    for key, actors in active_users.items():
        counts[key]["active_users"] = len(actors)

    return counts


def build_csv(counts: dict[tuple[str, str, str], dict[str, int]]) -> str:
    """Render aggregated counts to a CSV string (one row per date x division x role)."""
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=CSV_COLUMNS)
    writer.writeheader()

    for date_iso, division, role in sorted(counts.keys()):
        row = {"date": date_iso, "division": division, "role": role}
        row.update(counts[(date_iso, division, role)])
        writer.writerow(row)

    return buffer.getvalue()


def generate_report_csv(session: Session, lookback_days: int) -> str:
    """Aggregate events within the reporting window and return the usage report as a CSV string."""
    counts = aggregate_events(session, lookback_days)
    logger.info(f"Aggregated into {len(counts):,} date x division x role row(s).")
    return build_csv(counts)


def parse_lookback_days(lookback_days: str) -> int:
    """Validate and convert the configured lookback-days value to an int."""
    try:
        return int(lookback_days)
    except (TypeError, ValueError) as e:
        raise ValueError(f"Invalid usage_metrics_lookback_days value: {lookback_days!r}. Must be an integer.") from e


def run_usage_metrics(conn: sqlalchemy.engine.Engine, config: DataToolsConfig) -> str:
    """Generate the usage report and deliver it (Blob upload or local file).

    When ``usage_metrics_storage_account_url`` is set (remote/azure), the CSV is uploaded to
    Blob storage as both a dated file (trend history) and ``usage-metrics-latest.csv`` (a stable
    link). Otherwise (local/dev/pytest) it is written to the working directory for inspection.

    Returns the generated CSV string.
    """
    lookback_days = parse_lookback_days(config.usage_metrics_lookback_days)
    with Session(conn) as session:
        csv_string = generate_report_csv(session, lookback_days)

    today = datetime.now(timezone.utc).date().isoformat()
    prefix = config.usage_metrics_report_prefix
    dated_blob = f"{prefix}/usage-metrics-{today}.csv"
    latest_blob = f"{prefix}/usage-metrics-latest.csv"

    account_url = config.usage_metrics_storage_account_url
    if account_url:
        container = config.usage_metrics_container_name
        data = csv_string.encode("utf-8")
        logger.info(f"Uploading usage report to {account_url}/{container}.")
        upload_blob(account_url, container, dated_blob, data)
        upload_blob(account_url, container, latest_blob, data)
        logger.info(f"Uploaded usage report to {dated_blob} and {latest_blob}.")
    else:
        local_path = f"usage-metrics-{today}.csv"
        with open(local_path, "w", newline="") as f:
            f.write(csv_string)
        logger.info(f"No storage account configured; wrote usage report to {local_path}.")

    return csv_string


if __name__ == "__main__":
    logger.info("Starting Usage Metrics report process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    run_usage_metrics(db_engine, script_config)

    logger.info("Usage Metrics report process complete.")
