import csv
import os
from datetime import date, datetime
from decimal import Decimal

import pytest
from click.testing import CliRunner
from sqlalchemy import select, text

from data_tools.src.load_data import main
from data_tools.src.load_master_spreadsheet_budget_lines_v2.utils import (
    BudgetLineItemData,
    calculate_proc_fee_percentage,
    create_budget_line_item_data,
    create_models,
    validate_data,
)
from models import (
    CAN,
    AaAgreement,
    AABudgetLineItem,
    Agreement,
    AgreementAgency,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    DirectAgreement,
    DirectObligationBudgetLineItem,
    Division,
    GrantAgreement,
    GrantBudgetLineItem,
    OpsDBHistory,
    OpsDBHistoryType,
    OpsEvent,
    OpsEventType,
    Portfolio,
    ProcurementShop,
    ProcurementShopFee,
    Project,
    ProjectType,
    ServiceRequirementType,
    ServicesComponent,
    User,
)
from models.procurement_action import AwardType, ProcurementAction
from models.procurement_tracker import DefaultProcurementTracker, ProcurementTracker, ProcurementTrackerStepStatus

file_path = os.path.join(os.path.dirname(__file__), "../../test_csv/master_spreadsheet_budget_lines_v2.tsv")


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 11
    record = test_data[0]

    # Create data object
    data = create_budget_line_item_data(record)

    # Check data object
    assert data.ID == 15015
    assert data.AGREEMENT_NAME == "Contract #1: African American Child and Family Research Center"
    assert data.AGREEMENT_TYPE == AgreementType.CONTRACT
    assert data.LINE_DESC == "Software Licensing"
    assert data.DATE_NEEDED == date(2025, 3, 11)
    assert data.AMOUNT == 2341552303.08
    assert data.STATUS == BudgetLineItemStatus.PLANNED
    assert data.COMMENTS == "Requires revision"
    assert data.CAN == "G99AB14 (IAA-Incoming-Extra)"
    assert data.SC == "SC1"
    assert data.PROC_SHOP == "PROC1"
    assert data.PROC_SHOP_FEE == 23415523.03
    assert data.PROC_SHOP_RATE == 1.0


def test_validate_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))
    assert len(test_data) == 11
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 11


def _ensure_user(session):
    user = session.scalar(select(User).where(User.email == "system.admin@localhost"))
    if not user:
        user = User(email="system.admin@localhost")
        session.add(user)
        session.commit()
    return user


@pytest.fixture()
def db_with_data_v2(loaded_db):
    clean_up_db(loaded_db)

    division = loaded_db.scalar(select(Division).where(Division.name == "Test Division"))
    if not division:
        division = Division(name="Test Division", abbreviation="TD")
        loaded_db.add(division)
        loaded_db.flush()

    portfolio = loaded_db.scalar(select(Portfolio).where(Portfolio.name == "Test Portfolio"))
    if not portfolio:
        portfolio = Portfolio(name="Test Portfolio", division_id=division.id)
        loaded_db.add(portfolio)
        loaded_db.flush()

    procurement_shop_proc1 = ProcurementShop(name="Procurement Shop 1", abbr="PROC1")
    procurement_shop_proc2 = ProcurementShop(name="Procurement Shop 2", abbr="PROC2")
    procurement_shop_proc3 = ProcurementShop(name="Procurement Shop 3", abbr="PROC3")
    loaded_db.add_all([procurement_shop_proc1, procurement_shop_proc2, procurement_shop_proc3])
    loaded_db.commit()

    loaded_db.add(ProcurementShopFee(procurement_shop_id=procurement_shop_proc1.id, fee=Decimal("1.0")))
    loaded_db.add(ProcurementShopFee(procurement_shop_id=procurement_shop_proc2.id, fee=Decimal("2.0")))
    loaded_db.add(ProcurementShopFee(procurement_shop_id=procurement_shop_proc3.id, fee=Decimal("3.0")))
    loaded_db.commit()

    loaded_db.add(
        GrantAgreement(
            name="Grant #1: Early Care and Education Leadership Study (ExCELS)",
            agreement_type=AgreementType.GRANT,
        )
    )
    loaded_db.add(
        ContractAgreement(
            name="Test Contract Agreement Name",
            agreement_type=AgreementType.CONTRACT,
        )
    )
    loaded_db.add(
        ContractAgreement(
            name="Test Contract In Execution TSV",
            agreement_type=AgreementType.CONTRACT,
        )
    )
    loaded_db.commit()

    loaded_db.add(CAN(number="TestCanNumber", portfolio_id=portfolio.id))
    loaded_db.commit()

    yield loaded_db

    loaded_db.rollback()
    clean_up_db(loaded_db)


