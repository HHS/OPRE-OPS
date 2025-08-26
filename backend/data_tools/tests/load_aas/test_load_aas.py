import csv
import os

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from sqlalchemy.sql.expression import text

from models import *  # noqa: F403, F401


@pytest.fixture()
def aas_data_sample():
    """Sample AAS data for testing"""
    return {
        "PROJECT_NAME": "Test Project",
        "AA_NAME": "Family Support Research",
        "REQUESTING_AGENCY_NAME": "HHS",
        "SERVICING_AGENCY_NAME": "NSF",
        "SERVICE_REQUIREMENT_TYPE": "RESEARCH",
        "REQUESTING_AGENCY_ABBREVIATION": "HHS",
        "SERVICING_AGENCY_ABBREVIATION": "NSF",
    }


def test_create_aa_data(aas_data_sample):
    """Test creating AA data from dictionary"""
    from data_tools.src.load_aas.utils import create_aa_data

    aa_data = create_aa_data(aas_data_sample)

    assert aa_data.PROJECT_NAME == "Test Project"
    assert aa_data.AA_NAME == "Family Support Research"
    assert aa_data.REQUESTING_AGENCY_NAME == "HHS"
    assert aa_data.SERVICING_AGENCY_NAME == "NSF"
    assert aa_data.SERVICE_REQUIREMENT_TYPE == "RESEARCH"
    assert aa_data.REQUESTING_AGENCY_ABBREVIATION == "HHS"
    assert aa_data.SERVICING_AGENCY_ABBREVIATION == "NSF"


def test_aa_data_validation():
    """Test AA data validation with missing fields"""
    from data_tools.src.load_aas.utils import AAData

    # Test with valid data
    valid_data = AAData(
        PROJECT_NAME="Test Project",
        AA_NAME="Test Agreement",
        REQUESTING_AGENCY_NAME="Agency A",
        SERVICING_AGENCY_NAME="Agency B",
        SERVICE_REQUIREMENT_TYPE="RESEARCH",
    )
    assert valid_data is not None

    # Test with missing required fields
    with pytest.raises(ValueError):
        AAData(
            PROJECT_NAME="Test Project",
            AA_NAME="",  # Empty AA_NAME
            REQUESTING_AGENCY_NAME="Agency A",
            SERVICING_AGENCY_NAME="Agency B",
            SERVICE_REQUIREMENT_TYPE="RESEARCH",
        )


def test_validate_data():
    """Test validate_data function"""
    from data_tools.src.load_aas.utils import AAData, validate_data

    valid_data = AAData(
        PROJECT_NAME="Test Project",
        AA_NAME="Test Agreement",
        REQUESTING_AGENCY_NAME="Agency A",
        SERVICING_AGENCY_NAME="Agency B",
        SERVICE_REQUIREMENT_TYPE="RESEARCH",
    )

    assert validate_data(valid_data) is True


def test_validate_all():
    """Test validate_all function"""
    from data_tools.src.load_aas.utils import AAData, validate_all

    data_list = [
        AAData(
            PROJECT_NAME="Test Project 1",
            AA_NAME="Test Agreement 1",
            REQUESTING_AGENCY_NAME="Agency A",
            SERVICING_AGENCY_NAME="Agency B",
            SERVICE_REQUIREMENT_TYPE="RESEARCH",
        ),
        AAData(
            PROJECT_NAME="Test Project 2",
            AA_NAME="Test Agreement 2",
            REQUESTING_AGENCY_NAME="Agency C",
            SERVICING_AGENCY_NAME="Agency D",
            SERVICE_REQUIREMENT_TYPE="RESEARCH",
        ),
    ]

    assert validate_all(data_list) is True


