import csv
from datetime import date

import pytest
from click.testing import CliRunner
from sqlalchemy import select, text

from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_award_date.utils import (
    AwardDateData,
    create_award_date_data,
    update_award_date,
    validate_data,
)
from data_tools.src.load_data import main
from models import *  # noqa: F403, F401
from models.agreement_history import AgreementHistory


def test_create_award_date_data():
    test_data = list(csv.DictReader(open("test_csv/award_date.tsv"), dialect="excel-tab"))

    assert len(test_data) == 3

    row = create_award_date_data(test_data[0])
    assert row.agreement_id == 1
    assert row.project_title == "Test Project"
    assert row.agreement_name == "Test Contract"
    assert row.agreement_type == "CONTRACT"
    assert row.award_date == date(2042, 10, 1)

    row2 = create_award_date_data(test_data[1])
    assert row2.agreement_id == 2
    assert row2.agreement_name == "Test Grant"
    assert row2.agreement_type == "GRANT"
    assert row2.award_date == date(2043, 3, 15)

    row3 = create_award_date_data(test_data[2])
    assert row3.agreement_id == 3
    assert row3.project_title == "Test Project 2"
    assert row3.agreement_name == "Test Contract Same Name"
    assert row3.award_date == date(2042, 6, 30)


def test_validate_data_valid():
    data = AwardDateData(
        agreement_name="Test Contract",
        award_date="2042-10-01",
        agreement_id=1,
        project_title="Test Project",
        agreement_type="CONTRACT",
    )
    assert validate_data(data) is True


def test_validate_data_missing_name():
    with pytest.raises(ValueError):
        AwardDateData(
            agreement_name="",
            award_date="2042-10-01",
        )


def test_validate_data_missing_date():
    with pytest.raises(ValueError):
        AwardDateData(
            agreement_name="Test Contract",
            award_date="",
        )


@pytest.fixture()
def db_for_award_date(loaded_db):
    project_1 = Project(
        id=1,
        project_type=ProjectType.RESEARCH,
        title="Test Project",
        short_title="Test Project",
    )
    project_2 = Project(
        id=2,
        project_type=ProjectType.RESEARCH,
        title="Test Project 2",
        short_title="Test Project 2",
    )
    loaded_db.add(project_1)
    loaded_db.add(project_2)
    loaded_db.commit()

    user = User(
        id=1,
        email="test.user@localhost",
    )
    loaded_db.add(user)
    loaded_db.commit()

    # Agreement 1: contract with NEW_AWARD PA, no existing date
    contract_1 = ContractAgreement(
        id=1,
        name="Test Contract",
        project_id=1,
        created_by=1,
        updated_by=1,
    )
    # Agreement 2: grant with NEW_AWARD PA, no existing date
    grant = GrantAgreement(
        id=2,
        name="Test Grant",
        project_id=1,
        created_by=1,
        updated_by=1,
    )
    # Agreement 3: contract in a different project with NEW_AWARD PA, no existing date
    contract_2 = ContractAgreement(
        id=3,
        name="Test Contract Same Name",
        project_id=2,
        created_by=1,
        updated_by=1,
    )
    # Agreement 4: contract with NEW_AWARD PA that already has a date (for overwrite test)
    contract_3 = ContractAgreement(
        id=4,
        name="Test Contract With Date",
        project_id=1,
        created_by=1,
        updated_by=1,
    )
    # Agreement 5: contract with NO procurement action (for skip test)
    contract_no_pa = ContractAgreement(
        id=5,
        name="Test Contract No PA",
        project_id=1,
        created_by=1,
        updated_by=1,
    )
    loaded_db.add_all([contract_1, grant, contract_2, contract_3, contract_no_pa])
    loaded_db.commit()

    pa_1 = ProcurementAction(
        agreement_id=1,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.AWARDED,
        date_awarded_obligated=None,
        created_by=1,
        updated_by=1,
    )
    pa_2 = ProcurementAction(
        agreement_id=2,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.AWARDED,
        date_awarded_obligated=None,
        created_by=1,
        updated_by=1,
    )
    pa_3 = ProcurementAction(
        agreement_id=3,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.CERTIFIED,
        date_awarded_obligated=None,
        created_by=1,
        updated_by=1,
    )
    pa_4 = ProcurementAction(
        agreement_id=4,
        award_type=AwardType.NEW_AWARD,
        status=ProcurementActionStatus.AWARDED,
        date_awarded_obligated=date(2040, 1, 1),
        created_by=1,
        updated_by=1,
    )
    loaded_db.add_all([pa_1, pa_2, pa_3, pa_4])
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM agreement_history"))
    loaded_db.execute(text("DELETE FROM agreement_history_version"))
    loaded_db.execute(text("DELETE FROM procurement_action"))
    loaded_db.execute(text("DELETE FROM procurement_action_version"))
    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM grant_agreement"))
    loaded_db.execute(text("DELETE FROM grant_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_update_award_date(db_for_award_date):
    """Test setting award date on a contract with no existing date."""
    sys_user = get_or_create_sys_user(db_for_award_date)

    data = AwardDateData(
        agreement_name="Test Contract",
        award_date="2042-10-01",
        agreement_id=1,
        project_title="Test Project",
        agreement_type="CONTRACT",
    )

    update_award_date(data, sys_user, db_for_award_date)

    procurement_action = db_for_award_date.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 1,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar()

    assert procurement_action.date_awarded_obligated == date(2042, 10, 1)

    # Verify ops_db_history record was created
    history_objs = (
        db_for_award_date.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "ProcurementAction"))
        .scalars()
        .all()
    )
    assert len(history_objs) >= 1

    # Verify OpsEvent was created
    ops_events = (
        db_for_award_date.execute(select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_AGREEMENT))
        .scalars()
        .all()
    )
    assert len(ops_events) >= 1


