import pytest
from sqlalchemy import select, text

from data_tools.src.backfill_can_funding_details_history import (
    backfill_can_funding_details_history,
    get_update_can_events_with_funding_details_changes,
)
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_cans.utils import CANData, create_models
from models import *  # noqa: F403, F401


def _make_can_data(**overrides):
    """Build a fully-populated CANData, with any field overridden by kwargs."""
    defaults = dict(
        FISCAL_YEAR=2023,
        SYS_CAN_ID=500,
        CAN_NBR="G99HRF2",
        CAN_DESCRIPTION="Healthy Marriages Responsible Fatherhood - OPRE",
        FUND="AAXXXX20231DAD",
        ALLOWANCE="0000000001",
        ALLOTMENT_ORG="YZC6S1JUGUN",
        SUB_ALLOWANCE="9KRZ2ND",
        APPROP_PREFIX="XX",
        APPROP_POSTFIX="XXXX",
        APPROP_YEAR="23",
        PORTFOLIO="HMRF",
        FUNDING_SOURCE="OPRE",
        METHOD_OF_TRANSFER="DIRECT",
        NICK_NAME="HMRF-OPRE",
        FUNDING_PARTNER="partner 1",
    )
    defaults.update(overrides)
    return CANData(**defaults)


@pytest.fixture()
def db_with_missing_history(loaded_db):
    """Build two UPDATE_CAN OpsEvents via the real create_models path: one with funding_details.*
    changes (whose CANHistory rows are then deleted to simulate events recorded before
    CAN_FUNDING_DETAILS_EDITED existed), and one control event with only a nick_name change, whose
    history the backfill must leave untouched."""
    division = Division(id=999, name="Fake Division", abbreviation="FD")
    loaded_db.merge(division)
    loaded_db.commit()

    if not loaded_db.get(Portfolio, 1):
        loaded_db.add(
            Portfolio(id=1, abbreviation="HMRF", name="Healthy Marriages Responsible Fatherhood", division_id=999)
        )
    loaded_db.commit()

    sys_user = get_or_create_sys_user(loaded_db)
    if sys_user.id is None:
        loaded_db.add(sys_user)
        loaded_db.commit()

    create_models(_make_can_data(), sys_user, loaded_db)
    create_models(_make_can_data(METHOD_OF_TRANSFER="IAA"), sys_user, loaded_db)
    funding_details_event = (
        loaded_db.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_CAN)).scalars().one()
    )

    # Simulate the pre-fix production bug: this event's CANHistory rows were never created.
    loaded_db.execute(text("DELETE FROM can_history WHERE ops_event_id = :id"), {"id": funding_details_event.id})
    loaded_db.commit()

    create_models(_make_can_data(SYS_CAN_ID=600, CAN_NBR="G99NEW1"), sys_user, loaded_db)
    create_models(_make_can_data(SYS_CAN_ID=600, CAN_NBR="G99NEW1", NICK_NAME="Renamed"), sys_user, loaded_db)
    control_event = (
        loaded_db.execute(
            select(OpsEvent).where(
                OpsEvent.event_type == OpsEventType.UPDATE_CAN,
                OpsEvent.id != funding_details_event.id,
            )
        )
        .scalars()
        .one()
    )

    yield loaded_db, funding_details_event.id, control_event.id, sys_user

    loaded_db.execute(text("DELETE FROM can_history"))
    loaded_db.execute(text("DELETE FROM can_history_version"))
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.execute(text("DELETE FROM can"))
    loaded_db.execute(text("DELETE FROM can_version"))
    loaded_db.execute(text("DELETE FROM can_funding_details"))
    loaded_db.execute(text("DELETE FROM can_funding_details_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_get_events_finds_only_funding_details_events(db_with_missing_history):
    """The query should return only the UPDATE_CAN event with funding_details.* changes, not the
    control event whose changes are limited to nick_name."""
    session, funding_details_event_id, control_event_id, _ = db_with_missing_history

    events = get_update_can_events_with_funding_details_changes(session)
    event_ids = {e.id for e in events}

    assert funding_details_event_id in event_ids
    assert control_event_id not in event_ids


def test_backfill_creates_missing_history_rows(db_with_missing_history):
    """Running the backfill against an event whose CANHistory rows were deleted should recreate a
    CAN_FUNDING_DETAILS_EDITED row for it."""
    session, funding_details_event_id, _, sys_user = db_with_missing_history

    before = (
        session.execute(select(CANHistory).where(CANHistory.ops_event_id == funding_details_event_id)).scalars().all()
    )
    assert len(before) == 0

    backfill_can_funding_details_history(session, sys_user)

    after = (
        session.execute(select(CANHistory).where(CANHistory.ops_event_id == funding_details_event_id)).scalars().all()
    )
    assert len(after) == 1
    assert after[0].history_type == CANHistoryType.CAN_FUNDING_DETAILS_EDITED


def test_backfill_is_idempotent(db_with_missing_history):
    """Running the backfill twice should not create duplicate CANHistory rows, since
    add_history_events already de-duplicates against existing rows."""
    session, funding_details_event_id, _, sys_user = db_with_missing_history

    backfill_can_funding_details_history(session, sys_user)
    first_run = (
        session.execute(select(CANHistory).where(CANHistory.ops_event_id == funding_details_event_id)).scalars().all()
    )

    backfill_can_funding_details_history(session, sys_user)
    second_run = (
        session.execute(select(CANHistory).where(CANHistory.ops_event_id == funding_details_event_id)).scalars().all()
    )

    assert len(first_run) == 1
    assert len(second_run) == 1


def test_backfill_does_not_touch_unrelated_history(db_with_missing_history):
    """The control event's existing nick_name history should be untouched by the backfill."""
    session, _, control_event_id, sys_user = db_with_missing_history

    before = session.execute(select(CANHistory).where(CANHistory.ops_event_id == control_event_id)).scalars().all()
    assert len(before) == 1
    assert before[0].history_type == CANHistoryType.CAN_NICKNAME_EDITED

    backfill_can_funding_details_history(session, sys_user)

    after = session.execute(select(CANHistory).where(CANHistory.ops_event_id == control_event_id)).scalars().all()
    assert len(after) == 1
    assert after[0].id == before[0].id


def test_backfill_dry_run_creates_nothing(db_with_missing_history, monkeypatch):
    """With DRY_RUN set, the backfill should compute what it would create but roll back, leaving
    no CANHistory rows behind."""
    session, funding_details_event_id, _, sys_user = db_with_missing_history
    monkeypatch.setenv("DRY_RUN", "1")

    backfill_can_funding_details_history(session, sys_user)

    after = (
        session.execute(select(CANHistory).where(CANHistory.ops_event_id == funding_details_event_id)).scalars().all()
    )
    assert len(after) == 0
