from ops.can.models import FundingPartner


def test_funding_partner_lookup(db_session, init_database, db_tables):
    funding_partner = (
        db_session.query(FundingPartner).filter(FundingPartner.id == 1).one()
    )
    assert funding_partner is not None
    assert funding_partner.id == 1
    assert funding_partner.name == "Funding-Partner-1"
    assert funding_partner.nickname == "FP1"


def test_funding_partner_creation():
    funding_partner = FundingPartner(name="Funding-Partner-3", nickname="FP3")
    assert funding_partner.to_dict()["name"] == "Funding-Partner-3"
