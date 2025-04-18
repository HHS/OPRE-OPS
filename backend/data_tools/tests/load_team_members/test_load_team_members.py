from unittest.mock import patch

import pytest
from click.testing import CliRunner
from data_tools.src.load_data import main
from data_tools.src.load_team_members.utils import (
    TeamMemberData,
    create_models,
    create_team_member_data,
    validate_all,
    validate_data,
)
from sqlalchemy import select

from models import Agreement, AgreementType, ContractAgreement, GrantAgreement, OpsEvent, OpsEventType, User


@pytest.fixture()
def db_with_agreements(loaded_db):
    # Create test agreements
    agreement1 = ContractAgreement(
        id=999, name="Test Agreement 1", agreement_type=AgreementType.CONTRACT, maps_sys_id=12345
    )

    agreement2 = GrantAgreement(id=1000, name="Test Agreement 2", agreement_type=AgreementType.GRANT, maps_sys_id=67890)

    loaded_db.add_all([agreement1, agreement2])
    loaded_db.commit()

    yield loaded_db

    # Cleanup
    loaded_db.delete(agreement1)
    loaded_db.delete(agreement2)
    loaded_db.commit()


@pytest.fixture()
def db_with_users_and_agreements(db_with_agreements):
    # Create test users
    user1 = User(id=901, email="team.member1@example.com")

    user2 = User(id=902, email="team.member2@example.com")

    user3 = User(id=903, email="project.officer@example.com")

    user4 = User(id=904, email="alternate.po@example.com")

    db_with_agreements.add_all([user1, user2, user3, user4])
    db_with_agreements.commit()

    yield db_with_agreements

    # Cleanup
    # delete all agreements
    all_agreements = db_with_agreements.scalars(select(Agreement)).all()
    for agreement in all_agreements:
        db_with_agreements.delete(agreement)

    db_with_agreements.commit()
    db_with_agreements.delete(user1)
    db_with_agreements.delete(user2)
    db_with_agreements.delete(user3)
    db_with_agreements.delete(user4)
    # db_with_agreements.execute(text("DELETE FROM ops_user"))
    db_with_agreements.commit()


def test_create_team_member_data():
    test_data = {
        "MAPS_ID": "12345",
        "CIG_TYPE": "contract",
        "TITLE": "Test Agreement",
        "DIVISION": "CC",
        "PO": "project.officer@example.com",
        "ALTERNATE_PO": "alternate.po@example.com",
        "TEAM_MEMBERS": "team.member1@example.com, team.member2@example.com",
        "NOTES": "Test notes",
    }

    data = create_team_member_data(test_data)

    assert data.MAPS_ID == 12345
    assert data.CIG_TYPE == "contract"
    assert data.TITLE == "Test Agreement"
    assert data.DIVISION == "CC"
    assert data.PO == "project.officer@example.com"
    assert data.ALTERNATE_PO == "alternate.po@example.com"
    assert data.TEAM_MEMBERS == ["team.member1@example.com", "team.member2@example.com"]
    assert data.NOTES == "Test notes"


def test_validate_data():
    # Valid data with MAPS_ID
    data1 = TeamMemberData(MAPS_ID=12345, CIG_TYPE="contract")
    assert validate_data(data1) is True

    # Valid data with TITLE and CIG_TYPE
    data2 = TeamMemberData(TITLE="Test Agreement", CIG_TYPE="contract")
    assert validate_data(data2) is True

    # Invalid data with neither MAPS_ID nor TITLE
    with pytest.raises(ValueError):
        data3 = TeamMemberData(CIG_TYPE="contract")
        validate_data(data3)

    # Invalid data with TITLE but no CIG_TYPE
    with pytest.raises(ValueError):
        data4 = TeamMemberData(
            TITLE="Test Agreement",
        )
        validate_data(data4)


def test_validate_all():
    data_list = [
        TeamMemberData(MAPS_ID=12345, CIG_TYPE="contract"),
        TeamMemberData(TITLE="Test Agreement", CIG_TYPE="grant"),
        TeamMemberData(MAPS_ID=67890, CIG_TYPE="contract"),
    ]

    assert validate_all(data_list) is True

    with pytest.raises(ValueError):
        # Add an invalid item
        data_list.append(TeamMemberData())

        # This should trigger the post_init validation
        validate_all(data_list)


