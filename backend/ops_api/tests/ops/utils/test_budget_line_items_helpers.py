import pytest

from models import (
    CAN,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    Division,
    Portfolio,
    ProcurementTrackerStatus,
    User,
    UserStatus,
)
from ops_api.ops.services.budget_line_items import BudgetLineItemService
from ops_api.ops.utils.budget_line_items_helpers import (
    compute_bli_editable,
    compute_bli_is_deletable,
    convert_BLI_status_name_to_pretty_string,
    get_bli_locked_message,
    get_division_for_budget_line_item,
    is_agreement_in_pre_award_or_later,
    update_data,
)


class _FakeTracker:
    def __init__(self, status, active_step_number):
        self.status = status
        self.active_step_number = active_step_number


class _FakeAgreement:
    def __init__(self, procurement_trackers=None):
        self.procurement_trackers = procurement_trackers or []


class _FakeBLI:
    """Lightweight stand-in so editability rules can be unit-tested without the DB."""

    def __init__(self, status, *, is_obe=False, agreement=None):
        self.status = status
        self.is_obe = is_obe
        self.agreement = agreement if agreement is not None else _FakeAgreement()


def _active_tracker_at(step):
    return _FakeAgreement([_FakeTracker(ProcurementTrackerStatus.ACTIVE, step)])


@pytest.mark.parametrize(
    "input_status,expected",
    [
        ("DRAFT", str(BudgetLineItemStatus.DRAFT)),
        ("PLANNED", str(BudgetLineItemStatus.PLANNED)),
        ("IN_EXECUTION", str(BudgetLineItemStatus.IN_EXECUTION)),
        ("OBLIGATED", str(BudgetLineItemStatus.OBLIGATED)),
        ("UNKNOWN", str(BudgetLineItemStatus.DRAFT)),
    ],
)
def test_convert_bli_status_name_to_pretty_string(input_status, expected):
    assert convert_BLI_status_name_to_pretty_string(input_status) == expected


def test_get_division_for_budget_line_item_real_query(loaded_db, app_ctx):
    director = User(
        first_name="Jane",
        last_name="Doe",
        email="jane.doe@example.com",
        status=UserStatus.ACTIVE,
    )
    loaded_db.add(director)
    loaded_db.flush()  # to assign director.id

    division = Division(name="Health Division", abbreviation="HLTH", division_director_id=director.id)
    loaded_db.add(division)
    loaded_db.flush()

    portfolio = Portfolio(
        name="COVID Portfolio",
        description="Portfolio for COVID related projects",
        abbreviation="COVID",
        division_id=division.id,
    )
    loaded_db.add(portfolio)
    loaded_db.flush()

    can = CAN(number="CAN-2025", portfolio_id=portfolio.id)
    loaded_db.add(can)
    loaded_db.flush()

    bli = ContractBudgetLineItem(
        line_description="COVID Supplies",
        agreement_id=1,
        can_id=can.id,
        amount=123456.78,
        status=BudgetLineItemStatus.DRAFT,
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    try:
        result = get_division_for_budget_line_item(bli.id)

        assert result is not None
        assert isinstance(result, Division)
        assert result.id == division.id
        assert result.name == "Health Division"
        assert result.abbreviation == "HLTH"
        assert result.division_director_full_name == "Jane Doe"
    finally:
        loaded_db.delete(bli)
        loaded_db.delete(can)
        loaded_db.delete(portfolio)  # must delete this before division
        loaded_db.flush()
        loaded_db.delete(division)
        loaded_db.delete(director)
        loaded_db.commit()


def test_update_data_only_valid_fields():
    bli = ContractBudgetLineItem(
        line_description="Original Description",
        agreement_id=1,
        can_id=500,
        amount=1000.0,
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.23,
        created_by=1,
    )

    data = {
        "line_description": "Updated Description",  # valid
        "amount": 2000.0,  # valid
        "status": BudgetLineItemStatus.PLANNED,  # valid
        "invalid_field": "should be ignored",  # invalid
    }

    update_data(bli, data)

    assert bli.line_description == "Updated Description"
    assert bli.amount == 2000.0
    assert bli.status == BudgetLineItemStatus.PLANNED
    assert not hasattr(bli, "invalid_field")


def test_update_data_empty_dict():
    bli = ContractBudgetLineItem(
        line_description="Test Description",
        agreement_id=1,
        can_id=500,
        amount=100.0,
        status=BudgetLineItemStatus.DRAFT,
        proc_shop_fee_percentage=1.0,
        created_by=1,
    )

    original_values = bli.to_dict()
    update_data(bli, {})  # Nothing should change
    assert bli.to_dict() == original_values


# ---------------------------------------------------------------------------
# is_agreement_in_pre_award_or_later
# ---------------------------------------------------------------------------


def test_is_agreement_in_pre_award_or_later_no_agreement():
    assert is_agreement_in_pre_award_or_later(None) is False


def test_is_agreement_in_pre_award_or_later_no_trackers():
    assert is_agreement_in_pre_award_or_later(_FakeAgreement([])) is False


@pytest.mark.parametrize(
    "step,expected",
    [(1, False), (4, False), (5, True), (6, True)],
)
def test_is_agreement_in_pre_award_or_later_by_step(step, expected):
    assert is_agreement_in_pre_award_or_later(_active_tracker_at(step)) is expected


def test_is_agreement_in_pre_award_or_later_ignores_inactive_tracker():
    agreement = _FakeAgreement([_FakeTracker(ProcurementTrackerStatus.COMPLETED, 6)])
    assert is_agreement_in_pre_award_or_later(agreement) is False


def test_is_agreement_in_pre_award_or_later_none_step():
    assert is_agreement_in_pre_award_or_later(_active_tracker_at(None)) is False


# ---------------------------------------------------------------------------
# compute_bli_editable (single source of truth)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "status,expected",
    [
        (BudgetLineItemStatus.DRAFT, True),
        (BudgetLineItemStatus.PLANNED, True),
        (BudgetLineItemStatus.IN_EXECUTION, True),
        (BudgetLineItemStatus.OBLIGATED, False),
    ],
)
def test_compute_bli_editable_by_status(status, expected):
    bli = _FakeBLI(status)
    assert compute_bli_editable(bli, in_review=False, is_super=False) is expected


