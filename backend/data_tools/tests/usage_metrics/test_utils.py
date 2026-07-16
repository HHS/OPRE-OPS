import csv
import io
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest
from sqlalchemy import text

from data_tools.src.usage_metrics.utils import (
    aggregate_events,
    build_csv,
    generate_report_csv,
    is_deactivating_update,
    parse_lookback_days,
    resolve_actor_id,
    run_usage_metrics,
)
from models import Division, OpsEvent, OpsEventStatus, OpsEventType, Role, User, UserStatus

# Wide window for the counting tests; a couple of tests override it to exercise the boundary.
LOOKBACK_DAYS = 30

# ---------------------------------------------------------------------------
# Pure-unit tests for the attribution helpers (no DB).
# ---------------------------------------------------------------------------


def _event(event_type, *, created_by=None, event_details=None, event_status=OpsEventStatus.SUCCESS):
    ev = OpsEvent(
        event_type=event_type,
        event_status=event_status,
        created_by=created_by,
        event_details=event_details,
    )
    return ev


def test_resolve_actor_id_uses_created_by_for_non_login_events():
    ev = _event(OpsEventType.GET_AGREEMENT, created_by=42)
    assert resolve_actor_id(ev) == 42


def test_resolve_actor_id_reads_login_actor_from_event_details():
    ev = _event(
        OpsEventType.LOGIN_ATTEMPT,
        created_by=None,
        event_details={"user": {"id": 7}},
    )
    assert resolve_actor_id(ev) == 7


def test_resolve_actor_id_returns_none_for_failed_login_without_user_key():
    # FAILED login rows have no "user" key in event_details.
    ev = _event(
        OpsEventType.LOGIN_ATTEMPT,
        created_by=None,
        event_details={"error_message": "bad token"},
        event_status=OpsEventStatus.FAILED,
    )
    assert resolve_actor_id(ev) is None


def test_resolve_actor_id_tolerates_missing_event_details():
    ev = _event(OpsEventType.LOGIN_ATTEMPT, created_by=None, event_details=None)
    assert resolve_actor_id(ev) is None


def test_is_deactivating_update_true_for_status_inactive():
    ev = _event(OpsEventType.UPDATE_USER, created_by=1, event_details={"request.json": {"status": "INACTIVE"}})
    assert is_deactivating_update(ev) is True


def test_is_deactivating_update_true_for_status_locked():
    ev = _event(OpsEventType.UPDATE_USER, created_by=1, event_details={"request.json": {"status": "LOCKED"}})
    assert is_deactivating_update(ev) is True


def test_is_deactivating_update_false_for_other_status_change():
    ev = _event(OpsEventType.UPDATE_USER, created_by=1, event_details={"request.json": {"status": "ACTIVE"}})
    assert is_deactivating_update(ev) is False


def test_is_deactivating_update_false_for_non_update_user_event():
    ev = _event(OpsEventType.CREATE_USER, created_by=1, event_details={"request.json": {"status": "INACTIVE"}})
    assert is_deactivating_update(ev) is False


def test_is_deactivating_update_tolerates_missing_payload():
    ev = _event(OpsEventType.UPDATE_USER, created_by=1, event_details={})
    assert is_deactivating_update(ev) is False


def test_is_deactivating_update_matches_userstatus_enum_names():
    # The status literals are derived from the UserStatus enum, not hardcoded strings.
    for status in (UserStatus.INACTIVE, UserStatus.LOCKED):
        ev = _event(OpsEventType.UPDATE_USER, created_by=1, event_details={"request.json": {"status": status.name}})
        assert is_deactivating_update(ev) is True


def test_parse_lookback_days_valid():
    assert parse_lookback_days("7") == 7


def test_parse_lookback_days_invalid_raises():
    with pytest.raises(ValueError):
        parse_lookback_days("not-a-number")


# ---------------------------------------------------------------------------
# build_csv shape.
# ---------------------------------------------------------------------------


