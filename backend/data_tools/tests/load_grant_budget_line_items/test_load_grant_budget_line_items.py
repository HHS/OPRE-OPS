import csv

import pytest
from click.testing import CliRunner
from data_tools.src.common.utils import get_or_create_sys_user
from data_tools.src.load_grant_budget_lines.main import main
from data_tools.src.load_grant_budget_lines.utils import (
    GrantBudgetLineItemData,
    create_budget_line_item_data,
    create_models,
    validate_data,
)
from sqlalchemy import and_, text

from models import *  # noqa: F403, F401


def test_create_budget_line_data():
    test_data = list(csv.DictReader(open("./test_csv/grant_budget_lines.tsv"), dialect="excel-tab"))

    # Check record count
    assert len(test_data) == 6
    record = test_data[0]

    # Create data object
    data = create_budget_line_item_data(record)

    # Check data object
    assert data.SYS_GRANTS_ID == 1
    assert data.SYS_BUDGET_ID == 300
    assert data.YEAR == 1
    assert data.BNS_NBR == "1000000"
    assert data.COMMITTED_DATE == date(2025, 1, 1)
    assert data.FA_SIGNED_DATE is None
    assert data.OBLIGATED_DATE == date(2025, 1, 1)
    assert data.BUDGET_START_DATE == date(2024, 10, 1)
    assert data.BUDGET_END_DATE == date(2025, 9, 30)
    assert data.OBJECT_CLASS_CODE == 1
    assert data.ENABLE is True
    assert data.GRANTS_NBR == "00YR0001-1"
    assert data.GRANTEE == "Univ"
    assert data.EDUCATIONAL_INSTITUTE is True
    assert data.STATE_CODE == StateCode.NY
    assert data.LINE_DESCRIPTION == "Grant 1"
    assert data.COMMENTS == "Grant Comment #1"
    assert data.DATE_NEEDED == date(2025, 9, 30)
    assert data.SYS_CAN_ID == 1
    assert data.AMOUNT == 1.0
    assert data.STATUS == BudgetLineItemStatus.DRAFT


def test_validate_data():
    test_data = list(csv.DictReader(open("./test_csv/grant_budget_lines.tsv"), dialect="excel-tab"))
    assert len(test_data) == 6
    count = sum(1 for data in test_data if validate_data(create_budget_line_item_data(data)))
    assert count == 6


def test_create_models_no_grant_id():
    with pytest.raises(ValueError):
        GrantBudgetLineItemData(
            SYS_GRANTS_ID=None,
        )


@pytest.fixture()
def db_for_test(loaded_db):
    grant = GrantAgreement(
        id=1,
        name="Test Grant",
        maps_sys_id=1,
    )

    loaded_db.add(grant)
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
    loaded_db.execute(text("DELETE FROM grant_budget_line_item"))
    loaded_db.execute(text("DELETE FROM grant_budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM grant_budget_line_item_detail"))
    loaded_db.execute(text("DELETE FROM grant_budget_line_item_detail_version"))
    loaded_db.execute(text("DELETE FROM budget_line_item"))
    loaded_db.execute(text("DELETE FROM budget_line_item_version"))
    loaded_db.execute(text("DELETE FROM can_history"))
    loaded_db.execute(text("DELETE FROM can_history_version"))
    loaded_db.execute(text("DELETE FROM can"))
    loaded_db.execute(text("DELETE FROM can_version"))
    loaded_db.execute(text("DELETE FROM grant_agreement"))
    loaded_db.execute(text("DELETE FROM grant_agreement_version"))
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
        code="1",
        description="Test Object Class Code",
    )

    db_for_test.add(object_class_code)
    db_for_test.add(division)
    db_for_test.add(portfolio)
    db_for_test.add(can)
    db_for_test.commit()

    yield db_for_test

    db_for_test.rollback()

    db_for_test.execute(text("DELETE FROM grant_budget_line_item"))
    db_for_test.execute(text("DELETE FROM grant_budget_line_item_version"))
    db_for_test.execute(text("DELETE FROM grant_budget_line_item_detail"))
    db_for_test.execute(text("DELETE FROM grant_budget_line_item_detail_version"))
    db_for_test.execute(text("DELETE FROM budget_line_item"))
    db_for_test.execute(text("DELETE FROM budget_line_item_version"))
    db_for_test.execute(text("DELETE FROM can_history"))
    db_for_test.execute(text("DELETE FROM can_history_version"))
    db_for_test.execute(text("DELETE FROM can"))
    db_for_test.execute(text("DELETE FROM can_version"))
    db_for_test.execute(text("DELETE FROM grant_agreement"))
    db_for_test.execute(text("DELETE FROM grant_agreement_version"))
    db_for_test.execute(text("DELETE FROM agreement"))
    db_for_test.execute(text("DELETE FROM agreement_version"))
    db_for_test.execute(text("DELETE FROM ops_user"))
    db_for_test.execute(text("DELETE FROM ops_user_version"))
    db_for_test.execute(text("DELETE FROM ops_db_history"))
    db_for_test.execute(text("DELETE FROM ops_db_history_version"))
    db_for_test.commit()


