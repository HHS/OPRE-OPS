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
from data_tools.tests.conftest import loaded_db
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
    Portfolio,
    ProcurementShop,
    ProcurementShopFee,
    ResearchProject,
    ServiceRequirementType,
    ServicesComponent,
    User,
)

file_path = os.path.join(os.path.dirname(__file__), "../../test_csv/master_spreadsheet_budget_lines_v2.tsv")


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open(file_path), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 10
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
    assert len(test_data) == 10
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 10


@pytest.fixture()
def db_with_data_v2(loaded_db):
    # Clean up existing Budget Line Items
    for bli in loaded_db.execute(select(BudgetLineItem)).scalars().all():
        loaded_db.delete(bli)
    loaded_db.commit()

    # Create test division
    division = loaded_db.get(Division, 1)
    if not division:
        division = Division(
            id=1,
            name="Test Division",
            abbreviation="TD",
        )
    loaded_db.add(division)

    # Create test portfolio
    portfolio = loaded_db.get(Portfolio, 1)
    if not portfolio:
        portfolio = Portfolio(
            id=1,
            name="Test Portfolio",
            division_id=1,
        )
    loaded_db.add(portfolio)
    loaded_db.commit()

    # Create test Procurement Shop
    procurement_shop_proc1 = ProcurementShop(
        name="Procurement Shop 1",
        abbr="PROC1",
    )
    procurement_shop_proc2 = ProcurementShop(
        name="Procurement Shop 2",
        abbr="PROC2",
    )
    procurement_shop_proc3 = ProcurementShop(
        name="Procurement Shop 3",
        abbr="PROC3",
    )
    loaded_db.add(procurement_shop_proc1)
    loaded_db.add(procurement_shop_proc2)
    loaded_db.add(procurement_shop_proc3)
    loaded_db.commit()

    procurement_shop_proc1_fee = ProcurementShopFee(
        procurement_shop_id=procurement_shop_proc1.id,
        fee=Decimal("1.0"),
    )
    procurement_shop_proc2_fee = ProcurementShopFee(
        procurement_shop_id=procurement_shop_proc2.id,
        fee=Decimal("2.0"),
    )
    procurement_shop_proc3_fee = ProcurementShopFee(
        procurement_shop_id=procurement_shop_proc3.id,
        fee=Decimal("3.0"),
    )
    loaded_db.add(procurement_shop_proc1_fee)
    loaded_db.add(procurement_shop_proc2_fee)
    loaded_db.add(procurement_shop_proc3_fee)
    loaded_db.commit()

    # Create test agreements
    g_agreement = loaded_db.get(GrantAgreement, 1)
    if not g_agreement:
        grant_agreement = GrantAgreement(
            id=1,
            name="Grant #1: Early Care and Education Leadership Study (ExCELS)",
            agreement_type=AgreementType.GRANT,
        )
        loaded_db.add(grant_agreement)
    else:
        g_agreement.name = "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        g_agreement.agreement_type = AgreementType.GRANT
        loaded_db.add(g_agreement)
    loaded_db.commit()

    c_agreement = loaded_db.get(ContractAgreement, 2)
    if not c_agreement:
        contract_agreement = ContractAgreement(
            id=2,
            name="Test Contract Agreement Name",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(contract_agreement)
    else:
        c_agreement.name = "Test Contract Agreement Name"
        c_agreement.agreement_type = AgreementType.CONTRACT
        loaded_db.add(c_agreement)
    loaded_db.commit()

    # Create test CAN
    can = loaded_db.get(CAN, 1)
    if not can:
        can = CAN(
            id=1,
            number="TestCanNumber",
            portfolio_id=1,
        )
        loaded_db.add(can)
    else:
        can.number = "TestCanNumber"
        can.portfolio_id = 1
        loaded_db.add(can)
    loaded_db.commit()

    yield loaded_db

    if g_agreement:
        loaded_db.delete(g_agreement)
    if c_agreement:
        loaded_db.delete(c_agreement)
    loaded_db.delete(procurement_shop_proc1)
    loaded_db.delete(procurement_shop_proc2)
    loaded_db.delete(procurement_shop_proc3)
    loaded_db.delete(procurement_shop_proc1_fee)
    loaded_db.delete(procurement_shop_proc2_fee)
    loaded_db.delete(procurement_shop_proc3_fee)
    loaded_db.commit()

    clean_up_db(loaded_db)


def clean_up_db(session):
    session.execute(text("DELETE FROM procurement_shop"))
    session.execute(text("DELETE FROM procurement_shop_version"))

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

    session.execute(text("DELETE FROM agreement_mod"))
    session.execute(text("DELETE FROM agreement_mod_version"))

    session.execute(text("DELETE FROM can_history"))
    session.execute(text("DELETE FROM can_history_version"))

    session.execute(text("DELETE FROM can"))
    session.execute(text("DELETE FROM can_version"))

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

    user = db_with_data_v2.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

    create_models(data, user, db_with_data_v2)

    bli_model = db_with_data_v2.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == 1
    assert bli_model.can_id == 1

    bli_agreement = db_with_data_v2.get(GrantAgreement, 1)
    assert bli_model.agreement == bli_agreement
    assert bli_agreement.awarding_entity_id == db_with_data_v2.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

    bli_can = db_with_data_v2.get(CAN, 1)
    assert bli_model.can == bli_can

    assert bli_model.budget_line_item_type == AgreementType.GRANT
    assert bli_model.line_description == "Test Line Description"
    assert bli_model.comments == "Test Comments"
    assert bli_model.amount == Decimal("15203.08")
    assert bli_model.status == BudgetLineItemStatus.PLANNED
    assert bli_model.date_needed == date(2025, 3, 11)
    assert bli_model.procurement_shop_fee_id is None
    assert bli_model.created_by == 1

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
    assert bli_model.versions[0].agreement_id == 1
    assert bli_model.versions[0].can_id == 1
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
    existing_bli = ContractBudgetLineItem(
        # id=existing_bli_id,
        agreement_id=2,
        can_id=1,
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

    user = db_with_data_v2.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

    create_models(data, user, db_with_data_v2)

    bli = db_with_data_v2.get(ContractBudgetLineItem, existing_bli.id)
    assert bli is not None
    assert bli.id == existing_bli.id
    assert bli.agreement_id == 2
    assert bli.can_id == 1
    assert bli.budget_line_item_type == AgreementType.CONTRACT
    assert bli.line_description == "Test Line Description"
    assert bli.comments == "Test Comments"
    assert bli.amount == Decimal("15203.08")
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert bli.date_needed == date(2025, 3, 11)
    assert bli.proc_shop_fee_percentage == Decimal("0.015")

    # Check version records
    assert bli.versions[1].id == existing_bli.id
    assert bli.versions[1].agreement_id == 2
    assert bli.versions[1].can_id == 1
    assert bli.versions[1].budget_line_item_type == AgreementType.CONTRACT
    assert bli.versions[1].line_description == "Test Line Description"
    assert bli.versions[1].comments == "Test Comments"
    assert bli.versions[1].amount == Decimal("15203.08")
    assert bli.versions[1].status == BudgetLineItemStatus.PLANNED
    assert bli.versions[1].date_needed == date(2025, 3, 11)
    assert bli.versions[1].proc_shop_fee_percentage == Decimal("0.015")

    assert bli.versions[0].id == existing_bli.id
    assert bli.versions[0].agreement_id == 2
    assert bli.versions[0].can_id == 1
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

    assert len(all_blis) == 6

    # Check Grant Budget Line Item
    grant_bli = db_with_data_v2.scalar(
        select(GrantBudgetLineItem).where(
            GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)"
        )
    )
    assert grant_bli.agreement.awarding_entity_id == db_with_data_v2.scalar(
        select(ProcurementShop.id).where(ProcurementShop.abbr == "PROC1")
    )

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

    user = db_with_data_v2.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

    create_models(data, user, db_with_data_v2)

    bli_model = db_with_data_v2.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
        .where(GrantBudgetLineItem.status == BudgetLineItemStatus.OBLIGATED)
        .where(GrantBudgetLineItem.line_description == "Test Line Description")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == 1
    assert bli_model.can_id == 1

    bli_agreement = db_with_data_v2.get(GrantAgreement, 1)
    assert bli_model.agreement == bli_agreement
    assert bli_agreement.awarding_entity_id == db_with_data_v2.scalar(
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

    user = db_with_data_v2.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

    create_models(data, user, db_with_data_v2)

    bli_model = db_with_data_v2.execute(
        select(GrantBudgetLineItem)
        .join(GrantAgreement)
        .where(GrantAgreement.name == "Grant #1: Early Care and Education Leadership Study (ExCELS)")
    ).scalar_one_or_none()

    # Check data on the created model
    assert bli_model.id != 0
    assert bli_model.agreement_id == 1
    assert bli_model.can_id == 1

    bli_agreement = db_with_data_v2.get(GrantAgreement, 1)
    assert bli_model.agreement == bli_agreement
    assert bli_agreement.awarding_entity_id == db_with_data_v2.scalar(
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

    user = db_for_aas.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_for_aas.add(user)
        db_for_aas.commit()

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

    user = db_for_aas.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_for_aas.add(user)
        db_for_aas.commit()

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
    assert updated_bli_model.updated_by == 1

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

    user = db_with_data_v2.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

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
        id=3,
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

    user = db_with_data_v2.get(User, 1)

    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

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
    assert updated_bli_model.updated_by == 1

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(do_agreement)
    db_with_data_v2.commit()


def test_procurement_shop_set_from_fee_when_obligated(db_with_data_v2):
    """
    Test that when a budget line is OBLIGATED and has a valid procurement_shop_fee,
    the agreement's procurement_shop is set from the ProcurementShopFee object.
    """
    # Create a contract agreement with no procurement shop initially
    contract_agreement = ContractAgreement(
        id=10,
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

    user = db_with_data_v2.get(User, 1)
    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

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
    agreement = db_with_data_v2.get(ContractAgreement, 10)
    assert agreement.procurement_shop == procurement_shop_fee.procurement_shop
    assert agreement.procurement_shop.abbr == "PROC1"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_procurement_shop_set_from_data_when_not_obligated(db_with_data_v2):
    """
    Test that when a budget line is NOT OBLIGATED, the agreement's procurement_shop
    is set from raw data, and procurement_shop_fee_id is None.
    """
    # Create a contract agreement with no procurement shop initially
    contract_agreement = ContractAgreement(
        id=11,
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

    user = db_with_data_v2.get(User, 1)
    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

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
    agreement = db_with_data_v2.get(ContractAgreement, 11)
    assert agreement.procurement_shop is not None
    assert agreement.procurement_shop.abbr == "PROC2"

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
        id=12,
        name="Test Contract Shop Change",
        agreement_type=AgreementType.CONTRACT,
        procurement_shop=proc_shop_1,  # Start with PROC1
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    # Verify initial state
    agreement = db_with_data_v2.get(ContractAgreement, 12)
    assert agreement.procurement_shop.abbr == "PROC1"

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

    user = db_with_data_v2.get(User, 1)
    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

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
    db_with_data_v2.refresh(agreement)
    assert agreement.procurement_shop.abbr == "PROC2"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()


def test_procurement_shop_from_data_when_fee_not_found(db_with_data_v2):
    """
    Test that when an OBLIGATED budget line has a procurement_shop but the fee is not found,
    the agreement's procurement_shop is still set from the raw data.
    """
    # Create a contract agreement with no procurement shop initially
    contract_agreement = ContractAgreement(
        id=13,
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

    user = db_with_data_v2.get(User, 1)
    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

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
    agreement = db_with_data_v2.get(ContractAgreement, 13)
    assert agreement.procurement_shop is not None
    assert agreement.procurement_shop.abbr == "PROC3"

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
        id=14,
        name="Test Contract Keep Proc Shop",
        agreement_type=AgreementType.CONTRACT,
        procurement_shop=proc_shop_1,  # Start with PROC1
    )
    db_with_data_v2.add(contract_agreement)
    db_with_data_v2.commit()

    # Verify initial state
    agreement = db_with_data_v2.get(ContractAgreement, 14)
    assert agreement.procurement_shop.abbr == "PROC1"

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

    user = db_with_data_v2.get(User, 1)
    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

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
    db_with_data_v2.refresh(agreement)
    assert agreement.procurement_shop is not None
    assert agreement.procurement_shop.abbr == "PROC1"

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
    # Create a contract agreement with no procurement shop initially
    contract_agreement = ContractAgreement(
        id=15,
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

    user = db_with_data_v2.get(User, 1)
    if not user:
        user = User(id=1, email="system.admin@localhost")
        db_with_data_v2.add(user)
        db_with_data_v2.commit()

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
    agreement = db_with_data_v2.get(ContractAgreement, 15)
    assert agreement.procurement_shop is not None
    assert agreement.procurement_shop.abbr == "PROC1"

    # Cleanup
    db_with_data_v2.delete(bli_model)
    db_with_data_v2.delete(contract_agreement)
    db_with_data_v2.commit()
