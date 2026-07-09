"""Unit tests for the PLANNED_MOD budget line item status.

Covers:
- BudgetLineItemStatus enum has PLANNED_MOD value
- PLANNED_MOD is included in SPENDING_STATUSES (reporting_summary)
- convert_BLI_status_name_to_pretty_string handles PLANNED_MOD
"""

from models.budget_line_items import BudgetLineItemStatus
from ops_api.ops.utils.budget_line_items_helpers import convert_BLI_status_name_to_pretty_string
from ops_api.ops.utils.reporting_summary import SPENDING_STATUSES


class TestPlannedModStatus:
    """BudgetLineItemStatus enum must include PLANNED_MOD."""

    def test_planned_mod_value_exists(self):
        assert BudgetLineItemStatus.PLANNED_MOD.value == "PLANNED_MOD"

    def test_planned_mod_str(self):
        assert str(BudgetLineItemStatus.PLANNED_MOD) == "PLANNED_MOD"

    def test_all_statuses_present(self):
        values = {s.value for s in BudgetLineItemStatus}
        assert {"DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED", "PLANNED_MOD"}.issubset(values)


class TestSpendingStatusesIncludePlannedMod:
    """PLANNED_MOD must be grouped with PLANNED in spending aggregations."""

    def test_planned_mod_in_spending_statuses(self):
        assert BudgetLineItemStatus.PLANNED_MOD in SPENDING_STATUSES


class TestConvertBLIStatusNamePlannedMod:
    """convert_BLI_status_name_to_pretty_string must handle PLANNED_MOD."""

    def test_planned_mod_returns_planned_mod_string(self):
        result = convert_BLI_status_name_to_pretty_string("PLANNED_MOD")
        assert result == "PLANNED_MOD"

    def test_unknown_status_still_falls_back_to_draft(self):
        result = convert_BLI_status_name_to_pretty_string("TOTALLY_UNKNOWN")
        assert result == "DRAFT"
