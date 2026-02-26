"""Unit tests for Agreement.award_date, award_fiscal_year, and award_type properties."""

from datetime import date
from unittest.mock import patch

from models import (
    AgreementType,
    AwardType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ProcurementAction,
    ProcurementActionStatus,
)


class TestAgreementAwardDate:
    """Test suite for Agreement.award_date property."""

    def test_no_procurement_actions_returns_none(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Award Date - No PAs",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert agreement.award_date is None

    def test_awarded_new_award_with_date(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Award Date - With Date",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2024, 3, 15),
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_date == date(2024, 3, 15)

    def test_awarded_new_award_without_date_returns_none(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Award Date - No Date",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=None,
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_date is None

    def test_non_new_award_type_returns_none(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Award Date - Modification",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.MODIFICATION,
            date_awarded_obligated=date(2024, 3, 15),
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_date is None


class TestAgreementAwardFiscalYear:
    """Test suite for Agreement.award_fiscal_year property."""

    def test_no_award_date_returns_none(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Award FY - No Date",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert agreement.award_fiscal_year is None

    def test_date_in_january_returns_same_year(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Award FY - January",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2024, 1, 15),
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_fiscal_year == 2024

    def test_date_in_september_returns_same_year(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Award FY - September",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2024, 9, 30),
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_fiscal_year == 2024

    def test_date_in_october_returns_next_year(self, loaded_db, app_ctx):
        """October starts the next fiscal year."""
        agreement = ContractAgreement(
            name="Test Award FY - October",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2024, 10, 1),
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_fiscal_year == 2025

    def test_date_in_december_returns_next_year(self, loaded_db, app_ctx):
        agreement = ContractAgreement(
            name="Test Award FY - December",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2024, 12, 15),
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_fiscal_year == 2025


class TestAgreementAwardType:
    """Test suite for Agreement.award_type property."""

    def test_no_blis_returns_none(self, loaded_db, app_ctx):
        """Agreement with no BLIs returns None."""
        agreement = ContractAgreement(
            name="Test Award Type - No BLIs",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert agreement.award_type is None

    def test_only_draft_blis_returns_none(self, loaded_db, app_ctx):
        """Agreement with only Draft BLIs returns None."""
        agreement = ContractAgreement(
            name="Test Award Type - Draft Only",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.DRAFT,
            line_description="Draft BLI",
        )
        loaded_db.add(bli)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_type is None

    @patch("ops_api.ops.utils.fiscal_year.get_current_fiscal_year", return_value=2025)
    def test_planned_bli_not_awarded_returns_new(self, mock_fy, loaded_db, app_ctx):
        """Agreement with a Planned BLI and not awarded returns NEW."""
        agreement = ContractAgreement(
            name="Test Award Type - Planned Not Awarded",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.PLANNED,
            line_description="Planned BLI",
        )
        loaded_db.add(bli)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_type == "NEW"

    @patch("ops_api.ops.utils.fiscal_year.get_current_fiscal_year", return_value=2025)
    def test_awarded_in_current_fy_returns_new(self, mock_fy, loaded_db, app_ctx):
        """Agreement awarded in the current FY returns NEW."""
        agreement = ContractAgreement(
            name="Test Award Type - Awarded Current FY",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.PLANNED,
            line_description="Planned BLI",
        )
        loaded_db.add(bli)

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2025, 3, 15),  # FY 2025
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_type == "NEW"

    @patch("ops_api.ops.utils.fiscal_year.get_current_fiscal_year", return_value=2025)
    def test_awarded_in_prior_fy_with_obligated_bli_returns_continuing(self, mock_fy, loaded_db, app_ctx):
        """Agreement awarded in a prior FY with Obligated BLI returns CONTINUING."""
        agreement = ContractAgreement(
            name="Test Award Type - Continuing",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.OBLIGATED,
            line_description="Obligated BLI",
        )
        loaded_db.add(bli)

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2024, 3, 15),  # FY 2024
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_type == "CONTINUING"

    @patch("ops_api.ops.utils.fiscal_year.get_current_fiscal_year", return_value=2025)
    def test_awarded_no_date_returns_new(self, mock_fy, loaded_db, app_ctx):
        """Agreement awarded but with no date_awarded_obligated returns NEW (fallback)."""
        agreement = ContractAgreement(
            name="Test Award Type - No Award Date",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.PLANNED,
            line_description="Planned BLI",
        )
        loaded_db.add(bli)

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=None,
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_type == "NEW"

    @patch("ops_api.ops.utils.fiscal_year.get_current_fiscal_year", return_value=2025)
    def test_awarded_in_october_fy_boundary(self, mock_fy, loaded_db, app_ctx):
        """Award in October 2024 is FY 2025, so current FY 2025 <= award FY 2025 → NEW."""
        agreement = ContractAgreement(
            name="Test Award Type - October FY Boundary",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.OBLIGATED,
            line_description="Obligated BLI",
        )
        loaded_db.add(bli)

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2024, 10, 1),  # FY 2025
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_type == "NEW"

    @patch("ops_api.ops.utils.fiscal_year.get_current_fiscal_year", return_value=2025)
    def test_mixed_draft_and_planned_not_awarded_returns_new(self, mock_fy, loaded_db, app_ctx):
        """Agreement with mixed Draft + Planned BLIs, not awarded, returns NEW."""
        agreement = ContractAgreement(
            name="Test Award Type - Mixed Draft Planned",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        draft_bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.DRAFT,
            line_description="Draft BLI",
        )
        planned_bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.PLANNED,
            line_description="Planned BLI",
        )
        loaded_db.add_all([draft_bli, planned_bli])
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_type == "NEW"

    @patch("ops_api.ops.utils.fiscal_year.get_current_fiscal_year", return_value=2025)
    def test_mixed_obligated_and_planned_awarded_prior_fy_returns_continuing(self, mock_fy, loaded_db, app_ctx):
        """Agreement with Obligated + Planned BLIs, awarded in prior FY, returns CONTINUING."""
        agreement = ContractAgreement(
            name="Test Award Type - Mixed Obligated Planned Prior FY",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        obligated_bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.OBLIGATED,
            line_description="Obligated BLI",
        )
        planned_bli = ContractBudgetLineItem(
            agreement_id=agreement.id,
            status=BudgetLineItemStatus.PLANNED,
            line_description="Planned BLI",
        )
        loaded_db.add_all([obligated_bli, planned_bli])

        pa = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.CERTIFIED,
            award_type=AwardType.NEW_AWARD,
            date_awarded_obligated=date(2023, 6, 1),  # FY 2023
        )
        loaded_db.add(pa)
        loaded_db.commit()
        loaded_db.refresh(agreement)

        assert agreement.award_type == "CONTINUING"
