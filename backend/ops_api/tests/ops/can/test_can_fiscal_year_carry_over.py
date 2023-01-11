from ops.models.cans import CANFiscalYearCarryOver
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_can_fiscal_year_carry_over_lookup(loaded_db_with_cans):
    cfyco = (
        loaded_db_with_cans.session.query(CANFiscalYearCarryOver)
        .filter(
            CANFiscalYearCarryOver.can_id == 1,
            CANFiscalYearCarryOver.from_fiscal_year == 2022,
        )
        .one()
    )
    assert cfyco is not None
    assert cfyco.from_fiscal_year == 2022
    assert cfyco.to_fiscal_year == 2023
    assert cfyco.amount == 10


def test_can_fiscal_year_carry_over_create():
    cfyco = CANFiscalYearCarryOver(
        can_id=1,
        from_fiscal_year=2023,
        to_fiscal_year=2024,
        amount=10,
        notes="all-the-notes!",
    )
    assert cfyco.to_dict()["from_fiscal_year"] == 2023