def clean_up_db(session):
    session.execute(text("DELETE FROM grant_budget_line_item"))
    session.execute(text("DELETE FROM grant_budget_line_item_version"))

    session.execute(text("DELETE FROM contract_budget_line_item"))
    session.execute(text("DELETE FROM contract_budget_line_item_version"))

    session.execute(text("DELETE FROM aa_budget_line_item"))
    session.execute(text("DELETE FROM aa_budget_line_item_version"))

    session.execute(text("DELETE FROM iaa_budget_line_item"))
    session.execute(text("DELETE FROM iaa_budget_line_item_version"))

    session.execute(text("DELETE FROM direct_obligation_budget_line_item"))
    session.execute(text("DELETE FROM direct_obligation_budget_line_item_version"))

    session.execute(text("DELETE FROM budget_line_item"))
    session.execute(text("DELETE FROM budget_line_item_version"))

    session.execute(text("DELETE FROM procurement_tracker_step"))
    session.execute(text("DELETE FROM procurement_tracker_step_version"))
    session.execute(text("DELETE FROM default_procurement_tracker"))
    session.execute(text("DELETE FROM default_procurement_tracker_version"))
    session.execute(text("DELETE FROM procurement_tracker"))
    session.execute(text("DELETE FROM procurement_tracker_version"))
    session.execute(text("DELETE FROM procurement_action"))
    session.execute(text("DELETE FROM procurement_action_version"))

    session.execute(text("DELETE FROM services_component"))
    session.execute(text("DELETE FROM services_component_version"))

    session.execute(text("DELETE FROM agreement_mod"))
    session.execute(text("DELETE FROM agreement_mod_version"))

    session.execute(text("DELETE FROM can_history"))
    session.execute(text("DELETE FROM can_history_version"))

    session.execute(text("DELETE FROM can"))
    session.execute(text("DELETE FROM can_version"))

    session.execute(text("DELETE FROM portfolio_team_leaders"))
    session.execute(text("DELETE FROM portfolio_url"))
    session.execute(text("DELETE FROM portfolio"))
    session.execute(text("DELETE FROM portfolio_version"))

    session.execute(text("DELETE FROM division"))
    session.execute(text("DELETE FROM division_version"))

    session.execute(text("DELETE FROM grant_agreement"))
    session.execute(text("DELETE FROM grant_agreement_version"))

    session.execute(text("DELETE FROM contract_agreement"))
    session.execute(text("DELETE FROM contract_agreement_version"))

    session.execute(text("DELETE FROM iaa_agreement"))
    session.execute(text("DELETE FROM iaa_agreement_version"))

    session.execute(text("DELETE FROM aa_agreement"))
    session.execute(text("DELETE FROM aa_agreement_version"))

    session.execute(text("DELETE FROM direct_agreement"))
    session.execute(text("DELETE FROM direct_agreement_version"))

    session.execute(text("DELETE FROM agreement"))
    session.execute(text("DELETE FROM agreement_version"))

    session.execute(text("DELETE FROM procurement_shop_fee"))
    session.execute(text("DELETE FROM procurement_shop_fee_version"))
    session.execute(text("DELETE FROM procurement_shop"))
    session.execute(text("DELETE FROM procurement_shop_version"))

    session.execute(text("DELETE FROM role"))
    session.execute(text("DELETE FROM role_version"))

    session.execute(text("DELETE FROM ops_event"))
    session.execute(text("DELETE FROM ops_event_version"))

    session.execute(text("DELETE FROM ops_user"))
    session.execute(text("DELETE FROM ops_user_version"))

    session.execute(text("DELETE FROM ops_db_history"))
    session.execute(text("DELETE FROM ops_db_history_version"))
    session.commit()


def test_create_model(db_with_data_v2):
    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        AGREEMENT_TYPE="GRANT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="1087.49",
        PROC_SHOP_RATE="7.153",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    grant_agreement = db_with_data_v2.scalar(
        select(GrantAgreement).where(
            GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        )
    )
    can = db_with_data_v2.scalar(select(CAN).where(CAN.number == "TestCanNumber"))

    bli_model = db_with_data_v2.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == grant_agreement.id
    assert bli_model.can_id == can.id

    assert bli_model.agreement == grant_agreement
    assert grant_agreement.awarding_entity_id == db_with_data_v2.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    assert bli_model.can == can

    assert bli_model.budget_line_item_type == AgreementType.GRANT
    assert bli_model.line_description == "Test Line Description"
    assert bli_model.comments == "Test Comments"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED
    assert bli_model.date_needed == date(2025, 3, 11)
    assert bli_model.procurement_shop_fee_id is None
    assert bli_model.created_by == user.id

    # Default values
    assert bli_model.on_hold is False
    assert bli_model.certified is False
    assert bli_model.closed is False
    assert bli_model.closed_by is None
    assert bli_model.closed_date is None
    assert bli_model.is_under_current_resolution is False
    assert bli_model.extend_pop_to is None
    assert bli_model.start_date is None
    assert bli_model.end_date is None
    assert bli_model.object_class_code_id is None
    assert bli_model.object_class_code is None
    assert bli_model.doc_received is False
    assert bli_model.obligation_date is None

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].agreement_id == grant_agreement.id
    assert bli_model.versions[0].can_id == can.id
    assert bli_model.versions[0].budget_line_item_type == AgreementType.GRANT
    assert bli_model.versions[0].line_description == "Test Line Description"
    assert bli_model.versions[0].comments == "Test Comments"
    assert bli_model.versions[0].amount == Decimal("15203.08")
    assert bli_model.versions[0].status == BudgetLineItemStatus.PLANNED
    assert bli_model.versions[0].date_needed == date(2025, 3, 11)

    # Check history records
    history_records = (
        db_with_data_v2.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.row_key == str(bli_model.id))
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )

    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.commit()