def test_update_award_date_creates_agreement_history(db_for_award_date):
    """Test that updating an award date creates an AgreementHistory entry."""
    sys_user = get_or_create_sys_user(db_for_award_date)

    data = AwardDateData(
        agreement_name="Test Contract",
        award_date="2042-10-01",
        agreement_id=1,
        project_title="Test Project",
        agreement_type="CONTRACT",
    )

    update_award_date(data, sys_user, db_for_award_date)

    history_entries = (
        db_for_award_date.execute(select(AgreementHistory).where(AgreementHistory.agreement_id_record == 1))
        .scalars()
        .all()
    )
    assert len(history_entries) >= 1

    award_date_history = [h for h in history_entries if h.history_title == "Change to Award Date"]
    assert len(award_date_history) == 1
    assert "Award Date" in award_date_history[0].history_message
    assert "10/01/2042" in award_date_history[0].history_message
    assert "None" in award_date_history[0].history_message  # old value was None


def test_update_award_date_overwrites_creates_agreement_history(db_for_award_date):
    """Test that overwriting an existing award date creates an AgreementHistory with old and new dates."""
    sys_user = get_or_create_sys_user(db_for_award_date)

    # Agreement 4 already has date_awarded_obligated = 2040-01-01
    data = AwardDateData(
        agreement_name="Test Contract With Date",
        award_date="2045-06-15",
        agreement_id=4,
        project_title="Test Project",
        agreement_type="CONTRACT",
    )

    update_award_date(data, sys_user, db_for_award_date)

    history_entries = (
        db_for_award_date.execute(select(AgreementHistory).where(AgreementHistory.agreement_id_record == 4))
        .scalars()
        .all()
    )
    award_date_history = [h for h in history_entries if h.history_title == "Change to Award Date"]
    assert len(award_date_history) == 1
    assert "01/01/2040" in award_date_history[0].history_message  # old value
    assert "06/15/2045" in award_date_history[0].history_message  # new value


