import csv
from datetime import date
from decimal import Decimal

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_direct_obligation_budget_lines.utils import (
    BudgetLineItemData,
    create_budget_line_item_data,
    create_models,
    validate_data,
)
from sqlalchemy import and_, select, text

from models import *  # noqa: F403, F401


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open("./test_csv/direct_obligation_blis.tsv"), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 50
    record = test_data[0]

    # Create direct obligation data object
    do_data = create_budget_line_item_data(record)

    # System ID assertions
    assert do_data.SYS_DIRECT_OBLIGATION_ID == 1
    assert do_data.SYS_BUDGET_ID == 1
    assert do_data.PROJECT_OFFICER_USER_ID == 1
    assert do_data.SYS_CAN_ID == 1

    # Reference number assertions
    assert do_data.REQUISITION_NBR == "ACF0001"
    assert do_data.IP_NBR == "IPREG12ACF01"

    # Date assertions
    assert do_data.DATE_NEEDED == date(2012, 9, 30)

    # Status and flags
    assert do_data.STATUS == BudgetLineItemStatus.OBLIGATED

    # Financial data
    assert do_data.OBJECT_CLASS_CODE == 25103
    assert do_data.AMOUNT == 159.0
    assert do_data.OVERWRITE_PSC_FEE_RATE == 0.0

    # Description fields
    assert do_data.LINE_DESCRIPTION == "Charges"
    assert do_data.COMMENTS == "Program Evaluation"
    assert do_data.RECEIVING_AGENCY == "OPRE"


def test_validate_data():
    test_data = list(csv.DictReader(open("./test_csv/direct_obligation_blis.tsv"), dialect="excel-tab"))
    assert len(test_data) == 50
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 50


def test_create_models_no_direct_obligation_id():
    with pytest.raises(ValueError):
        BudgetLineItemData(
            SYS_DIRECT_OBLIGATION_ID=None,
        )