def test_create_models_upsert(db_with_data_v2):
    contract_agreement = db_with_data_v2.scalar(
        select(ContractAgreement).where(ContractAgreement.name == "Test Contract Agreement Name")
    )
    can = db_with_data_v2.scalar(select(CAN).where(CAN.number == "TestCanNumber"))

    existing_bli = ContractBudgetLineItem(
        agreement_id=contract_agreement.id,
        can_id=can.id,
        budget_line_item_type=AgreementType.CONTRACT,
        line_description="Original Test Line Description",
        comments="Original Test Comments",
        amount=Decimal("89542.75"),
        status=BudgetLineItemStatus.IN_EXECUTION,
        date_needed=date(2025, 2, 17),
        proc_shop_fee_percentage=Decimal("0.015"),
    )
    db_with_data_v2.add(existing_bli)
    db_with_data_v2.commit()

    data = BudgetLineItemData(
        ID=existing_bli.id,
        AGREEMENT_NAME="Test Contract Agreement Name",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="1087.49",
        PROC_SHOP_RATE="7.153",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    bli = db_with_data_v2.get(ContractBudgetLineItem, existing_bli.id)
    assert bli is not None
    assert bli.id == existing_bli.id
    assert bli.agreement_id == contract_agreement.id
    assert bli.can_id == can.id
    assert bli.budget_line_item_type == AgreementType.CONTRACT
    assert bli.line_description == "Test Line Description"
    assert bli.comments == "Test Comments"
    assert bli.amount == Decimal("15203.08")
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert bli.date_needed == date(2025, 3, 11)
    assert bli.proc_shop_fee_percentage == Decimal("0.015")

    # Check version records
    assert bli.versions[1].id == existing_bli.id
    assert bli.versions[1].agreement_id == contract_agreement.id
    assert bli.versions[1].can_id == can.id
    assert bli.versions[1].budget_line_item_type == AgreementType.CONTRACT
    assert bli.versions[1].line_description == "Test Line Description"
    assert bli.versions[1].comments == "Test Comments"
    assert bli.versions[1].amount == Decimal("15203.08")
    assert bli.versions[1].status == BudgetLineItemStatus.PLANNED
    assert bli.versions[1].date_needed == date(2025, 3, 11)
    assert bli.versions[1].proc_shop_fee_percentage == Decimal("0.015")

    assert bli.versions[0].id == existing_bli.id
    assert bli.versions[0].agreement_id == contract_agreement.id
    assert bli.versions[0].can_id == can.id
    assert bli.versions[0].budget_line_item_type == AgreementType.CONTRACT
    assert bli.versions[0].line_description == "Original Test Line Description"
    assert bli.versions[0].comments == "Original Test Comments"
    assert bli.versions[0].amount == Decimal("89542.75")
    assert bli.versions[0].status == BudgetLineItemStatus.IN_EXECUTION
    assert bli.versions[0].date_needed == date(2025, 2, 17)
    assert bli.versions[0].proc_shop_fee_percentage == Decimal("0.01500")

    # Cleanup
    db_with_data_v2.delete(bli)
    db_with_data_v2.commit()


def test_main(db_with_data_v2):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "master_spreadsheet_budget_lines_v2",
            "--input-csv",
            file_path,
            "--first-run",
        ],
    )

    assert result.exit_code == 0

    all_blis = db_with_data_v2.execute(select(BudgetLineItem)).scalars().all()

    assert len(all_blis) == 7

    # Check Grant Budget Line Item
    grant_bli = db_with_data_v2.scalar(
        select(GrantBudgetLineItem).where(
            GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        )
    )
    assert grant_bli.agreement.awarding_entity_id == db_with_data_v2.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    # Check that the IN_EXECUTION BLI from the TSV created procurement records
    exec_agreement = db_with_data_v2.scalar(
        select(ContractAgreement).where(ContractAgreement.name == "Test Contract In Execution TSV")
    )
    exec_bli = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .where(ContractBudgetLineItem.agreement_id == exec_agreement.id)
        .where(ContractBudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION)
    ).scalar_one_or_none()
    assert exec_bli is not None
    assert exec_bli.procurement_action_id is not None

    action = db_with_data_v2.get(ProcurementAction, exec_bli.procurement_action_id)
    assert action.award_type == AwardType.NEW_AWARD
    assert action.agreement_id == exec_agreement.id

    tracker = db_with_data_v2.execute(
        select(DefaultProcurementTracker).where(DefaultProcurementTracker.agreement_id == exec_agreement.id)
    ).scalar_one_or_none()
    assert tracker is not None
    assert tracker.procurement_action == action.id

    # Cleanup
    db_with_data_v2.delete(grant_bli)
    db_with_data_v2.commit()


def test_create_model_lock_in_proc_shop(db_with_data_v2):
    """
    Test creating a model with a locked-in procurement shop fee (the PROC_SHOP is locked in and the BLI is OBLIGATED).
    """
    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        AGREEMENT_TYPE="GRANT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OBL",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="152.03",
        PROC_SHOP_RATE="1.0",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    bli_model = db_with_data_v2.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
        .where(GrantBudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
        .where(GrantBudgetLineItem.line_description == "Test Line Description")
    ).scalar_one_or_none()

    grant_agreement = db_with_data_v2.scalar(
        select(GrantAgreement).where(
            GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        )
    )
    can = db_with_data_v2.scalar(select(CAN).where(CAN.number == "TestCanNumber"))

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == grant_agreement.id
    assert bli_model.can_id == can.id

    assert bli_model.agreement == grant_agreement
    assert grant_agreement.awarding_entity_id == db_with_data_v2.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    # get the procurement shop fee id from data.PROC_FEE_AMOUNT, data.AMOUNT, and data.PROC_SHOP
    fee_percentage = calculate_proc_fee_percentage(Decimal(data.PROC_SHOP_FEE), Decimal(data.AMOUNT)) * 100

    expected_procurement_shop_fee_id = db_with_data_v2.scalar(
        select(ProcurementShopFee.id).where(
            ProcurementShopFee.procurement_shop_id == bli_model.agreement.awarding_entity_id,
            ProcurementShopFee.fee.between(fee_percentage - Decimal(0.01), fee_percentage + Decimal(0.01)),
        )
    )
    assert expected_procurement_shop_fee_id is not None
    assert bli_model.procurement_shop_fee_id == expected_procurement_shop_fee_id

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].procurement_shop_fee_id == expected_procurement_shop_fee_id

    # Check history records
    history_records = (
        db_with_data_v2.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.row_key == str(bli_model.id))
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )

    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.commit()


def test_create_model_lock_in_proc_shop_fee_not_found(db_with_data_v2):
    """
    Test creating a model with a locked-in procurement shop fee that does not exist.
    """
    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        AGREEMENT_TYPE="GRANT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OBL",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="300.00",
        PROC_SHOP_RATE="2.0",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    bli_model = db_with_data_v2.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
    ).scalar_one_or_none()

    grant_agreement = db_with_data_v2.scalar(
        select(GrantAgreement).where(
            GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        )
    )
    can = db_with_data_v2.scalar(select(CAN).where(CAN.number == "TestCanNumber"))

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == grant_agreement.id
    assert bli_model.can_id == can.id

    assert bli_model.agreement == grant_agreement
    assert grant_agreement.awarding_entity_id == db_with_data_v2.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    # get the procurement shop fee id from data.PROC_FEE_AMOUNT, data.AMOUNT, and data.PROC_SHOP
    fee_percentage = calculate_proc_fee_percentage(Decimal(data.PROC_SHOP_FEE), Decimal(data.AMOUNT)) * 100

    expected_procurement_shop_fee_id = db_with_data_v2.scalar(
        select(ProcurementShopFee.id).where(
            ProcurementShopFee.procurement_shop_id == bli_model.agreement.awarding_entity_id,
            ProcurementShopFee.fee.between(fee_percentage - Decimal(0.01), fee_percentage + Decimal(0.01)),
        )
    )
    assert expected_procurement_shop_fee_id is None
    assert bli_model.procurement_shop_fee_id is None

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].procurement_shop_fee_id is None

    # Check history records
    history_records = (
        db_with_data_v2.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.row_key == str(bli_model.id))
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )

    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.commit()


