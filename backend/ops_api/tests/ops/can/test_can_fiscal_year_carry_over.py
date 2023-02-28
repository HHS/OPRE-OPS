import pytest
from models.cans import CANFiscalYearCarryForward


@pytest.mark.usefixtures("app_ctx")
def test_can_fiscal_year_carry_forward_lookup(loaded_db):
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
    assert cfyco.amount == 300000.00


def test_can_fiscal_year_carry_forward_create():
    cfyco = CANFiscalYearCarryForward(
        can_id=1,
        from_fiscal_year=2023,
        to_fiscal_year=2024,
        amount=10,
        notes="all-the-notes!",
    )
    assert cfyco.to_dict()["from_fiscal_year"] == 2023
