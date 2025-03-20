import csv
from datetime import date
from decimal import Decimal
from json import load

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_data import main
from data_tools.src.load_iaa_budget_lines.utils import (
    IAABudgetLineItemData,
    create_budget_line_item_data,
    create_models,
    validate_data,
)
from sqlalchemy import and_, select, text

from models import *  # noqa: F403, F401


def test_create_iaa_budget_line_data():
    test_data = list(csv.DictReader(open("./test_csv/iaa_budget_lines.tsv"), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 50
    record = test_data[0]

    # Create data object
    data = create_budget_line_item_data(record)

    # Check data object
    assert data.SYS_IAA_ID == 1
    assert data.SYS_BUDGET_ID == 201
    assert data.DOC_RECEIVED is True
    assert data.IP_NBR == "IPIAA22ACF12345"
    assert data.LINE_DESCRIPTION == "Data Collection Services"
    assert data.COMMENTS == "Initial funding"
    assert data.DATE_NEEDED == date(2022, 9, 30)
    assert data.SYS_CAN_ID == 1
    assert data.AMOUNT == 25000.0
    assert data.STATUS == BudgetLineItemStatus.OBLIGATED
    assert data.OVERWRITE_PSC_FEE_RATE == 0.0


def test_iaa_budget_line_validate_data():
    test_data = list(csv.DictReader(open("./test_csv/iaa_budget_lines.tsv"), dialect="excel-tab"))
    assert len(test_data) == 50
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 50


def test_create_iaa_budget_line_models_no_iaa_id():
    with pytest.raises(ValueError):
        IAABudgetLineItemData(
            SYS_IAA_ID=None,
        )


@pytest.fixture()
def db_for_iaa_test(loaded_db):
    iaa = IaaAgreement(
        id=1,
        name="Test IAA",
        maps_sys_id=1,
        direction=IAADirectionType.OUTGOING
    )

    loaded_db.add(iaa)
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
    loaded_db.execute(text("DELETE FROM iaa_budget_line_item"))
    loaded_db.execute(text("DELETE FROM iaa_budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.execute(text("DELETE FROM budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM can_history"))
    loaded_db.execute(text("DELETE FROM can_history_version"))
    loaded_db.execute(text("DELETE FROM can"))
    loaded_db.execute(text("DELETE FROM can_version"))
    loaded_db.execute(text("DELETE FROM iaa_agreement"))
    loaded_db.execute(text("DELETE FROM iaa_agreement_version"))
    loaded_db.execute(text("DELETE FROM agreement"))
    loaded_db.execute(text("DELETE FROM agreement_version"))
    loaded_db.execute(text("DELETE FROM ops_user"))
    loaded_db.execute(text("DELETE FROM ops_user_version"))
    loaded_db.execute(text("DELETE FROM ops_db_history"))
    loaded_db.execute(text("DELETE FROM ops_db_history_version"))
    loaded_db.commit()


@pytest.fixture()
def db_for_iaa_test_with_data(db_for_iaa_test):
    division = db_for_iaa_test.get(Division, 1)

    if not division:
        division = Division(
            id=1,
            name="Test Division",
            abbreviation="TD",
        )

    portfolio = db_for_iaa_test.get(Portfolio, 1)

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
        code="1",
        description="Test Object Class Code",
    )

    db_for_iaa_test.add(object_class_code)
    db_for_iaa_test.add(division)
    db_for_iaa_test.add(portfolio)
    db_for_iaa_test.add(can)
    db_for_iaa_test.commit()

    yield db_for_iaa_test

    db_for_iaa_test.rollback()

    db_for_iaa_test.execute(text("DELETE FROM iaa_budget_line_item"))
    db_for_iaa_test.execute(text("DELETE FROM iaa_budget_line_item_version"))
    db_for_iaa_test.execute(text("DELETE FROM budget_line_item"))
    db_for_iaa_test.execute(text("DELETE FROM budget_line_item_version"))
    db_for_iaa_test.execute(text("DELETE FROM can_history"))
    db_for_iaa_test.execute(text("DELETE FROM can_history_version"))
    db_for_iaa_test.execute(text("DELETE FROM can"))
    db_for_iaa_test.execute(text("DELETE FROM can_version"))
    db_for_iaa_test.execute(text("DELETE FROM iaa_agreement"))
    db_for_iaa_test.execute(text("DELETE FROM iaa_agreement_version"))
    db_for_iaa_test.execute(text("DELETE FROM agreement"))
    db_for_iaa_test.execute(text("DELETE FROM agreement_version"))
    db_for_iaa_test.execute(text("DELETE FROM ops_user"))
    db_for_iaa_test.execute(text("DELETE FROM ops_user_version"))
    db_for_iaa_test.execute(text("DELETE FROM ops_db_history"))
    db_for_iaa_test.execute(text("DELETE FROM ops_db_history_version"))
    db_for_iaa_test.commit()


def test_create_models(db_for_iaa_test_with_data):
    data = IAABudgetLineItemData(
        SYS_IAA_ID=1,
        SYS_BUDGET_ID=1,
        DOC_RECEIVED="true",
        IP_NBR="IPIAA22ACF12345",
        LINE_DESCRIPTION="Data Collection Services",
        COMMENTS="Initial funding",
        DATE_NEEDED="2022-09-30",
        SYS_CAN_ID=1,
        AMOUNT=25000.0,
        STATUS=BudgetLineItemStatus.OBLIGATED.name,
        OVERWRITE_PSC_FEE_RATE=0.0,
    )

    sys_user = User(
        email="system.admin@localhost",
    )

    create_models(data, sys_user, db_for_iaa_test_with_data)

    bli_model = db_for_iaa_test_with_data.execute(
        select(IAABudgetLineItem).join(IaaAgreement).where(IaaAgreement.maps_sys_id == 1)
    ).scalar()

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.doc_received is True
    assert bli_model.ip_nbr == "IPIAA22ACF12345"
    assert bli_model.line_description == "Data Collection Services"
    assert bli_model.comments == "Initial funding"
    assert bli_model.date_needed == date(2022, 9, 30)
    assert bli_model.can_id == 1
    assert bli_model.amount == Decimal("25000.0")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.proc_shop_fee_percentage == 0.0
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None


def test_main(db_for_iaa_test_with_data):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--type",
            "iaa_budget_lines",
            "--input-csv",
            "./test_csv/iaa_budget_lines.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = get_or_create_sys_user(db_for_iaa_test_with_data)

    bli_model = db_for_iaa_test_with_data.get(IAABudgetLineItem, 201)

    assert bli_model.id == 201
    assert bli_model.agreement_id == 1
    assert bli_model.doc_received is True
    assert bli_model.ip_nbr == "IPIAA22ACF12345"
    assert bli_model.line_description == "Data Collection Services"
    assert bli_model.comments == "Initial funding"
    assert bli_model.date_needed == date(2022, 9, 30)
    assert bli_model.can_id == 1
    assert bli_model.amount == Decimal("25000.0")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.proc_shop_fee_percentage == 0.0
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None

    history_objs = (
        db_for_iaa_test_with_data.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "IAABudgetLineItem"))
        .scalars()
        .all()
    )
    assert len(history_objs) == 50

    bli_1_history = (
        db_for_iaa_test_with_data.execute(
            select(OpsDBHistory).where(
                and_(OpsDBHistory.row_key == str(bli_model.id), OpsDBHistory.class_name == "IAABudgetLineItem")
            )
        )
        .scalars()
        .all()
    )
    assert len(bli_1_history) == 1


def test_create_models_upsert(db_for_iaa_test_with_data):
    sys_user = get_or_create_sys_user(db_for_iaa_test_with_data)

    data_1 = IAABudgetLineItemData(
        SYS_IAA_ID=1,
        SYS_BUDGET_ID=1,
        DOC_RECEIVED="true",
        IP_NBR="IPIAA22ACF12345",
        LINE_DESCRIPTION="Data Collection Services",
        COMMENTS="Initial funding",
        DATE_NEEDED="2022-09-30",
        SYS_CAN_ID=1,
        AMOUNT=25000.0,
        STATUS=BudgetLineItemStatus.OBLIGATED.name,
        OVERWRITE_PSC_FEE_RATE=0.0,
    )

    # Update description
    data_2 = IAABudgetLineItemData(
        SYS_IAA_ID=1,
        SYS_BUDGET_ID=1,
        DOC_RECEIVED="true",
        IP_NBR="IPIAA22ACF12345",
        LINE_DESCRIPTION="Data Collection Services Updated",
        COMMENTS="Initial funding",
        DATE_NEEDED="2022-09-30",
        SYS_CAN_ID=1,
        AMOUNT=25000.0,
        STATUS=BudgetLineItemStatus.OBLIGATED.name,
        OVERWRITE_PSC_FEE_RATE=0.0,
    )

    create_models(data_1, sys_user, db_for_iaa_test_with_data)

    # make sure the data was loaded
    bli_model = db_for_iaa_test_with_data.get(IAABudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.doc_received is True
    assert bli_model.ip_nbr == "IPIAA22ACF12345"
    assert bli_model.line_description == "Data Collection Services"
    assert bli_model.comments == "Initial funding"
    assert bli_model.date_needed == date(2022, 9, 30)
    assert bli_model.can_id == 1
    assert bli_model.amount == Decimal("25000.0")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.proc_shop_fee_percentage == 0.0
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None

    # make sure the version records were created
    assert bli_model.versions[0].id == 1
    assert bli_model.versions[0].agreement_id == 1
    assert bli_model.versions[0].doc_received is True
    assert bli_model.versions[0].ip_nbr == "IPIAA22ACF12345"
    assert bli_model.versions[0].line_description == "Data Collection Services"
    assert bli_model.versions[0].comments == "Initial funding"
    assert bli_model.versions[0].date_needed == date(2022, 9, 30)
    assert bli_model.versions[0].can_id == 1
    assert bli_model.versions[0].amount == Decimal("25000.0")
    assert bli_model.versions[0].status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.versions[0].proc_shop_fee_percentage == 0.0
    assert bli_model.versions[0].created_by == sys_user.id
    assert bli_model.versions[0].updated_by == sys_user.id
    assert bli_model.versions[0].created_on is not None
    assert bli_model.versions[0].updated_on is not None

    # make sure the history records are created
    history_records = (
        db_for_iaa_test_with_data.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.class_name == "IAABudgetLineItem")
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )
    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)
    assert history_records[0].created_by == sys_user.id

    # upsert the same data - change the description
    create_models(data_2, sys_user, db_for_iaa_test_with_data)

    # make sure the data was updated
    bli_model = db_for_iaa_test_with_data.get(IAABudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.doc_received is True
    assert bli_model.ip_nbr == "IPIAA22ACF12345"
    assert bli_model.line_description == "Data Collection Services Updated"
    assert bli_model.comments == "Initial funding"
    assert bli_model.date_needed == date(2022, 9, 30)
    assert bli_model.can_id == 1
    assert bli_model.amount == Decimal("25000.0")
    assert bli_model.status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.proc_shop_fee_percentage == 0.0
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None

    # make sure the version records were created
    assert bli_model.versions[1].id == 1
    assert bli_model.versions[1].agreement_id == 1
    assert bli_model.versions[1].doc_received is True
    assert bli_model.versions[1].ip_nbr == "IPIAA22ACF12345"
    assert bli_model.versions[1].line_description == "Data Collection Services Updated"
    assert bli_model.versions[1].comments == "Initial funding"
    assert bli_model.versions[1].date_needed == date(2022, 9, 30)
    assert bli_model.versions[1].can_id == 1
    assert bli_model.versions[1].amount == Decimal("25000.0")
    assert bli_model.versions[1].status == BudgetLineItemStatus.OBLIGATED
    assert bli_model.versions[1].proc_shop_fee_percentage == 0.0
    assert bli_model.versions[1].created_by == sys_user.id
    assert bli_model.versions[1].updated_by == sys_user.id
    assert bli_model.versions[1].created_on is not None
    assert bli_model.versions[1].updated_on is not None

    # make sure the history records are created
    history_records = (
        db_for_iaa_test_with_data.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.class_name == "IAABudgetLineItem")
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )
    assert history_records[0].event_type == OpsDBHistoryType.UPDATED
    assert history_records[0].row_key == str(bli_model.id)
    assert history_records[0].created_by == sys_user.id