def test_update_award_date_grant(db_for_award_date):
    """Test setting award date on a grant agreement."""
    sys_user = get_or_create_sys_user(db_for_award_date)

    data = AwardDateData(
        agreement_name="Test Grant",
        award_date="2043-03-15",
        agreement_id=2,
        project_title="Test Project",
        agreement_type="GRANT",
    )

    update_award_date(data, sys_user, db_for_award_date)

    procurement_action = db_for_award_date.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 2,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar()

    assert procurement_action.date_awarded_obligated == date(2043, 3, 15)


def test_update_award_date_overwrites_existing(db_for_award_date):
    """Test that an existing date_awarded_obligated is overwritten."""
    sys_user = get_or_create_sys_user(db_for_award_date)

    # Agreement 4 already has date_awarded_obligated = 2040-01-01
    data = AwardDateData(
        agreement_name="Test Contract With Date",
        award_date="2045-06-15",
        agreement_id=4,
        project_title="Test Project",
        agreement_type="CONTRACT",
    )

    update_award_date(data, sys_user, db_for_award_date)

    procurement_action = db_for_award_date.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 4,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar()

    assert procurement_action.date_awarded_obligated == date(2045, 6, 15)

    # Verify the OpsEvent captured the old value
    ops_event = db_for_award_date.execute(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_AGREEMENT)
    ).scalar()
    changes = ops_event.event_details["agreement_updates"]["changes"]["date_awarded_obligated"]
    assert changes["old_value"] == "2040-01-01"
    assert changes["new_value"] == "2045-06-15"


def test_update_award_date_agreement_not_found(db_for_award_date):
    """Test that a non-existent agreement_id is skipped without error."""
    sys_user = get_or_create_sys_user(db_for_award_date)

    data = AwardDateData(
        agreement_name="Nonexistent Agreement",
        award_date="2042-10-01",
        agreement_id=9999,
        project_title="Nonexistent Project",
        agreement_type="CONTRACT",
    )

    # Should not raise, just skip with a warning
    update_award_date(data, sys_user, db_for_award_date)

    # Verify no procurement action was modified
    procurement_action = db_for_award_date.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 1,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar()

    assert procurement_action.date_awarded_obligated is None


def test_update_award_date_no_procurement_action(db_for_award_date):
    """Test that an agreement with no NEW_AWARD PA is skipped without error."""
    sys_user = get_or_create_sys_user(db_for_award_date)

    # Agreement 5 exists but has no ProcurementAction
    data = AwardDateData(
        agreement_name="Test Contract No PA",
        award_date="2042-10-01",
        agreement_id=5,
        project_title="Test Project",
        agreement_type="CONTRACT",
    )

    # Should not raise, just skip with a warning
    update_award_date(data, sys_user, db_for_award_date)


def test_update_award_date_certified_status(db_for_award_date):
    """Test setting award date on a PA with CERTIFIED status (not just AWARDED)."""
    sys_user = get_or_create_sys_user(db_for_award_date)

    # Agreement 3 has a PA with status=CERTIFIED
    data = AwardDateData(
        agreement_name="Test Contract Same Name",
        award_date="2042-06-30",
        agreement_id=3,
        project_title="Test Project 2",
        agreement_type="CONTRACT",
    )

    update_award_date(data, sys_user, db_for_award_date)

    procurement_action = db_for_award_date.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 3,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar()

    assert procurement_action.date_awarded_obligated == date(2042, 6, 30)


def test_main(db_for_award_date):
    """Test CLI integration loading all 3 rows from the test TSV."""
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "award_date",
            "--input-csv",
            "test_csv/award_date.tsv",
        ],
    )

    assert result.exit_code == 0

    # Verify all 3 agreements had their award dates set
    pa_1 = db_for_award_date.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 1,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar()
    assert pa_1.date_awarded_obligated == date(2042, 10, 1)

    pa_2 = db_for_award_date.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 2,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar()
    assert pa_2.date_awarded_obligated == date(2043, 3, 15)

    pa_3 = db_for_award_date.execute(
        select(ProcurementAction).where(
            ProcurementAction.agreement_id == 3,
            ProcurementAction.award_type == AwardType.NEW_AWARD,
        )
    ).scalar()
    assert pa_3.date_awarded_obligated == date(2042, 6, 30)
