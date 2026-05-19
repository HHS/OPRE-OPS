import pytest
from sqlalchemy import select, text

from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_agreement_missing_data.utils import (
    AgreementUpdateData,
    create_agreement_update_data,
    get_or_create_vendor,
    get_user_by_name,
    update_agreement,
    validate_data,
)
from models import *  # noqa: F403, F401


@pytest.fixture()
def db_for_agreement_missing_data(loaded_db):
    project = ResearchProject(
        id=1,
        title="Test Project",
        short_title="TP",
    )
    loaded_db.add(project)
    loaded_db.commit()

    user_1 = User(
        id=1,
        email="system.admin@localhost",
        first_name="System",
        last_name="Admin",
    )
    user_2 = User(
        id=2,
        email="jane.doe@hhs.gov",
        first_name="Jane",
        last_name="Doe",
    )
    loaded_db.add_all([user_1, user_2])
    loaded_db.commit()

    vendor_existing = Vendor(
        id=1,
        name="Existing Vendor Inc",
        active=True,
        created_by=1,
        updated_by=1,
    )
    loaded_db.add(vendor_existing)
    loaded_db.commit()

    contract = ContractAgreement(
        id=1,
        name="Test Contract",
        description=None,
        vendor_id=None,
        project_officer_id=None,
        project_id=1,
        created_by=1,
        updated_by=1,
    )
    contract_with_data = ContractAgreement(
        id=2,
        name="Contract With Existing Data",
        description="Already set",
        vendor_id=1,
        project_officer_id=2,
        project_id=1,
        created_by=1,
        updated_by=1,
    )
    loaded_db.add_all([contract, contract_with_data])
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM agreement_history"))
    loaded_db.execute(text("DELETE FROM agreement_history_version"))
    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM vendor"))
    loaded_db.execute(text("DELETE FROM vendor_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


# --- Dataclass / parsing tests ---


def test_create_agreement_update_data_all_fields():
    row = {
        "agreement_id": "42",
        "agreement_description": " Some description ",
        "agreement_vendor": " Acme Corp ",
        "agreement_project_officer": " Jane Doe ",
    }
    data = create_agreement_update_data(row)
    assert data.agreement_id == 42
    assert data.agreement_description == "Some description"
    assert data.agreement_vendor == "Acme Corp"
    assert data.agreement_project_officer == "Jane Doe"


def test_create_agreement_update_data_empty_optional_fields():
    row = {
        "agreement_id": "10",
        "agreement_description": "",
        "agreement_vendor": "  ",
        "agreement_project_officer": "",
    }
    data = create_agreement_update_data(row)
    assert data.agreement_id == 10
    assert data.agreement_description is None
    assert data.agreement_vendor is None
    assert data.agreement_project_officer is None


def test_agreement_update_data_missing_id():
    with pytest.raises(ValueError):
        AgreementUpdateData(agreement_id="")


def test_validate_data_valid():
    data = AgreementUpdateData(agreement_id=1)
    assert validate_data(data) is True


# --- Vendor lookup / creation ---


def test_get_or_create_vendor_found(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)
    vendor = get_or_create_vendor("Existing Vendor Inc", sys_user, db_for_agreement_missing_data)
    assert vendor.id == 1
    assert vendor.name == "Existing Vendor Inc"


def test_get_or_create_vendor_case_insensitive(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)
    vendor = get_or_create_vendor("existing vendor inc", sys_user, db_for_agreement_missing_data)
    assert vendor.id == 1


def test_get_or_create_vendor_creates_new(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)
    vendor = get_or_create_vendor("Brand New Vendor", sys_user, db_for_agreement_missing_data)
    db_for_agreement_missing_data.commit()
    assert vendor.id is not None
    assert vendor.name == "Brand New Vendor"
    assert vendor.active is True

    found = db_for_agreement_missing_data.execute(
        select(Vendor).where(Vendor.name == "Brand New Vendor")
    ).scalar_one_or_none()
    assert found is not None


# --- User lookup ---


def test_get_user_by_name_found(db_for_agreement_missing_data):
    user = get_user_by_name("Jane Doe", db_for_agreement_missing_data)
    assert user is not None
    assert user.id == 2


def test_get_user_by_name_case_insensitive(db_for_agreement_missing_data):
    user = get_user_by_name("jane doe", db_for_agreement_missing_data)
    assert user is not None
    assert user.id == 2


def test_get_user_by_name_not_found(db_for_agreement_missing_data):
    user = get_user_by_name("No Body", db_for_agreement_missing_data)
    assert user is None


# --- update_agreement ---


def test_update_agreement_all_fields(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)

    data = AgreementUpdateData(
        agreement_id=1,
        agreement_description="New description",
        agreement_vendor="Existing Vendor Inc",
        agreement_project_officer="Jane Doe",
    )

    update_agreement(data, sys_user, db_for_agreement_missing_data)

    agreement = db_for_agreement_missing_data.get(Agreement, 1)
    assert agreement.description == "New description"
    assert agreement.vendor_id == 1
    assert agreement.project_officer_id == 2

    ops_events = (
        db_for_agreement_missing_data.execute(
            select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_AGREEMENT)
        )
        .scalars()
        .all()
    )
    assert len(ops_events) >= 1


def test_update_agreement_description_only(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)

    data = AgreementUpdateData(
        agreement_id=1,
        agreement_description="Only description updated",
        agreement_vendor=None,
        agreement_project_officer=None,
    )

    update_agreement(data, sys_user, db_for_agreement_missing_data)

    agreement = db_for_agreement_missing_data.get(Agreement, 1)
    assert agreement.description == "Only description updated"
    assert agreement.vendor_id is None
    assert agreement.project_officer_id is None


def test_update_agreement_no_changes_needed(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)

    # Agreement 2 already has description="Already set", vendor_id=100, project_officer_id=2
    data = AgreementUpdateData(
        agreement_id=2,
        agreement_description="Already set",
        agreement_vendor="Existing Vendor Inc",
        agreement_project_officer="Jane Doe",
    )

    update_agreement(data, sys_user, db_for_agreement_missing_data)

    # No OpsEvent should be created since nothing changed
    ops_events = (
        db_for_agreement_missing_data.execute(
            select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_AGREEMENT)
        )
        .scalars()
        .all()
    )
    assert len(ops_events) == 0