def test_create_models_by_maps_id(db_with_users_and_agreements):
    sys_user = User(
        email="system.admin@localhost",
    )
    db_with_users_and_agreements.add(sys_user)
    db_with_users_and_agreements.commit()

    data = TeamMemberData(
        MAPS_ID=12345,
        CIG_TYPE="contract",
        PO="project.officer@example.com",
        ALTERNATE_PO="alternate.po@example.com",
        TEAM_MEMBERS="team.member1@example.com, team.member2@example.com",
    )

    create_models(data, sys_user, db_with_users_and_agreements)

    # Check that the agreement was updated
    agreement = db_with_users_and_agreements.execute(
        select(Agreement).where(Agreement.maps_sys_id == 12345)
    ).scalar_one()

    assert agreement.project_officer_id == 903
    assert agreement.alternate_project_officer_id == 904
    assert len(agreement.team_members) == 2
    assert {m.id for m in agreement.team_members} == {901, 902}

    # Check that events were created
    events = (
        db_with_users_and_agreements.execute(
            select(OpsEvent).where(OpsEvent.event_type == OpsEventType.UPDATE_AGREEMENT)
        )
        .scalars()
        .all()
    )

    assert len(events) == 1
    assert events[0].created_by == 500
    assert events[0].event_details["agreement_id"] == 999


def test_create_models_by_title(db_with_users_and_agreements):
    sys_user = User(
        email="system.admin@localhost",
    )
    db_with_users_and_agreements.add(sys_user)
    db_with_users_and_agreements.commit()

    data = TeamMemberData(
        TITLE="Test Agreement 2",
        CIG_TYPE="grant",
        PO="project.officer@example.com",
        TEAM_MEMBERS="team.member1@example.com",
    )

    create_models(data, sys_user, db_with_users_and_agreements)

    # Check that the agreement was updated
    agreement = db_with_users_and_agreements.execute(
        select(Agreement).where(Agreement.name == "Test Agreement 2")
    ).scalar_one()

    assert agreement.project_officer_id == 903
    assert len(agreement.team_members) == 1
    assert agreement.team_members[0].id == 901


def test_create_models_agreement_not_found(db_with_users_and_agreements):
    sys_user = User(
        email="system.admin@localhost",
    )
    db_with_users_and_agreements.add(sys_user)
    db_with_users_and_agreements.commit()

    data = TeamMemberData(MAPS_ID=99999, CIG_TYPE="contract", PO="project.officer@example.com")  # Non-existent MAPS_ID

    with pytest.raises(ValueError, match="Agreement not found"):
        create_models(data, sys_user, db_with_users_and_agreements)


def test_create_models_user_not_found(db_with_users_and_agreements):
    sys_user = User(
        email="system.admin@localhost",
    )
    db_with_users_and_agreements.add(sys_user)
    db_with_users_and_agreements.commit()

    data = TeamMemberData(
        MAPS_ID=12345,
        CIG_TYPE="contract",
        PO="nonexistent.po@example.com",
        TEAM_MEMBERS="nonexistent.member@example.com",
    )

    # Should log warnings but not raise exceptions
    create_models(data, sys_user, db_with_users_and_agreements)

    # Check that the agreement was still processed
    agreement = db_with_users_and_agreements.execute(
        select(Agreement).where(Agreement.maps_sys_id == 12345)
    ).scalar_one()

    # PO not found, so should not be set
    assert agreement.project_officer_id is None
    # No team members found
    assert len(agreement.team_members) == 0


@patch("data_tools.src.load_team_members.utils.create_all_models")
def test_main_cli(mock_create_all_models, db_with_users_and_agreements):
    # Create a mock TSV file path
    mock_file_path = "test_csv/team_members.tsv"

    # Call the CLI command
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "team_members",
            "--input-csv",
            mock_file_path,
        ],
    )

    # Check that the command completed successfully
    assert result.exit_code == 0

    # Check that create_all_models was called
    mock_create_all_models.assert_called_once()


def test_post_init_validation():
    # Should raise error when neither MAPS_ID nor TITLE is provided
    with pytest.raises(ValueError, match="Either MAPS_ID or TITLE and CIG_TYPE must be provided."):
        TeamMemberData()

    # Should not raise error when MAPS_ID is provided
    data1 = TeamMemberData(MAPS_ID=12345, CIG_TYPE="contract")
    assert data1.MAPS_ID == 12345

    # Should not raise error when TITLE and CIG_TYPE are provided
    data2 = TeamMemberData(TITLE="Test Agreement", CIG_TYPE="contract")
    assert data2.TITLE == "Test Agreement"
    assert data2.CIG_TYPE == "contract"