@pytest.fixture()
def db_for_aas(loaded_db):
    # Clean up existing Agreements
    for agreement in loaded_db.execute(select(Agreement)).scalars().all():
        loaded_db.delete(agreement)
    loaded_db.commit()

    # Create project
    project = Project(title="Test Project", project_type=ProjectType.RESEARCH)
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
    loaded_db.execute(text("DELETE FROM grant_agreement"))
    loaded_db.execute(text("DELETE FROM grant_agreement_version"))
    loaded_db.execute(text("DELETE FROM contract_agreement"))
    loaded_db.execute(text("DELETE FROM contract_agreement_version"))
    loaded_db.execute(text("DELETE FROM aa_agreement"))
    loaded_db.execute(text("DELETE FROM aa_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement_agency"))
    loaded_db.execute(text("DELETE FROM agreement_agency_version"))
    loaded_db.execute(text("DELETE FROM project"))
    loaded_db.execute(text("DELETE FROM project_version"))
    loaded_db.execute(text("DELETE FROM ops_event"))
    loaded_db.execute(text("DELETE FROM ops_event_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


def test_create_model_for_aa_agreement(db_for_aas):
    """
    Test creating a model for an AA Agreement.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement Name",
        requesting_agency=db_for_aas.scalar(select(AgreementAgency).where(AgreementAgency.name == "HHS")),
        servicing_agency=db_for_aas.scalar(select(AgreementAgency).where(AgreementAgency.name == "NSF")),
        service_requirement_type=ServiceRequirementType.SEVERABLE,
    )

    db_for_aas.add(aa_agreement)
    db_for_aas.commit()

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test AA Agreement Name",
        AGREEMENT_TYPE="AA",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="1087.49",
        PROC_SHOP_RATE="2.0",
    )

    user = _ensure_user(db_for_aas)
    create_models(data, user, db_for_aas)

    bli_model = db_for_aas.execute(
        select(AABudgetLineItem).join(AaAgreement).where(AaAgreement.name == "Test AA Agreement Name")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement.name == "Test AA Agreement Name"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].agreement_id == bli_model.agreement_id
    assert bli_model.versions[0].amount == Decimal("15203.08")
    assert bli_model.versions[0].status == BudgetLineItemStatus.PLANNED

    # Check history records
    history_records = (
        db_for_aas.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.row_key == str(bli_model.id))
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )
    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)

    # Cleanup
    db_for_aas.delete(bli_model)
    db_for_aas.delete(aa_agreement)
    db_for_aas.commit()


def test_create_model_for_aa_agreement_upsert(db_for_aas):
    """
    Test creating a model for an AA Agreement and then updating it.
    """
    aa_agreement = AaAgreement(
        name="Test AA Agreement Name",
        requesting_agency=db_for_aas.scalar(select(AgreementAgency).where(AgreementAgency.name == "HHS")),
        servicing_agency=db_for_aas.scalar(select(AgreementAgency).where(AgreementAgency.name == "NSF")),
        service_requirement_type=ServiceRequirementType.SEVERABLE,
    )

    db_for_aas.add(aa_agreement)
    db_for_aas.commit()

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test AA Agreement Name",
        AGREEMENT_TYPE="AA",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="1087.49",
        PROC_SHOP_RATE="2.0",
    )

    user = _ensure_user(db_for_aas)
    create_models(data, user, db_for_aas)

    bli_model = db_for_aas.execute(
        select(AABudgetLineItem).join(AaAgreement).where(AaAgreement.name == "Test AA Agreement Name")
    ).scalar_one_or_none()
    bli_id = bli_model.id

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement.name == "Test AA Agreement Name"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED

    # Check version records
    assert bli_model.versions[0].id == bli_model.id
    assert bli_model.versions[0].agreement_id == bli_model.agreement_id
    assert bli_model.versions[0].amount == Decimal("15203.08")
    assert bli_model.versions[0].status == BudgetLineItemStatus.PLANNED

    # Update data
    updated_data = BudgetLineItemData(
        ID=bli_id,
        AGREEMENT_NAME="Test AA Agreement Name",
        AGREEMENT_TYPE="AA",
        LINE_DESC="Updated Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="25000.00",
        STATUS="OPRE - CURRENT",
        COMMENTS="Updated Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="1087.49",
        PROC_SHOP_RATE="2.0",
    )

    create_models(updated_data, user, db_for_aas)

    updated_bli_model = db_for_aas.get(AABudgetLineItem, bli_id)
    assert updated_bli_model is not None
    assert updated_bli_model.id == bli_id
    assert updated_bli_model.amount == Decimal("25000.00")
    assert updated_bli_model.comments == "Updated Test Comments"
    assert updated_bli_model.line_description == "Updated Test Line Description"
    assert updated_bli_model.updated_by == user.id

    # Check version records after update
    assert len(list(updated_bli_model.versions)) == 2
    assert updated_bli_model.versions[0].id == bli_id
    assert updated_bli_model.versions[0].agreement_id == updated_bli_model.agreement_id
    assert updated_bli_model.versions[0].amount == Decimal("15203.08")
    assert updated_bli_model.versions[0].status == BudgetLineItemStatus.PLANNED
    assert updated_bli_model.versions[1].id == bli_id
    assert updated_bli_model.versions[1].agreement_id == updated_bli_model.agreement_id
    assert updated_bli_model.versions[1].amount == Decimal("25000.00")
    assert updated_bli_model.versions[1].status == BudgetLineItemStatus.PLANNED

    # Cleanup
    db_for_aas.delete(updated_bli_model)
    db_for_aas.delete(aa_agreement)
    db_for_aas.commit()


def test_create_model_with_scs(db_with_data_v2):
    """
    Test creating models with different Service Components.
    """
    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract Agreement Name",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="1087.49",
        PROC_SHOP_RATE="7.153",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    bli = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractAgreement.name == "Test Contract Agreement Name")
        .where(ContractBudgetLineItem.line_description == "Test Line Description")
    ).scalar_one_or_none()

    sc_model = db_with_data_v2.execute(
        select(ServicesComponent).where(ServicesComponent.agreement_id == bli.agreement_id)
    ).scalar_one_or_none()

    assert sc_model is not None
    assert sc_model.number == 1
    assert sc_model.optional is False
    assert sc_model.description == "SC1"
    assert bli.services_component_id == sc_model.id

    # cleanup
    db_with_data_v2.delete(bli)
    db_with_data_v2.delete(sc_model)
    db_with_data_v2.commit()


def test_create_model_for_do_agreement_upsert(db_with_data_v2):
    """
    Test creating a model for an DirectObligation Agreement and then updating it.
    """
    do_agreement = DirectAgreement(
        name="Test DO Agreement Name",
    )

    db_with_data_v2.add(do_agreement)
    db_with_data_v2.commit()

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test DO Agreement Name",
        AGREEMENT_TYPE="DO",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="1087.49",
        PROC_SHOP_RATE="2.0",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    bli_model = db_with_data_v2.execute(
        select(DirectObligationBudgetLineItem)
        .join(DirectAgreement)
        .where(DirectAgreement.name == "Test DO Agreement Name")
    ).scalar_one_or_none()
    bli_id = bli_model.id

    # Check data on the created model
    assert bli_model is not None
    assert bli_model.agreement.name == "Test DO Agreement Name"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED

    # Update data
    updated_data = BudgetLineItemData(
        ID=bli_id,
        AGREEMENT_NAME="Test DO Agreement Name",
        AGREEMENT_TYPE="DO",
        LINE_DESC="Updated Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="25000.00",
        STATUS="OPRE - CURRENT",
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC2",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="1087.49",
        PROC_SHOP_RATE="2.0",
    )

    create_models(updated_data, user, db_with_data_v2)

    updated_bli_model = db_with_data_v2.get(DirectObligationBudgetLineItem, bli_id)
    assert updated_bli_model is not None
    assert updated_bli_model.amount == Decimal("25000.00")
    assert updated_bli_model.comments == "Test Comments"
    assert updated_bli_model.line_description == "Updated Test Line Description"
    assert updated_bli_model.services_component.description == "SC2"
    assert updated_bli_model.updated_by == user.id

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(do_agreement)
    db_with_data_v2.commit()


def test_procurement_shop_set_from_fee_when_obligated(db_with_data_v2):
    """
    Test that when a budget line is OBLIGATED and has a valid procurement_shop_fee,
    the agreement's procurement_shop is set from the ProcurementShopFee object.
    """
    contract_agreement = ContractAgreement(
        name="Test Contract for Proc Shop",
        agreement_type=AgreementType.CONTRACT,
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract for Proc Shop",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OBL",  # OBLIGATED
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="152.03",  # 1% of amount
        PROC_SHOP_RATE="1.0",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    # Verify the budget line item was created with the procurement_shop_fee_id
    bli_model = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractAgreement.name == "Test Contract for Proc Shop")
    ).scalar_one_or_none()

    assert bli_model is not None
    assert bli_model.procurement_shop_fee_id is not None

    # Verify the procurement_shop_fee exists
    procurement_shop_fee = db_with_data_v2.get(ProcurementShopFee, bli_model.procurement_shop_fee_id)
    assert procurement_shop_fee is not None

    # Verify the agreement's procurement_shop matches the fee's procurement_shop
    db_with_data_v2.refresh(contract_agreement)
    assert contract_agreement.procurement_shop == procurement_shop_fee.procurement_shop
    assert contract_agreement.procurement_shop.abbr == "PROC1"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_procurement_shop_set_from_data_when_not_obligated(db_with_data_v2):
    """
    Test that when a budget line is NOT OBLIGATED, the agreement's procurement_shop
    is set from raw data, and procurement_shop_fee_id is None.
    """
    contract_agreement = ContractAgreement(
        name="Test Contract Not Obligated",
        agreement_type=AgreementType.CONTRACT,
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract Not Obligated",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OPRE - CURRENT",  # NOT OBLIGATED
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC2",
        PROC_SHOP_FEE="304.06",  # 2% of amount
        PROC_SHOP_RATE="2.0",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    # Verify the budget line item was created WITHOUT procurement_shop_fee_id
    bli_model = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractAgreement.name == "Test Contract Not Obligated")
    ).scalar_one_or_none()

    assert bli_model is not None
    assert bli_model.procurement_shop_fee_id is None  # Should be None for non-OBLIGATED

    # Verify the agreement's procurement_shop is still set from raw data
    db_with_data_v2.refresh(contract_agreement)
    assert contract_agreement.procurement_shop is not None
    assert contract_agreement.procurement_shop.abbr == "PROC2"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_procurement_shop_updated_when_fee_found(db_with_data_v2):
    """
    Test that when an agreement has one procurement_shop, but an OBLIGATED budget line
    with a different procurement_shop_fee is created, the agreement's procurement_shop
    is updated to match the fee's procurement_shop.
    """
    # Get procurement shops
    proc_shop_1 = db_with_data_v2.scalar(select(ProcurementShop).where(ProcurementShop.abbr == "PROC1"))

    # Create a contract agreement with PROC1 initially
    contract_agreement = ContractAgreement(
        name="Test Contract Shop Change",
        agreement_type=AgreementType.CONTRACT,
        procurement_shop=proc_shop_1,  # Start with PROC1
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    # Verify initial state
    db_with_data_v2.refresh(contract_agreement)
    assert contract_agreement.procurement_shop.abbr == "PROC1"

    # Create an OBLIGATED budget line with PROC2 fee
    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract Shop Change",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OBL",  # OBLIGATED
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC2",  # Different from agreement's current shop
        PROC_SHOP_FEE="304.06",  # 2% of amount (matches PROC2 fee)
        PROC_SHOP_RATE="2.0",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    # Verify the budget line item was created with the procurement_shop_fee_id
    bli_model = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractAgreement.name == "Test Contract Shop Change")
    ).scalar_one_or_none()

    assert bli_model is not None
    assert bli_model.procurement_shop_fee_id is not None

    # Verify the procurement_shop_fee is for PROC2
    procurement_shop_fee = db_with_data_v2.get(ProcurementShopFee, bli_model.procurement_shop_fee_id)
    assert procurement_shop_fee is not None
    assert procurement_shop_fee.procurement_shop.abbr == "PROC2"

    # Verify the agreement's procurement_shop was updated to PROC2
    db_with_data_v2.refresh(contract_agreement)
    assert contract_agreement.procurement_shop.abbr == "PROC2"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_procurement_shop_from_data_when_fee_not_found(db_with_data_v2):
    """
    Test that when an OBLIGATED budget line has a procurement_shop but the fee is not found,
    the agreement's procurement_shop is still set from the raw data.
    """
    contract_agreement = ContractAgreement(
        name="Test Contract Fee Not Found",
        agreement_type=AgreementType.CONTRACT,
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract Fee Not Found",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OBL",  # OBLIGATED
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC3",
        PROC_SHOP_FEE="999.99",  # Fee percentage won't match any existing fee
        PROC_SHOP_RATE="6.58",
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    # Verify the budget line item was created WITHOUT procurement_shop_fee_id
    bli_model = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractAgreement.name == "Test Contract Fee Not Found")
    ).scalar_one_or_none()

    assert bli_model is not None
    assert bli_model.procurement_shop_fee_id is None  # Fee not found

    # Verify the agreement's procurement_shop is still set from raw data
    db_with_data_v2.refresh(contract_agreement)
    assert contract_agreement.procurement_shop is not None
    assert contract_agreement.procurement_shop.abbr == "PROC3"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_procurement_shop_not_overwritten_when_bli_has_no_proc_shop(db_with_data_v2):
    """
    Test that when an agreement already has a procurement_shop, and a budget line
    is created WITHOUT a PROC_SHOP value, the agreement's procurement_shop is NOT overwritten.
    """
    # Get an existing procurement shop
    proc_shop_1 = db_with_data_v2.scalar(select(ProcurementShop).where(ProcurementShop.abbr == "PROC1"))

    # Create a contract agreement with PROC1 initially
    contract_agreement = ContractAgreement(
        name="Test Contract Keep Proc Shop",
        agreement_type=AgreementType.CONTRACT,
        procurement_shop=proc_shop_1,  # Start with PROC1
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    # Verify initial state
    db_with_data_v2.refresh(contract_agreement)
    assert contract_agreement.procurement_shop.abbr == "PROC1"

    # Create a budget line WITHOUT a PROC_SHOP value
    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract Keep Proc Shop",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OPRE - CURRENT",  # NOT OBLIGATED
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP=None,  # No procurement shop in the data
        PROC_SHOP_FEE=None,
        PROC_SHOP_RATE=None,
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    # Verify the budget line item was created
    bli_model = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractAgreement.name == "Test Contract Keep Proc Shop")
    ).scalar_one_or_none()

    assert bli_model is not None
    assert bli_model.procurement_shop_fee_id is None

    # Verify the agreement's procurement_shop was NOT overwritten and still is PROC1
    db_with_data_v2.refresh(contract_agreement)
    assert contract_agreement.procurement_shop is not None
    assert contract_agreement.procurement_shop.abbr == "PROC1"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_obligated_bli_with_missing_fee_data(db_with_data_v2):
    """
    Test that when an OBLIGATED budget line has a PROC_SHOP but is missing
    PROC_SHOP_FEE or AMOUNT, no procurement_shop_fee_id is set but the agreement
    is still updated from raw data.
    """
    contract_agreement = ContractAgreement(
        name="Test Contract Missing Fee Data",
        agreement_type=AgreementType.CONTRACT,
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    # Create an OBLIGATED budget line with PROC_SHOP but missing PROC_SHOP_FEE
    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract Missing Fee Data",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Test Line Description",
        DATE_NEEDED="3/11/25",
        AMOUNT="15203.08",
        STATUS="OBL",  # OBLIGATED
        COMMENTS="Test Comments",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE=None,  # Missing fee data
        PROC_SHOP_RATE=None,
    )

    user = _ensure_user(db_with_data_v2)

    # This should not raise an exception even with missing fee data
    create_models(data, user, db_with_data_v2)

    # Verify the budget line item was created WITHOUT procurement_shop_fee_id
    bli_model = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractAgreement.name == "Test Contract Missing Fee Data")
    ).scalar_one_or_none()

    assert bli_model is not None
    assert bli_model.procurement_shop_fee_id is None  # No fee ID because data is missing

    # Verify the agreement's procurement_shop was still set from raw data
    db_with_data_v2.refresh(contract_agreement)
    assert contract_agreement.procurement_shop is not None
    assert contract_agreement.procurement_shop.abbr == "PROC1"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


# ============================================================================
# Procurement workflow integration tests
# ============================================================================


def test_in_execution_bli_creates_procurement_records(db_with_data_v2):
    """
    An IN_EXECUTION BLI with no prior OBLIGATED BLIs on the agreement
    creates a NEW_AWARD ProcurementAction and tracker, and links the BLI.
    """
    contract_agreement = ContractAgreement(
        name="Test Contract In Execution",
        agreement_type=AgreementType.CONTRACT,
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract In Execution",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Execution Line",
        DATE_NEEDED="3/11/25",
        AMOUNT="50000.00",
        STATUS="com",
        COMMENTS="Test",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE=None,
        PROC_SHOP_RATE=None,
    )

    user = _ensure_user(db_with_data_v2)
    create_models(data, user, db_with_data_v2)

    # Verify procurement action was created
    action = db_with_data_v2.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == contract_agreement.id)
    ).scalar_one_or_none()
    assert action is not None
    assert action.award_type == AwardType.NEW_AWARD

    # Verify tracker was created with step 1 active
    tracker = db_with_data_v2.execute(
        select(DefaultProcurementTracker).where(DefaultProcurementTracker.agreement_id == contract_agreement.id)
    ).scalar_one_or_none()
    assert tracker is not None
    assert tracker.procurement_action == action.id
    step_1 = next(s for s in tracker.steps if s.step_number == 1)
    assert step_1.status == ProcurementTrackerStepStatus.ACTIVE

    # Verify BLI is linked to the action
    bli = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .join(ContractAgreement)
        .where(ContractAgreement.name == "Test Contract In Execution")
    ).scalar_one_or_none()
    assert bli.procurement_action_id == action.id

    # Verify OpsEvents were created for the procurement records (scoped to this agreement)
    action_events = [
        e
        for e in db_with_data_v2.execute(
            select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_ACTION)
        )
        .scalars()
        .all()
        if e.event_details.get("agreement_id") == contract_agreement.id
    ]
    tracker_events = [
        e
        for e in db_with_data_v2.execute(
            select(OpsEvent).where(OpsEvent.event_type == OpsEventType.CREATE_PROCUREMENT_TRACKER)
        )
        .scalars()
        .all()
        if e.event_details.get("agreement_id") == contract_agreement.id
    ]
    assert len(action_events) == 1
    assert "SpreadsheetIngest" in action_events[0].event_details["message"]
    assert len(tracker_events) == 1

    # Cleanup
    db_with_data_v2.delete(bli)
    db_with_data_v2.delete(tracker)
    db_with_data_v2.delete(action)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_in_execution_bli_with_existing_obligated_creates_modification(db_with_data_v2):
    """
    When an agreement already has OBLIGATED BLIs and a new IN_EXECUTION BLI
    is ingested, a MODIFICATION action and tracker are created.
    """
    contract_agreement = ContractAgreement(
        name="Test Contract Modification",
        agreement_type=AgreementType.CONTRACT,
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    user = _ensure_user(db_with_data_v2)

    # First, create an OBLIGATED BLI
    obligated_data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract Modification",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Obligated Line",
        DATE_NEEDED="1/15/25",
        AMOUNT="30000.00",
        STATUS="OBL",
        COMMENTS="Test",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE="300.00",
        PROC_SHOP_RATE="1.0",
    )
    create_models(obligated_data, user, db_with_data_v2)

    # Now create an IN_EXECUTION BLI — should trigger modification
    in_exec_data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test Contract Modification",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Execution Line",
        DATE_NEEDED="3/11/25",
        AMOUNT="50000.00",
        STATUS="com",
        COMMENTS="Test",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC2",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE=None,
        PROC_SHOP_RATE=None,
    )
    create_models(in_exec_data, user, db_with_data_v2)

    # Verify a MODIFICATION action was created
    mod_action = db_with_data_v2.execute(
        select(ProcurementAction)
        .where(ProcurementAction.agreement_id == contract_agreement.id)
        .where(ProcurementAction.award_type == AwardType.MODIFICATION)
    ).scalar_one_or_none()
    assert mod_action is not None

    # Verify the IN_EXECUTION BLI is linked to the modification action
    exec_bli = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .where(ContractBudgetLineItem.agreement_id == contract_agreement.id)
        .where(ContractBudgetLineItem.status == BudgetLineItemStatus.IN_EXECUTION)
    ).scalar_one_or_none()
    assert exec_bli.procurement_action_id == mod_action.id

    # The OBLIGATED BLI should NOT be linked (it wasn't IN_EXECUTION)
    obl_bli = db_with_data_v2.execute(
        select(ContractBudgetLineItem)
        .where(ContractBudgetLineItem.agreement_id == contract_agreement.id)
        .where(ContractBudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
    ).scalar_one_or_none()
    assert obl_bli.procurement_action_id is None

    # Cleanup
    for bli in (
        db_with_data_v2.execute(select(BudgetLineItem).where(BudgetLineItem.agreement_id == contract_agreement.id))
        .scalars()
        .all()
    ):
        db_with_data_v2.delete(bli)
    for tracker in (
        db_with_data_v2.execute(
            select(ProcurementTracker).where(ProcurementTracker.agreement_id == contract_agreement.id)
        )
        .scalars()
        .all()
    ):
        db_with_data_v2.delete(tracker)
    for action in (
        db_with_data_v2.execute(
            select(ProcurementAction).where(ProcurementAction.agreement_id == contract_agreement.id)
        )
        .scalars()
        .all()
    ):
        db_with_data_v2.delete(action)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_update_bli_to_in_execution_creates_procurement_records(db_with_data_v2):
    """
    Updating an existing BLI's status to IN_EXECUTION triggers
    procurement record creation.
    """
    contract_agreement = ContractAgreement(
        name="Test Contract Update To Exec",
        agreement_type=AgreementType.CONTRACT,
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    user = _ensure_user(db_with_data_v2)
    can = db_with_data_v2.scalar(select(CAN).where(CAN.number == "TestCanNumber"))

    # Create a PLANNED BLI first
    planned_bli = ContractBudgetLineItem(
        agreement_id=contract_agreement.id,
        can_id=can.id,
        budget_line_item_type=AgreementType.CONTRACT,
        line_description="Planned Line",
        amount=40000,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date(2025, 3, 11),
        created_by=user.id,
    )
    db_with_data_v2.add(planned_bli)
    db_with_data_v2.commit()
    bli_id = planned_bli.id

    # Now update it to IN_EXECUTION via the spreadsheet ingest
    update_data = BudgetLineItemData(
        ID=bli_id,
        AGREEMENT_NAME="Test Contract Update To Exec",
        AGREEMENT_TYPE="CONTRACT",
        LINE_DESC="Now Executing",
        DATE_NEEDED="3/11/25",
        AMOUNT="40000.00",
        STATUS="com",
        COMMENTS="Updated to execution",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE=None,
        PROC_SHOP_RATE=None,
    )
    create_models(update_data, user, db_with_data_v2)

    # Verify procurement records were created
    action = db_with_data_v2.execute(
        select(ProcurementAction).where(ProcurementAction.agreement_id == contract_agreement.id)
    ).scalar_one_or_none()
    assert action is not None
    assert action.award_type == AwardType.NEW_AWARD

    # Verify BLI is linked
    bli = db_with_data_v2.get(ContractBudgetLineItem, bli_id)
    assert bli.procurement_action_id == action.id

    # Cleanup
    db_with_data_v2.delete(bli)
    for tracker in (
        db_with_data_v2.execute(
            select(ProcurementTracker).where(ProcurementTracker.agreement_id == contract_agreement.id)
        )
        .scalars()
        .all()
    ):
        db_with_data_v2.delete(tracker)
    db_with_data_v2.delete(action)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_planned_bli_does_not_create_procurement_records(db_with_data_v2):
    """
    A PLANNED BLI should NOT create any procurement records.
    """
    user = _ensure_user(db_with_data_v2)

    grant_agreement = db_with_data_v2.scalar(
        select(GrantAgreement).where(
            GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        )
    )

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        AGREEMENT_TYPE="GRANT",
        LINE_DESC="Planned Only",
        DATE_NEEDED="3/11/25",
        AMOUNT="10000.00",
        STATUS="OPRE - CURRENT",
        COMMENTS="No procurement needed",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE=None,
        PROC_SHOP_RATE=None,
    )
    create_models(data, user, db_with_data_v2)

    # No procurement records should exist for this agreement
    actions = (
        db_with_data_v2.execute(select(ProcurementAction).where(ProcurementAction.agreement_id == grant_agreement.id))
        .scalars()
        .all()
    )
    assert len(actions) == 0

    trackers = (
        db_with_data_v2.execute(select(ProcurementTracker).where(ProcurementTracker.agreement_id == grant_agreement.id))
        .scalars()
        .all()
    )
    assert len(trackers) == 0

    # Cleanup
    bli = db_with_data_v2.execute(
        select(GrantBudgetLineItem)
        .where(GrantBudgetLineItem.agreement_id == grant_agreement.id)
        .where(GrantBudgetLineItem.line_description == "Planned Only")
    ).scalar_one_or_none()
    db_with_data_v2.delete(bli)
    db_with_data_v2.commit()


def test_in_execution_grant_does_not_create_procurement_records(db_with_data_v2):
    """
    An IN_EXECUTION BLI on a GRANT agreement should NOT create procurement records.
    Procurement tracker creation only applies to CONTRACT, IAA, and AA types.
    """
    user = _ensure_user(db_with_data_v2)

    grant_agreement = db_with_data_v2.scalar(
        select(GrantAgreement).where(
            GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        )
    )

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Grant #1: Early Care and Education Leadership Study (ExCELS)",
        AGREEMENT_TYPE="GRANT",
        LINE_DESC="Grant In Execution",
        DATE_NEEDED="3/11/25",
        AMOUNT="50000.00",
        STATUS="com",
        COMMENTS="Should not create procurement records",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE=None,
        PROC_SHOP_RATE=None,
    )
    create_models(data, user, db_with_data_v2)

    actions = (
        db_with_data_v2.execute(select(ProcurementAction).where(ProcurementAction.agreement_id == grant_agreement.id))
        .scalars()
        .all()
    )
    assert len(actions) == 0

    trackers = (
        db_with_data_v2.execute(select(ProcurementTracker).where(ProcurementTracker.agreement_id == grant_agreement.id))
        .scalars()
        .all()
    )
    assert len(trackers) == 0

    # Cleanup
    bli = db_with_data_v2.execute(
        select(GrantBudgetLineItem)
        .where(GrantBudgetLineItem.agreement_id == grant_agreement.id)
        .where(GrantBudgetLineItem.line_description == "Grant In Execution")
    ).scalar_one_or_none()
    db_with_data_v2.delete(bli)
    db_with_data_v2.commit()


def test_in_execution_direct_obligation_does_not_create_procurement_records(db_with_data_v2):
    """
    An IN_EXECUTION BLI on a DIRECT_OBLIGATION agreement should NOT create procurement records.
    """
    do_agreement = DirectAgreement(
        name="Test DO In Execution",
    )
    db_with_data_v2.add(do_agreement)
    db_with_data_v2.commit()

    user = _ensure_user(db_with_data_v2)

    data = BudgetLineItemData(
        ID="new",
        AGREEMENT_NAME="Test DO In Execution",
        AGREEMENT_TYPE="DIRECT OBLIGATION",
        LINE_DESC="DO In Execution",
        DATE_NEEDED="3/11/25",
        AMOUNT="50000.00",
        STATUS="com",
        COMMENTS="Should not create procurement records",
        CAN="TestCanNumber (TestCanNickname)",
        SC="SC1",
        PROC_SHOP="PROC1",
        PROC_SHOP_FEE=None,
        PROC_SHOP_RATE=None,
    )
    create_models(data, user, db_with_data_v2)

    actions = (
        db_with_data_v2.execute(select(ProcurementAction).where(ProcurementAction.agreement_id == do_agreement.id))
        .scalars()
        .all()
    )
    assert len(actions) == 0

    trackers = (
        db_with_data_v2.execute(select(ProcurementTracker).where(ProcurementTracker.agreement_id == do_agreement.id))
        .scalars()
        .all()
    )
    assert len(trackers) == 0

    # Cleanup
    bli = db_with_data_v2.execute(
        select(DirectObligationBudgetLineItem).where(DirectObligationBudgetLineItem.agreement_id == do_agreement.id)
    ).scalar_one_or_none()
    db_with_data_v2.delete(bli)
    db_with_data_v2.delete(do_agreement)
    db_with_data_v2.commit()


def test_in_execution_bli_idempotent_procurement_records(db_with_data_v2):
    """
    Creating two IN_EXECUTION BLIs on the same agreement reuses the same
    ProcurementAction and tracker — no duplicates.
    """
    contract_agreement = ContractAgreement(
        name="Test Contract Idempotent",
        agreement_type=AgreementType.CONTRACT,
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    user = _ensure_user(db_with_data_v2)

    for desc in ("Line A", "Line B"):
        data = BudgetLineItemData(
            ID="new",
            AGREEMENT_NAME="Test Contract Idempotent",
            AGREEMENT_TYPE="CONTRACT",
            LINE_DESC=desc,
            DATE_NEEDED="3/11/25",
            AMOUNT="25000.00",
            STATUS="com",
            COMMENTS="Test",
            CAN="TestCanNumber (TestCanNickname)",
            SC="SC1",
            PROC_SHOP="PROC1",
            PROC_SHOP_FEE=None,
            PROC_SHOP_RATE=None,
        )
        create_models(data, user, db_with_data_v2)

    # Only one action and one tracker
    actions = (
        db_with_data_v2.execute(
            select(ProcurementAction).where(ProcurementAction.agreement_id == contract_agreement.id)
        )
        .scalars()
        .all()
    )
    assert len(actions) == 1

    trackers = (
        db_with_data_v2.execute(
            select(ProcurementTracker).where(ProcurementTracker.agreement_id == contract_agreement.id)
        )
        .scalars()
        .all()
    )
    assert len(trackers) == 1

    # Both BLIs linked to the same action
    blis = (
        db_with_data_v2.execute(
            select(ContractBudgetLineItem).where(ContractBudgetLineItem.agreement_id == contract_agreement.id)
        )
        .scalars()
        .all()
    )
    assert len(blis) == 2
    assert all(b.procurement_action_id == actions[0].id for b in blis)

    # Cleanup
    for bli in blis:
        db_with_data_v2.delete(bli)
    for tracker in trackers:
        db_with_data_v2.delete(tracker)
    for action in actions:
        db_with_data_v2.delete(action)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()