def test_build_csv_header_and_sorted_rows():
    counts = {
        ("2026-07-06", "OD", "role_a"): {
            "active_users": 2,
            "logins": 3,
            "logouts": 1,
            "idle_logouts": 0,
            "new_users": 0,
            "deactivated_users": 0,
            "agreements_edited": 4,
            "agreements_viewed": 5,
            "blis_created": 1,
            "projects_created": 0,
        },
        ("2026-07-05", "DFCD", "role_b"): {
            "active_users": 1,
            "logins": 1,
            "logouts": 0,
            "idle_logouts": 1,
            "new_users": 1,
            "deactivated_users": 1,
            "agreements_edited": 0,
            "agreements_viewed": 0,
            "blis_created": 0,
            "projects_created": 2,
        },
    }
    result = build_csv(counts)
    rows = list(csv.DictReader(io.StringIO(result)))

    assert rows[0]["date"] == "2026-07-05"  # sorted ascending
    assert rows[1]["date"] == "2026-07-06"
    assert rows[0]["division"] == "DFCD"
    assert rows[0]["role"] == "role_b"
    assert rows[1]["agreements_viewed"] == "5"
    # Columns present and ordered.
    header = result.splitlines()[0]
    expected_header = ",".join(
        [
            "date",
            "division",
            "role",
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
    )
    assert header == expected_header


# ---------------------------------------------------------------------------
# Integration tests against a real DB (loaded_db, SAVEPOINT-isolated).
# ---------------------------------------------------------------------------


@pytest.fixture()
def seeded_db(loaded_db):
    """Seed a division, role, users, and ops_event rows with explicit created_on.

    The request-time OpsEventHandler does NOT run in tests, so created_by / event_details /
    created_on must be set explicitly on each seeded row. Timestamps are relative to now (naive
    UTC) so the reporting-window filter includes them regardless of the calendar date the test
    runs on.
    """
    division = Division(id=900, name="Test Division", abbreviation="TD")
    loaded_db.merge(division)

    role = Role(id=900, name="analyst")
    loaded_db.merge(role)
    loaded_db.commit()

    role = loaded_db.get(Role, 900)
    user_a = User(id=9001, email="a@example.com", division=900, status=UserStatus.ACTIVE, roles=[role])
    user_b = User(id=9002, email="b@example.com", division=900, status=UserStatus.ACTIVE, roles=[role])
    loaded_db.add_all([user_a, user_b])
    loaded_db.commit()

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    day1 = now - timedelta(days=3)
    day2 = now - timedelta(days=2)

    events = [
        # Two distinct viewers on day1 -> active_users = 2, agreements_viewed = 2.
        _event(OpsEventType.GET_AGREEMENT, created_by=9001),
        _event(OpsEventType.GET_AGREEMENT, created_by=9002),
        # Successful login on day1 -> logins = 1 (actor from event_details, created_by NULL).
        _event(OpsEventType.LOGIN_ATTEMPT, created_by=None, event_details={"user": {"id": 9001}}),
        # Failed login must be excluded (FAILED status filtered out at query time).
        _event(
            OpsEventType.LOGIN_ATTEMPT,
            created_by=None,
            event_details={"error_message": "nope"},
            event_status=OpsEventStatus.FAILED,
        ),
        # FAILED create must be excluded from blis_created (regression: previously counted).
        _event(OpsEventType.CREATE_BLI, created_by=9001, event_status=OpsEventStatus.FAILED),
        # BLI create and project create on day1 (SUCCESS).
        _event(OpsEventType.CREATE_BLI, created_by=9001),
        _event(OpsEventType.CREATE_PROJECT, created_by=9001),
        # Deactivation via UPDATE_USER on day2.
        _event(
            OpsEventType.UPDATE_USER,
            created_by=9001,
            event_details={"request.json": {"status": UserStatus.INACTIVE.name}},
        ),
    ]
    whens = [day1, day1, day1, day1, day1, day1, day1, day2]
    for ev, when in zip(events, whens, strict=True):
        ev.created_on = when
        loaded_db.add(ev)
    loaded_db.commit()

    yield loaded_db, day1.date().isoformat(), day2.date().isoformat()

    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.execute(text("DELETE FROM user_role"))
    loaded_db.execute(text("DELETE FROM user_role_version"))
    loaded_db.commit()


def test_aggregate_events_counts_by_day_division_role(seeded_db):
    db, day1_iso, day2_iso = seeded_db
    counts = aggregate_events(db, LOOKBACK_DAYS)

    day1_key = (day1_iso, "Test Division", "analyst")
    assert day1_key in counts
    day1 = counts[day1_key]
    assert day1["active_users"] == 2
    assert day1["agreements_viewed"] == 2
    assert day1["logins"] == 1  # failed login excluded
    assert day1["blis_created"] == 1  # FAILED create excluded, only the SUCCESS one counted
    assert day1["projects_created"] == 1
    assert day1["deactivated_users"] == 0

    day2_key = (day2_iso, "Test Division", "analyst")
    assert counts[day2_key]["deactivated_users"] == 1


def test_failed_events_excluded(seeded_db):
    db, _, _ = seeded_db
    counts = aggregate_events(db, LOOKBACK_DAYS)
    # Both a FAILED login and a FAILED CREATE_BLI were seeded; neither should be counted anywhere.
    assert sum(bucket["logins"] for bucket in counts.values()) == 1
    assert sum(bucket["blis_created"] for bucket in counts.values()) == 1


def test_events_outside_window_excluded(seeded_db):
    db, _, _ = seeded_db
    # All seeded events are 2-3 days old; a 1-day window excludes them all.
    counts = aggregate_events(db, 1)
    assert counts == {}


def test_utc_day_bucketing_boundary(loaded_db):
    """An event just before/after UTC midnight buckets to the correct UTC day."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    # Pick a recent day and place two events 20 minutes on either side of its UTC midnight.
    base = (now - timedelta(days=2)).date()
    before_midnight = datetime(base.year, base.month, base.day, 23, 50, 0)
    after_midnight = before_midnight + timedelta(minutes=20)  # next UTC day, 00:10

    ev1 = _event(OpsEventType.GET_AGREEMENT, created_by=None)
    ev1.created_on = before_midnight
    ev2 = _event(OpsEventType.GET_AGREEMENT, created_by=None)
    ev2.created_on = after_midnight
    loaded_db.add_all([ev1, ev2])
    loaded_db.commit()

    try:
        counts = aggregate_events(loaded_db, LOOKBACK_DAYS)
        dates = {date for (date, _div, _role) in counts.keys()}
        assert before_midnight.date().isoformat() in dates
        assert after_midnight.date().isoformat() in dates
        assert before_midnight.date() != after_midnight.date()
    finally:
        loaded_db.execute(text("DELETE FROM ops_event"))
        loaded_db.execute(text("DELETE FROM ops_event_version"))
        loaded_db.commit()


def test_generate_report_csv_produces_rows(seeded_db):
    db, day1_iso, _ = seeded_db
    result = generate_report_csv(db, LOOKBACK_DAYS)
    rows = list(csv.DictReader(io.StringIO(result)))
    day1 = next(r for r in rows if r["date"] == day1_iso and r["division"] == "Test Division")
    assert day1["active_users"] == "2"
    assert day1["agreements_viewed"] == "2"


def test_run_usage_metrics_uploads_when_storage_configured(seeded_db, mocker):
    """When a storage account URL is configured, both dated and latest blobs are uploaded."""
    db, _, _ = seeded_db
    upload_mock = mocker.patch("data_tools.src.usage_metrics.utils.upload_blob")

    config = MagicMock()
    config.usage_metrics_storage_account_url = "https://acct.blob.core.windows.net"
    config.usage_metrics_container_name = "data"
    config.usage_metrics_report_prefix = "reports"
    config.usage_metrics_lookback_days = "30"

    conn = MagicMock()
    mocker.patch("data_tools.src.usage_metrics.utils.Session").return_value.__enter__.return_value = db

    run_usage_metrics(conn, config)

    assert upload_mock.call_count == 2
    blob_names = {call.args[2] for call in upload_mock.call_args_list}
    assert any(name.startswith("reports/usage-metrics-") and name.endswith(".csv") for name in blob_names)
    assert "reports/usage-metrics-latest.csv" in blob_names