def test_create_models(db_for_test_with_data):
    data = GrantBudgetLineItemData(
        SYS_GRANTS_ID=1,
        SYS_BUDGET_ID=1,
        YEAR=1,
        BNS_NBR="1000000",
        COMMITTED_DATE="2025-01-01",
        FA_SIGNED_DATE=None,
        OBLIGATED_DATE="2025-01-01",
        BUDGET_START_DATE="2024-10-01",
        BUDGET_END_DATE="2025-09-30",
        OBJECT_CLASS_CODE=1,
        ENABLE=True,
        GRANTS_NBR="00YR0001-1",
        GRANTEE="Univ",
        EDUCATIONAL_INSTITUTE="1",
        STATE_CODE=StateCode.NY.name,
        LINE_DESCRIPTION="Grant 1",
        COMMENTS="Grant Comment #1",
        DATE_NEEDED="2025-09-30",
        SYS_CAN_ID=1,
        AMOUNT=1.0,
        STATUS=BudgetLineItemStatus.DRAFT.name,
    )

    sys_user = User(
        email="system.admin@localhost",
    )

    create_models(data, sys_user, db_for_test_with_data)

    bli_model = db_for_test_with_data.execute(
        select(GrantBudgetLineItem).join(GrantAgreement).where(GrantAgreement.maps_sys_id == 1)
    ).scalar()

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Grant 1"
    assert bli_model.comments == "Grant Comment #1"
    assert bli_model.grant_year_number == 1
    assert bli_model.bns_number == "1000000"
    assert bli_model.committed_date == date(2025, 1, 1)
    assert bli_model.fa_signed_date is None
    assert bli_model.obligation_date == date(2025, 1, 1)
    assert bli_model.start_date == date(2024, 10, 1)
    assert bli_model.end_date == date(2025, 9, 30)
    assert bli_model.object_class_code_id == 1
    assert bli_model.amount == Decimal("1.0")
    assert bli_model.status == BudgetLineItemStatus.DRAFT
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None

    assert bli_model.details.grantee_name == "Univ"
    assert bli_model.details.grants_number == "00YR0001-1"
    assert bli_model.details.educational_institution is True
    assert bli_model.details.state_code == StateCode.NY


def test_main(db_for_test_with_data):
    result = CliRunner().invoke(
        main,
        [
            "--env",
            "pytest_data_tools",
            "--input-csv",
            "./test_csv/grant_budget_lines.tsv",
        ],
    )

    assert result.exit_code == 0

    sys_user = get_or_create_sys_user(db_for_test_with_data)

    bli_model = db_for_test_with_data.get(GrantBudgetLineItem, 300)

    assert bli_model.id == 300
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Grant 1"
    assert bli_model.comments == "Grant Comment #1"
    assert bli_model.grant_year_number == 1
    assert bli_model.bns_number == "1000000"
    assert bli_model.committed_date == date(2025, 1, 1)
    assert bli_model.fa_signed_date is None
    assert bli_model.obligation_date == date(2025, 1, 1)
    assert bli_model.start_date == date(2024, 10, 1)
    assert bli_model.end_date == date(2025, 9, 30)
    assert bli_model.object_class_code_id == 1
    assert bli_model.amount == Decimal("1.0")
    assert bli_model.status == BudgetLineItemStatus.DRAFT
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None

    assert bli_model.details.grantee_name == "Univ"
    assert bli_model.details.grants_number == "00YR0001-1"
    assert bli_model.details.educational_institution is True
    assert bli_model.details.state_code == StateCode.NY

    history_objs = (
        db_for_test_with_data.execute(select(OpsDBHistory).where(OpsDBHistory.class_name == "GrantBudgetLineItem"))
        .scalars()
        .all()
    )
    assert len(history_objs) == 6

    history_objs = (
        db_for_test_with_data.execute(
            select(OpsDBHistory).where(OpsDBHistory.class_name == "GrantBudgetLineItemDetail")
        )
        .scalars()
        .all()
    )
    assert len(history_objs) == 6

    bli_1_history = (
        db_for_test_with_data.execute(
            select(OpsDBHistory).where(
                and_(OpsDBHistory.row_key == str(bli_model.id), OpsDBHistory.class_name == "GrantBudgetLineItem")
            )
        )
        .scalars()
        .all()
    )
    assert len(bli_1_history) == 1


