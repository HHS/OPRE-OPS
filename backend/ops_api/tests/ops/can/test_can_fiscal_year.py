from ops.can.models import CANFiscalYear
import pytest


@pytest.mark.usefixtures("app_ctx")
def test_can_fiscal_year_lookup(loaded_db):
    cfy = (
        loaded_db.session.query(CANFiscalYear)
        .filter(CANFiscalYear.can_id == 1, CANFiscalYear.fiscal_year == 2022)
        .one()
    )
    assert cfy is not None
    assert cfy.fiscal_year == 2022
    assert cfy.total_fiscal_year_funding == 1233123
    assert cfy.potential_additional_funding == 89000
    assert cfy.can_lead == "Tim"
    assert cfy.notes == "No notes here."


def test_can_fiscal_year_create():
    cfy = CANFiscalYear(
        can_id=1,
        fiscal_year=2023,
        total_fiscal_year_funding=55000,
        potential_additional_funding=100,
        can_lead="Ralph",
        notes="all-the-notes!",
    )
    assert cfy.to_dict()["fiscal_year"] == 2023
