from ops.can.models import CANFiscalYear


def test_can_fiscal_year_lookup(db_session, init_database, db_tables):
    cfy = db_session.query(CANFiscalYear).get(1)
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