#


def test_create_models_upsert(db_for_test_with_data):
    sys_user = get_or_create_sys_user(db_for_test_with_data)

    data_1 = GrantBudgetLineItemData(
        SYS_GRANTS_ID=1,
        SYS_BUDGET_ID=1,
        YEAR=1,
        BNS_NBR="1000000",
        COMMITTED_DATE="2025-01-01",
        FA_SIGNED_DATE=None,
        OBLIGATED_DATE="2025-01-01",
        BUDGET_START_DATE="2024-10-01",
        BUDGET_END_DATE="2025-09-30",
        OBJECT_CLASS_CODE=1,
        ENABLE=True,
        GRANTS_NBR="00YR0001-1",
        GRANTEE="Univ",
        EDUCATIONAL_INSTITUTE="1",
        STATE_CODE=StateCode.NY.name,
        LINE_DESCRIPTION="Grant 1",
        COMMENTS="Grant Comment #1",
        DATE_NEEDED="2025-09-30",
        SYS_CAN_ID=1,
        AMOUNT=1.0,
        STATUS=BudgetLineItemStatus.DRAFT.name,
    )
    # update the year
    data_2 = GrantBudgetLineItemData(
        SYS_GRANTS_ID=1,
        SYS_BUDGET_ID=1,
        YEAR=2,
        BNS_NBR="1000000",
        COMMITTED_DATE="2025-01-01",
        FA_SIGNED_DATE=None,
        OBLIGATED_DATE="2025-01-01",
        BUDGET_START_DATE="2024-10-01",
        BUDGET_END_DATE="2025-09-30",
        OBJECT_CLASS_CODE=1,
        ENABLE=True,
        GRANTS_NBR="00YR0001-1",
        GRANTEE="Univ",
        EDUCATIONAL_INSTITUTE="1",
        STATE_CODE=StateCode.NY.name,
        LINE_DESCRIPTION="Grant 1",
        COMMENTS="Grant Comment #1",
        DATE_NEEDED="2025-09-30",
        SYS_CAN_ID=1,
        AMOUNT=1.0,
        STATUS=BudgetLineItemStatus.DRAFT.name,
    )
    # update the grant details object
    data_3 = GrantBudgetLineItemData(
        SYS_GRANTS_ID=1,
        SYS_BUDGET_ID=1,
        YEAR=2,
        BNS_NBR="1000000",
        COMMITTED_DATE="2025-01-01",
        FA_SIGNED_DATE=None,
        OBLIGATED_DATE="2025-01-01",
        BUDGET_START_DATE="2024-10-01",
        BUDGET_END_DATE="2025-09-30",
        OBJECT_CLASS_CODE=1,
        ENABLE=True,
        GRANTS_NBR="00YR0001-1",
        GRANTEE="Univ",
        EDUCATIONAL_INSTITUTE="0",
        STATE_CODE=StateCode.PA.name,
        LINE_DESCRIPTION="Grant 1",
        COMMENTS="Grant Comment #1",
        DATE_NEEDED="2025-09-30",
        SYS_CAN_ID=1,
        AMOUNT=1.0,
        STATUS=BudgetLineItemStatus.DRAFT.name,
    )

    create_models(data_1, sys_user, db_for_test_with_data)

    # make sure the data was loaded
    bli_model = db_for_test_with_data.get(GrantBudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Grant 1"
    assert bli_model.comments == "Grant Comment #1"
    assert bli_model.grant_year_number == 1
    assert bli_model.bns_number == "1000000"
    assert bli_model.committed_date == date(2025, 1, 1)
    assert bli_model.fa_signed_date is None
    assert bli_model.obligation_date == date(2025, 1, 1)
    assert bli_model.start_date == date(2024, 10, 1)
    assert bli_model.end_date == date(2025, 9, 30)
    assert bli_model.object_class_code_id == 1
    assert bli_model.amount == Decimal("1.0")
    assert bli_model.status == BudgetLineItemStatus.DRAFT
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None

    assert bli_model.details.grantee_name == "Univ"
    assert bli_model.details.grants_number == "00YR0001-1"
    assert bli_model.details.educational_institution is True
    assert bli_model.details.state_code == StateCode.NY

    grant_details_id = bli_model.details_id

    # make sure the version records were created
    assert bli_model.versions[0].id == 1
    assert bli_model.versions[0].agreement_id == 1
    assert bli_model.versions[0].line_description == "Grant 1"
    assert bli_model.versions[0].comments == "Grant Comment #1"
    assert bli_model.versions[0].grant_year_number == 1
    assert bli_model.versions[0].bns_number == "1000000"
    assert bli_model.versions[0].committed_date == date(2025, 1, 1)
    assert bli_model.versions[0].fa_signed_date is None
    assert bli_model.versions[0].obligation_date == date(2025, 1, 1)
    assert bli_model.versions[0].start_date == date(2024, 10, 1)
    assert bli_model.versions[0].end_date == date(2025, 9, 30)
    assert bli_model.versions[0].object_class_code_id == 1
    assert bli_model.versions[0].amount == Decimal("1.0")
    assert bli_model.versions[0].status == BudgetLineItemStatus.DRAFT
    assert bli_model.versions[0].created_by == sys_user.id
    assert bli_model.versions[0].updated_by == sys_user.id
    assert bli_model.versions[0].created_on is not None
    assert bli_model.versions[0].updated_on is not None

    grant_detail = db_for_test_with_data.get(GrantBudgetLineItemDetail, bli_model.details_id)

    assert grant_detail.grantee_name == "Univ"
    assert grant_detail.grants_number == "00YR0001-1"
    assert grant_detail.educational_institution is True
    assert grant_detail.state_code == StateCode.NY

    # make sure the history records are created
    history_records = (
        db_for_test_with_data.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.class_name == "GrantBudgetLineItem")
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )
    assert history_records[0].event_type == OpsDBHistoryType.NEW
    assert history_records[0].row_key == str(bli_model.id)
    assert history_records[0].created_by == sys_user.id

    # upsert the same data - change the year
    create_models(data_2, sys_user, db_for_test_with_data)
    # make sure the data was loaded
    bli_model = db_for_test_with_data.get(GrantBudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Grant 1"
    assert bli_model.comments == "Grant Comment #1"
    assert bli_model.grant_year_number == 2
    assert bli_model.bns_number == "1000000"
    assert bli_model.committed_date == date(2025, 1, 1)
    assert bli_model.fa_signed_date is None
    assert bli_model.obligation_date == date(2025, 1, 1)
    assert bli_model.start_date == date(2024, 10, 1)
    assert bli_model.end_date == date(2025, 9, 30)
    assert bli_model.object_class_code_id == 1
    assert bli_model.amount == Decimal("1.0")
    assert bli_model.status == BudgetLineItemStatus.DRAFT
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None

    assert bli_model.details_id == grant_details_id
    assert bli_model.details.grantee_name == "Univ"
    assert bli_model.details.grants_number == "00YR0001-1"
    assert bli_model.details.educational_institution is True
    assert bli_model.details.state_code == StateCode.NY

    # make sure the version records were created
    assert bli_model.versions[1].id == 1
    assert bli_model.versions[1].agreement_id == 1
    assert bli_model.versions[1].line_description == "Grant 1"
    assert bli_model.versions[1].comments == "Grant Comment #1"
    assert bli_model.versions[1].grant_year_number == 2
    assert bli_model.versions[1].bns_number == "1000000"
    assert bli_model.versions[1].committed_date == date(2025, 1, 1)
    assert bli_model.versions[1].fa_signed_date is None
    assert bli_model.versions[1].obligation_date == date(2025, 1, 1)
    assert bli_model.versions[1].start_date == date(2024, 10, 1)
    assert bli_model.versions[1].end_date == date(2025, 9, 30)
    assert bli_model.versions[1].object_class_code_id == 1
    assert bli_model.versions[1].amount == Decimal("1.0")
    assert bli_model.versions[1].status == BudgetLineItemStatus.DRAFT
    assert bli_model.versions[1].created_by == sys_user.id
    assert bli_model.versions[1].updated_by == sys_user.id
    assert bli_model.versions[1].created_on is not None
    assert bli_model.versions[1].updated_on is not None

    # make sure the history records are created
    history_records = (
        db_for_test_with_data.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.class_name == "GrantBudgetLineItem")
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )
    assert history_records[0].event_type == OpsDBHistoryType.UPDATED
    assert history_records[0].row_key == str(bli_model.id)
    assert history_records[0].created_by == sys_user.id
    assert history_records[1].event_type == OpsDBHistoryType.UPDATED
    assert history_records[1].row_key == str(bli_model.id)
    assert history_records[1].created_by == sys_user.id

    # upsert the same data - change the grant details
    create_models(data_3, sys_user, db_for_test_with_data)
    # make sure the data was loaded
    bli_model = db_for_test_with_data.get(GrantBudgetLineItem, 1)

    assert bli_model.id == 1
    assert bli_model.agreement_id == 1
    assert bli_model.line_description == "Grant 1"
    assert bli_model.comments == "Grant Comment #1"
    assert bli_model.grant_year_number == 2
    assert bli_model.bns_number == "1000000"
    assert bli_model.committed_date == date(2025, 1, 1)
    assert bli_model.fa_signed_date is None
    assert bli_model.obligation_date == date(2025, 1, 1)
    assert bli_model.start_date == date(2024, 10, 1)
    assert bli_model.end_date == date(2025, 9, 30)
    assert bli_model.object_class_code_id == 1
    assert bli_model.amount == Decimal("1.0")
    assert bli_model.status == BudgetLineItemStatus.DRAFT
    assert bli_model.created_by == sys_user.id
    assert bli_model.updated_by == sys_user.id
    assert bli_model.created_on is not None
    assert bli_model.updated_on is not None

    assert bli_model.details_id != grant_details_id
    assert bli_model.details.grantee_name == "Univ"
    assert bli_model.details.grants_number == "00YR0001-1"
    assert bli_model.details.educational_institution is False
    assert bli_model.details.state_code == StateCode.PA

    # make sure the version records were created
    assert bli_model.versions[2].id == 1
    assert bli_model.versions[2].agreement_id == 1
    assert bli_model.versions[2].line_description == "Grant 1"
    assert bli_model.versions[2].comments == "Grant Comment #1"
    assert bli_model.versions[2].grant_year_number == 2
    assert bli_model.versions[2].bns_number == "1000000"
    assert bli_model.versions[2].committed_date == date(2025, 1, 1)
    assert bli_model.versions[2].fa_signed_date is None
    assert bli_model.versions[2].obligation_date == date(2025, 1, 1)
    assert bli_model.versions[2].start_date == date(2024, 10, 1)
    assert bli_model.versions[2].end_date == date(2025, 9, 30)
    assert bli_model.versions[2].object_class_code_id == 1
    assert bli_model.versions[2].amount == Decimal("1.0")
    assert bli_model.versions[2].status == BudgetLineItemStatus.DRAFT
    assert bli_model.versions[2].created_by == sys_user.id
    assert bli_model.versions[2].updated_by == sys_user.id
    assert bli_model.versions[2].created_on is not None
    assert bli_model.versions[2].updated_on is not None

    # make sure the history records are created
    history_records = (
        db_for_test_with_data.execute(
            select(OpsDBHistory)
            .where(OpsDBHistory.class_name == "GrantBudgetLineItem")
            .order_by(OpsDBHistory.created_on.desc())
        )
        .scalars()
        .all()
    )
    assert history_records[0].event_type == OpsDBHistoryType.UPDATED
    assert history_records[0].row_key == str(bli_model.id)
    assert history_records[0].created_by == sys_user.id
    assert history_records[1].event_type == OpsDBHistoryType.UPDATED
    assert history_records[1].row_key == str(bli_model.id)
    assert history_records[1].created_by == sys_user.id
