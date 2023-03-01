"""FY carry forward tests."""
import pytest
from models.cans import CANFiscalYearCarryForward
from sqlalchemy import SQLAlchemy


@pytest.mark.usefixtures("app_ctx")
def test_can_fiscal_year_carry_forward_lookup(loaded_db: SQLAlchemy) -> None:
    """Test that FY carry forward lookups work."""
    cfyco = (
        loaded_db.session.query(CANFiscalYearCarryForward)
        .filter(
            CANFiscalYearCarryForward.can_id == 11,
            CANFiscalYearCarryForward.from_fiscal_year == 2022,
        )
        .one()
    )
    assert cfyco is not None
    assert cfyco.from_fiscal_year == 2022
    assert cfyco.to_fiscal_year == 2023
    assert cfyco.received_amount == 200000.00
    assert cfyco.expected_amount == 100000.00


def test_can_fiscal_year_carry_forward_create() -> None:
    """Test that FY carry forward creation works."""
    cfyco = CANFiscalYearCarryForward(
        can_id=1,
        from_fiscal_year=2023,
        to_fiscal_year=2024,
        received_amount=10,
        expected_amount=5,
        notes="all-the-notes!",
    )
    assert cfyco.to_dict()["from_fiscal_year"] == 2023