def test_update_agreement_vendor_not_found_creates_new(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)

    data = AgreementUpdateData(
        agreement_id=1,
        agreement_vendor="Totally New Vendor Co",
    )

    update_agreement(data, sys_user, db_for_agreement_missing_data)

    agreement = db_for_agreement_missing_data.get(Agreement, 1)
    assert agreement.vendor_id is not None

    vendor = db_for_agreement_missing_data.get(Vendor, agreement.vendor_id)
    assert vendor.name == "Totally New Vendor Co"
    assert vendor.active is True


def test_update_agreement_user_not_found_skips_officer(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)

    data = AgreementUpdateData(
        agreement_id=1,
        agreement_description="Updated desc",
        agreement_project_officer="Ghost Person",
    )

    update_agreement(data, sys_user, db_for_agreement_missing_data)

    agreement = db_for_agreement_missing_data.get(Agreement, 1)
    assert agreement.description == "Updated desc"
    assert agreement.project_officer_id is None  # still None, user not found


def test_update_agreement_not_found_skips(db_for_agreement_missing_data):
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)

    data = AgreementUpdateData(
        agreement_id=9999,
        agreement_description="Should not be set",
    )

    # Should not raise; just skip with a warning
    update_agreement(data, sys_user, db_for_agreement_missing_data)

    ops_events = (
        db_for_agreement_missing_data.execute(
            select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_AGREEMENT)
        )
        .scalars()
        .all()
    )
    assert len(ops_events) == 0


def test_update_agreement_vendor_trailing_whitespace(db_for_agreement_missing_data):
    """Vendor names with trailing/leading whitespace should still match via strip in __post_init__."""
    sys_user = get_or_create_sys_user(db_for_agreement_missing_data)

    data = AgreementUpdateData(
        agreement_id=1,
        agreement_vendor="  Existing Vendor Inc  ",
    )

    update_agreement(data, sys_user, db_for_agreement_missing_data)

    agreement = db_for_agreement_missing_data.get(Agreement, 1)
    assert agreement.vendor_id == 1