@pytest.fixture()
def db_for_aas(loaded_db):
    """Set up database for AAS tests"""
    # Create project
    project = ResearchProject(title="Test Project")
    loaded_db.add(project)

    # Create requesting agency
    req_agency = AgreementAgency(
        name="HHS",
        abbreviation="HHS",
        requesting=True,
        servicing=False,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    loaded_db.add(req_agency)

    # Create servicing agency
    serv_agency = AgreementAgency(
        name="NSF",
        abbreviation="NSF",
        requesting=False,
        servicing=True,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    loaded_db.add(serv_agency)

    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    # Clean up test data
    loaded_db.execute(text("DELETE FROM aa_agreement"))
    loaded_db.execute(text("DELETE FROM aa_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement_agency"))
    loaded_db.execute(text("DELETE FROM agreement_agency_version"))
    loaded_db.execute(text("DELETE FROM research_project"))
    loaded_db.execute(text("DELETE FROM research_project_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_create_models(db_for_aas):
    """Test create_models function"""
    from data_tools.src.load_aas.utils import AAData, create_models

    sys_user = get_or_create_sys_user(db_for_aas)

    data = AAData(
        PROJECT_NAME="Test Project",
        AA_NAME="Family Support Research",
        REQUESTING_AGENCY_NAME="HHS",
        SERVICING_AGENCY_NAME="NSF",
        SERVICE_REQUIREMENT_TYPE=ServiceRequirementType.SEVERABLE.name,
    )

    create_models(data, sys_user, db_for_aas)

    # Query the created AaAgreement
    aa_model = db_for_aas.execute(select(AaAgreement).where(AaAgreement.name == "Family Support Research")).scalar()

    assert aa_model is not None
    assert aa_model.name == "Family Support Research"
    assert aa_model.project.title == "Test Project"
    assert aa_model.requesting_agency.name == "HHS"
    assert aa_model.servicing_agency.name == "NSF"
    assert aa_model.service_requirement_type == ServiceRequirementType.SEVERABLE
    assert aa_model.created_by == sys_user.id
    assert aa_model.updated_by == sys_user.id

    # clean up created data
    db_for_aas.delete(aa_model)
    db_for_aas.commit()


def test_create_models_upsert(db_for_aas):
    """Test create_models upsert functionality"""
    from data_tools.src.load_aas.utils import AAData, create_models

    sys_user = get_or_create_sys_user(db_for_aas)

    # Initial data
    data_1 = AAData(
        PROJECT_NAME="Test Project",
        AA_NAME="Family Support Research",
        REQUESTING_AGENCY_NAME="HHS",
        SERVICING_AGENCY_NAME="NSF",
        SERVICE_REQUIREMENT_TYPE=ServiceRequirementType.SEVERABLE.name,
    )

    # Updated data (same name but different service type)
    data_2 = AAData(
        PROJECT_NAME="Test Project",
        AA_NAME="Family Support Research",
        REQUESTING_AGENCY_NAME="HHS",
        SERVICING_AGENCY_NAME="NSF",
        SERVICE_REQUIREMENT_TYPE=ServiceRequirementType.SEVERABLE.name,
    )

    # Create initial record
    create_models(data_1, sys_user, db_for_aas)

    # Verify initial record
    aa_model = db_for_aas.execute(select(AaAgreement).where(AaAgreement.name == "Family Support Research")).scalar()
    assert aa_model.service_requirement_type == ServiceRequirementType.SEVERABLE
    created_on = aa_model.created_on
    created_by = aa_model.created_by

    # Update record
    create_models(data_2, sys_user, db_for_aas)

    # Verify updated record
    aa_model = db_for_aas.execute(select(AaAgreement).where(AaAgreement.name == "Family Support Research")).scalar()
    assert aa_model.service_requirement_type == ServiceRequirementType.SEVERABLE
    assert aa_model.created_on == created_on  # Created timestamp should remain the same
    assert aa_model.created_by == created_by  # Created by should remain the same
    assert aa_model.updated_on > created_on  # Updated timestamp should be newer

    # cleanup created data
    db_for_aas.delete(aa_model)
    db_for_aas.commit()


def test_transform_with_csv(db_for_aas, tmp_path):
    """Test transform function with CSV data"""
    from csv import DictReader

    from data_tools.src.load_aas.utils import transform

    sys_user = get_or_create_sys_user(db_for_aas)

    # Create test CSV file
    csv_path = tmp_path / "test_aa.csv"
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "PROJECT_NAME",
                "AA_NAME",
                "REQUESTING_AGENCY_NAME",
                "SERVICING_AGENCY_NAME",
                "SERVICE_REQUIREMENT_TYPE",
                "REQUESTING_AGENCY_ABBREVIATION",
                "SERVICING_AGENCY_ABBREVIATION",
            ]
        )
        writer.writerow(["Test Project", "Family Support Research", "HHS", "NSF", "SEVERABLE", "HHS", "NSF"])
        writer.writerow(["Test Project", "Child Development Study", "HHS", "DOE", "NON_SEVERABLE", "HHS", "DOE"])

    # Read and transform the data
    with open(csv_path, newline="") as f:
        reader = DictReader(f)
        transform(reader, db_for_aas, sys_user)

    # Verify results
    aa_count = db_for_aas.execute(select(AaAgreement)).scalars().all()
    assert len(aa_count) == 2

    aa1 = db_for_aas.execute(select(AaAgreement).where(AaAgreement.name == "Family Support Research")).scalar()
    assert aa1.name == "Family Support Research"
    assert aa1.service_requirement_type == ServiceRequirementType.SEVERABLE

    aa2 = db_for_aas.execute(select(AaAgreement).where(AaAgreement.name == "Child Development Study")).scalar()
    assert aa2.name == "Child Development Study"
    assert aa2.service_requirement_type == ServiceRequirementType.NON_SEVERABLE

    # Clean up test data
    db_for_aas.delete(aa1)
    db_for_aas.delete(aa2)
    db_for_aas.commit()


def test_main_cli(db_for_aas, tmp_path):
    """Test main CLI command for loading AA data"""
    # Create test CSV file
    csv_path = tmp_path / "test_aa.csv"
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f, delimiter="\t")
        writer.writerow(
            [
                "PROJECT_NAME",
                "AA_NAME",
                "REQUESTING_AGENCY_NAME",
                "SERVICING_AGENCY_NAME",
                "SERVICE_REQUIREMENT_TYPE",
                "REQUESTING_AGENCY_ABBREVIATION",
                "SERVICING_AGENCY_ABBREVIATION",
            ]
        )
        writer.writerow(["Test Project", "Family Support Research", "HHS", "NSF", "SEVERABLE", "HHS", "NSF"])

    # Mock environment variable
    os.environ["TEST_MODE"] = "True"

    # Run CLI command
    result = CliRunner().invoke(main, ["--env", "pytest_data_tools", "--type", "aas", "--input-csv", str(csv_path)])

    assert result.exit_code == 0

    # Verify data was loaded
    aa_model = db_for_aas.execute(select(AaAgreement).where(AaAgreement.name == "Family Support Research")).scalar()
    assert aa_model is not None
    assert aa_model.name == "Family Support Research"
    assert aa_model.project.title == "Test Project"

    # clean up created data
    db_for_aas.delete(aa_model)
    db_for_aas.commit()


def test_existing_agreement_handling(db_for_aas):
    """Test handling of existing agreements"""
    from data_tools.src.load_aas.utils import AAData, create_models

    sys_user = get_or_create_sys_user(db_for_aas)

    # Create an existing agreement
    existing_agreement = ContractAgreement(
        name="Existing Contract",
        agreement_type=AgreementType.CONTRACT,
        created_by=sys_user.id,
        updated_by=sys_user.id,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    db_for_aas.add(existing_agreement)
    db_for_aas.commit()

    # Create some budget lines for the existing agreement
    budget_line_1 = ContractBudgetLineItem(
        line_description="Existing Budget Line",
        agreement=existing_agreement,
        created_by=sys_user.id,
        updated_by=sys_user.id,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    budget_line_2 = ContractBudgetLineItem(
        line_description="Another Existing Budget Line",
        agreement=existing_agreement,
        created_by=sys_user.id,
        updated_by=sys_user.id,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    budget_line_3 = ContractBudgetLineItem(
        line_description="Budget Line for New AA",
        agreement=existing_agreement,
        created_by=sys_user.id,
        updated_by=sys_user.id,
        created_on=datetime.now(),
        updated_on=datetime.now(),
    )
    db_for_aas.add(budget_line_1)
    db_for_aas.add(budget_line_2)
    db_for_aas.add(budget_line_3)
    db_for_aas.commit()

    # Create initial agreement
    data = AAData(
        PROJECT_NAME="Test Project",
        AA_NAME="New AA",
        REQUESTING_AGENCY_NAME="HHS",
        SERVICING_AGENCY_NAME="NSF",
        SERVICE_REQUIREMENT_TYPE=ServiceRequirementType.SEVERABLE.name,
        ORIGINAL_CIG_NAME="Existing Contract",
        ORIGINAL_CIG_TYPE="contract",
    )
    create_models(data, sys_user, db_for_aas)

    # Verify no duplicate was created
    old_agreement = db_for_aas.get(Agreement, existing_agreement.id)
    assert old_agreement is None

    # get the new agreement
    new_agreement = db_for_aas.execute(select(AaAgreement).where(AaAgreement.name == "New AA")).scalar()
    assert new_agreement is not None
    assert new_agreement.name == "New AA"
    assert new_agreement.project.title == "Test Project"
    assert new_agreement.requesting_agency.name == "HHS"
    assert new_agreement.servicing_agency.name == "NSF"
    assert new_agreement.service_requirement_type == ServiceRequirementType.SEVERABLE
    assert new_agreement.created_by == sys_user.id
    assert new_agreement.updated_by == sys_user.id

    # Verify budget lines were created
    budget_lines = (
        db_for_aas.execute(select(AABudgetLineItem).where(AABudgetLineItem.agreement_id == new_agreement.id))
        .scalars()
        .all()
    )
    assert len(budget_lines) == 3
    assert budget_lines[0].line_description == "Existing Budget Line"
    assert budget_lines[1].line_description == "Another Existing Budget Line"
    assert budget_lines[2].line_description == "Budget Line for New AA"

    # Clean up created data
    for budget_line in budget_lines:
        db_for_aas.delete(budget_line)
    db_for_aas.delete(new_agreement)
    db_for_aas.commit()