def test_compute_bli_editable_none_bli():
    assert compute_bli_editable(None, in_review=False, is_super=False) is False


def test_compute_bli_editable_in_review_blocks():
    bli = _FakeBLI(BudgetLineItemStatus.IN_EXECUTION)
    assert compute_bli_editable(bli, in_review=True, is_super=False) is False


def test_compute_bli_editable_obe_blocks_non_super():
    bli = _FakeBLI(BudgetLineItemStatus.PLANNED, is_obe=True)
    assert compute_bli_editable(bli, in_review=False, is_super=False) is False
    # super users may still edit OBE
    assert compute_bli_editable(bli, in_review=False, is_super=True) is True


@pytest.mark.parametrize("step", [5, 6])
def test_compute_bli_editable_blocked_at_pre_award_or_later(step):
    bli = _FakeBLI(BudgetLineItemStatus.IN_EXECUTION, agreement=_active_tracker_at(step))
    assert compute_bli_editable(bli, in_review=False, is_super=False) is False
    # super users bypass the step block
    assert compute_bli_editable(bli, in_review=False, is_super=True) is True


@pytest.mark.parametrize("step", [1, 4])
def test_compute_bli_editable_editable_before_pre_award(step):
    bli = _FakeBLI(BudgetLineItemStatus.IN_EXECUTION, agreement=_active_tracker_at(step))
    assert compute_bli_editable(bli, in_review=False, is_super=False) is True


def test_compute_bli_editable_obligated_super_can_edit():
    bli = _FakeBLI(BudgetLineItemStatus.OBLIGATED)
    assert compute_bli_editable(bli, in_review=False, is_super=True) is True


# ---------------------------------------------------------------------------
# compute_bli_is_deletable
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "status,expected",
    [
        (BudgetLineItemStatus.DRAFT, True),
        (BudgetLineItemStatus.PLANNED, True),
        (BudgetLineItemStatus.IN_EXECUTION, False),
        (BudgetLineItemStatus.OBLIGATED, False),
    ],
)
def test_compute_bli_is_deletable_by_status_non_super(status, expected):
    """PR1 keeps today's delete eligibility: DRAFT/PLANNED deletable, IN_EXECUTION not (yet)."""
    bli = _FakeBLI(status)
    assert compute_bli_is_deletable(bli, in_review=False, is_super=False) is expected


def test_compute_bli_is_deletable_none_bli():
    assert compute_bli_is_deletable(None, in_review=False, is_super=False) is False


def test_compute_bli_is_deletable_requires_editable():
    # A PLANNED BLI that is in_review is not editable, so it is not deletable either.
    bli = _FakeBLI(BudgetLineItemStatus.PLANNED)
    assert compute_bli_is_deletable(bli, in_review=True, is_super=False) is False


def test_compute_bli_is_deletable_super_can_delete_executing():
    bli = _FakeBLI(BudgetLineItemStatus.IN_EXECUTION)
    assert compute_bli_is_deletable(bli, in_review=False, is_super=True) is True


# ---------------------------------------------------------------------------
# get_bli_locked_message
# ---------------------------------------------------------------------------


def test_get_bli_locked_message_none_when_editable():
    bli = _FakeBLI(BudgetLineItemStatus.IN_EXECUTION)
    assert get_bli_locked_message(bli, in_review=False, is_super=False) is None


def test_get_bli_locked_message_pre_award():
    bli = _FakeBLI(BudgetLineItemStatus.IN_EXECUTION, agreement=_active_tracker_at(5))
    msg = get_bli_locked_message(bli, in_review=False, is_super=False)
    assert msg is not None
    assert "Pre-Award" in msg


def test_get_bli_locked_message_none_for_super():
    bli = _FakeBLI(BudgetLineItemStatus.IN_EXECUTION, agreement=_active_tracker_at(5))
    assert get_bli_locked_message(bli, in_review=False, is_super=True) is None


# ---------------------------------------------------------------------------
# ALWAYS_DIRECT_EDIT_FIELDS — guards PR #5816 (must keep the two original fields)
# ---------------------------------------------------------------------------


def test_always_direct_edit_fields_contains_expected_fields():
    assert BudgetLineItemService.ALWAYS_DIRECT_EDIT_FIELDS == {
        "services_component_id",
        "line_description",
        "comments",
    }