@pytest.fixture()
def db_for_test(loaded_db):
    agreement = DirectAgreement(
        id=1,
        name="Test Direct Obligation Agreement",
        maps_sys_id=1,
    )

    loaded_db.add(agreement)
    loaded_db.commit()

    user = User(
        id=1,
        email="test.user@localhost",
    )

    loaded_db.add(user)
    loaded_db.commit()

    yield loaded_db
    loaded_db.rollback()

    loaded_db.execute(text("DELETE FROM object_class_code"))
    loaded_db.execute(text("DELETE FROM object_class_code_version"))
    loaded_db.execute(text("DELETE FROM direct_obligation_budget_line_item"))
    loaded_db.execute(text("DELETE FROM direct_obligation_budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.execute(text("DELETE FROM budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM can_history"))
    loaded_db.execute(text("DELETE FROM can_history_version"))
    loaded_db.execute(text("DELETE FROM can"))
    loaded_db.execute(text("DELETE FROM can_version"))
    loaded_db.execute(text("DELETE FROM direct_agreement"))
    loaded_db.execute(text("DELETE FROM direct_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


@pytest.fixture()
def db_for_test_with_data(db_for_test):
    division = db_for_test.get(Division, 1)

    if not division:
        division = Division(
            id=1,
            name="Test Division",
            abbreviation="TD",
        )

    portfolio = db_for_test.get(Portfolio, 1)

    if not portfolio:
        portfolio = Portfolio(
            id=1,
            name="Test Portfolio",
            division_id=1,
        )

    can = CAN(
        id=1,
        number="Test CAN",
        portfolio_id=1,
    )

    object_class_code = ObjectClassCode(
        id=1,
        code=25103,
        description="Test Object Class Code",
    )

    db_for_test.add(object_class_code)
    db_for_test.add(division)
    db_for_test.add(portfolio)
    db_for_test.add(can)
    db_for_test.commit()

    yield db_for_test

    db_for_test.rollback()

    db_for_test.execute(text("DELETE FROM direct_obligation_budget_line_item"))
    db_for_test.execute(text("DELETE FROM direct_obligation_budget_line_item_version"))
    db_for_test.execute(text("DELETE FROM budget_line_item"))
    db_for_test.execute(text("DELETE FROM budget_line_item_version"))
    db_for_test.execute(text("DELETE FROM can_history"))
    db_for_test.execute(text("DELETE FROM can_history_version"))
    db_for_test.execute(text("DELETE FROM can"))
    db_for_test.execute(text("DELETE FROM can_version"))
    db_for_test.execute(text("DELETE FROM direct_agreement"))
    db_for_test.execute(text("DELETE FROM direct_agreement_version"))
    db_for_test.execute(text("DELETE FROM agreement"))
    db_for_test.execute(text("DELETE FROM agreement_version"))
    db_for_test.execute(text("DELETE FROM ops_user"))
    db_for_test.execute(text("DELETE FROM ops_user_version"))
    db_for_test.execute(text("DELETE FROM ops_db_history"))
    db_for_test.execute(text("DELETE FROM ops_db_history_version"))
    db_for_test.commit()


def test_create_models(db_for_test_with_data):
    data = BudgetLineItemData(
        SYS_DIRECT_OBLIGATION_ID=1,
        SYS_BUDGET_ID=1,
        PROJECT_OFFICER_USER_ID=1,
        SYS_CAN_ID=1,
        RECEIVING_AGENCY="Sample Agency",
        IP_NBR="IP-001",
        REQUISITION_NBR="REQD-001",
        DATE_NEEDED="2025-09-30",
        STATUS=BudgetLineItemStatus.OBLIGATED.name,
        OBJECT_CLASS_CODE=25103,
        AMOUNT=123.45,
        OVERWRITE_PSC_FEE_RATE=0.01,
        LINE_DESCRIPTION="Direct Obligation Line Description #1",
        COMMENTS="DO Comment #1",
    )

    sys_user = User(
        email="system.admin@localhost",
    )

    create_models(data, sys_user, db_for_test_with_data)

    bli_model = db_for_test_with_data.execute(
        select(DirectObligationBudgetLineItem).join(Agreement).where(Agreement.maps_sys_id == 1)
    ).scalar()

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Direct Obligation Line Description #1"
    assert bli_model.comments == "DO Comment #1"
    assert bli_model.can_id == 1
    assert bli_model.receiving_agency == "Sample Agency"
    assert bli_model.ip_nbr == "IP-001"
    assert bli_model.amount == Decimal("123.45")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.date_needed == date(2025, 9, 30)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.01")
    assert bli_model.object_class_code.id == 1
    assert bli_model.object_class_code.code == 25103
    assert bli_model.object_class_code.description == "Test Object Class Code"
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None
    assert bli_model.display_name == "BL 1"
    assert bli_model.portfolio_id == 1
    assert bli_model.fiscal_year == 2025


def test_main(db_for_test_with_data):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "direct_obligation_budget_lines",
            "--input-csv",
            "./test_csv/direct_obligation_blis.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = get_or_create_sys_user(db_for_test_with_data)

    bli_model = db_for_test_with_data.get(DirectObligationBudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Charges"
    assert bli_model.comments == "Program Evaluation"
    assert bli_model.can_id == 1
    assert bli_model.receiving_agency == "OPRE"
    assert bli_model.ip_nbr == "IPREG12ACF01"
    assert bli_model.amount == Decimal("159.00")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.date_needed == date(2012, 9, 30)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.0")
    assert bli_model.object_class_code.id == 1
    assert bli_model.object_class_code.code == 25103
    assert bli_model.object_class_code.description == "Test Object Class Code"
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None
    assert bli_model.display_name == "BL 1"
    assert bli_model.portfolio_id == 1
    assert bli_model.fiscal_year == 2012

    history_objs = (
        db_for_test_with_data.execute(
            select(OpsDBHistory).where(OpsDBHistory.class_name == "DirectObligationBudgetLineItem")
        )
        .scalars()
        .all()
    )
    assert len(history_objs) == 50

    bli_1_history = (
        db_for_test_with_data.execute(
            select(OpsDBHistory).where(
                and_(
                    OpsDBHistory.row_key == str(bli_model.id),
                    OpsDBHistory.class_name == "DirectObligationBudgetLineItem",
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(bli_1_history) == 1


def test_create_models_upsert(db_for_test_with_data):
    sys_user = get_or_create_sys_user(db_for_test_with_data)

    data_1 = BudgetLineItemData(
        SYS_DIRECT_OBLIGATION_ID=1,
        SYS_BUDGET_ID=1,
        PROJECT_OFFICER_USER_ID=1,
        SYS_CAN_ID=1,
        RECEIVING_AGENCY="Sample Agency",
        IP_NBR="IP-001",
        REQUISITION_NBR="REQD-001",
        DATE_NEEDED="2025-09-30",
        STATUS=BudgetLineItemStatus.OBLIGATED.name,
        OBJECT_CLASS_CODE=25103,
        AMOUNT=123.45,
        OVERWRITE_PSC_FEE_RATE=0.01,
        LINE_DESCRIPTION="Direct Obligation Line Description #1",
        COMMENTS="DO Comment #1",
    )

    # update the line description
    data_2 = BudgetLineItemData(
        SYS_DIRECT_OBLIGATION_ID=1,
        SYS_BUDGET_ID=1,
        PROJECT_OFFICER_USER_ID=1,
        SYS_CAN_ID=1,
        RECEIVING_AGENCY="Sample Agency",
        IP_NBR="IP-001",
        REQUISITION_NBR="REQD-001",
        DATE_NEEDED="2025-09-30",
        STATUS=BudgetLineItemStatus.OBLIGATED.name,
        OBJECT_CLASS_CODE=25103,
        AMOUNT=123.45,
        OVERWRITE_PSC_FEE_RATE=0.01,
        LINE_DESCRIPTION="Direct Obligation Line Description #1 Updated",
        COMMENTS="DO Comment #1",
    )

    # update receiving agency
    data_3 = BudgetLineItemData(
        SYS_DIRECT_OBLIGATION_ID=1,
        SYS_BUDGET_ID=1,
        PROJECT_OFFICER_USER_ID=1,
        SYS_CAN_ID=1,
        RECEIVING_AGENCY="Updated Agency",
        IP_NBR="IP-001",
        REQUISITION_NBR="REQD-001",
        DATE_NEEDED="2025-09-30",
        STATUS=BudgetLineItemStatus.OBLIGATED.name,
        OBJECT_CLASS_CODE=25103,
        AMOUNT=123.45,
        OVERWRITE_PSC_FEE_RATE=0.01,
        LINE_DESCRIPTION="Direct Obligation Line Description #1 Updated",
        COMMENTS="DO Comment #1",
    )

    create_models(data_1, sys_user, db_for_test_with_data)

    # make sure the data was loaded
    bli_model = db_for_test_with_data.get(DirectObligationBudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Direct Obligation Line Description #1"
    assert bli_model.comments == "DO Comment #1"
    assert bli_model.can_id == 1
    assert bli_model.receiving_agency == "Sample Agency"
    assert bli_model.ip_nbr == "IP-001"
    assert bli_model.amount == Decimal("123.45")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.date_needed == date(2025, 9, 30)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.01")
    assert bli_model.object_class_code.id == 1
    assert bli_model.object_class_code.code == 25103
    assert bli_model.object_class_code.description == "Test Object Class Code"
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None
    assert bli_model.display_name == "BL 1"
    assert bli_model.portfolio_id == 1
    assert bli_model.fiscal_year == 2025

    # make sure the history records are created
    history_record = db_for_test_with_data.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "DirectObligationBudgetLineItem")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.NEW
    assert history_record.row_key == str(bli_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the line description
    create_models(data_2, sys_user, db_for_test_with_data)

    # make sure the data was loaded
    bli_model = db_for_test_with_data.get(DirectObligationBudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Direct Obligation Line Description #1 Updated"
    assert bli_model.comments == "DO Comment #1"
    assert bli_model.can_id == 1
    assert bli_model.receiving_agency == "Sample Agency"
    assert bli_model.ip_nbr == "IP-001"
    assert bli_model.amount == Decimal("123.45")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.date_needed == date(2025, 9, 30)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.01")
    assert bli_model.object_class_code.id == 1
    assert bli_model.object_class_code.code == 25103
    assert bli_model.object_class_code.description == "Test Object Class Code"
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None
    assert bli_model.display_name == "BL 1"
    assert bli_model.portfolio_id == 1
    assert bli_model.fiscal_year == 2025

    # Check version info
    assert len([v for v in bli_model.versions]) >= 2
    assert bli_model.versions[1].line_description == "Direct Obligation Line Description #1 Updated"

    # make sure the history records are created
    history_record = db_for_test_with_data.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "DirectObligationBudgetLineItem")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(bli_model.id)
    assert history_record.created_by == sys_user.id

    # upsert the same data - change the receiving agency
    create_models(data_3, sys_user, db_for_test_with_data)

    # make sure the data was loaded
    bli_model = db_for_test_with_data.get(DirectObligationBudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Direct Obligation Line Description #1 Updated"
    assert bli_model.comments == "DO Comment #1"
    assert bli_model.can_id == 1
    assert bli_model.receiving_agency == "Updated Agency"
    assert bli_model.ip_nbr == "IP-001"
    assert bli_model.amount == Decimal("123.45")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.date_needed == date(2025, 9, 30)
    assert bli_model.proc_shop_fee_percentage == Decimal("0.01")
    assert bli_model.object_class_code.id == 1
    assert bli_model.object_class_code.code == 25103
    assert bli_model.object_class_code.description == "Test Object Class Code"
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None
    assert bli_model.display_name == "BL 1"
    assert bli_model.portfolio_id == 1
    assert bli_model.fiscal_year == 2025

    # Check version info
    assert len([v for v in bli_model.versions]) >= 3
    assert bli_model.versions[2].line_description == "Direct Obligation Line Description #1 Updated"
    assert bli_model.versions[2].receiving_agency == "Updated Agency"

    # make sure the history records are created
    history_record = db_for_test_with_data.execute(
        select(OpsDBHistory)
        .where(OpsDBHistory.class_name == "DirectObligationBudgetLineItem")
        .order_by(OpsDBHistory.created_on.desc())
    ).scalar()
    assert history_record is not None
    assert history_record.event_type == OpsDBHistoryType.UPDATED
    assert history_record.row_key == str(bli_model.id)
    assert history_record.created_by == sys_user.id
