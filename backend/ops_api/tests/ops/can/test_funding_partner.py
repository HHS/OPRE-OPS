import pytest
from models.cans import FundingPartner


@pytest.mark.usefixtures("app_ctx")
def test_funding_partner_lookup(loaded_db):
    funding_partner = loaded_db.session.query(FundingPartner).filter(FundingPartner.id == 1).one()
    assert funding_partner is not None
    assert funding_partner.id == 1
    assert funding_partner.name == "Children's Bureau"
    assert funding_partner.nickname == "Children's Bureau"


def test_funding_partner_creation():
    funding_partner = FundingPartner(name="Funding-Partner-3", nickname="FP3")
    assert funding_partner.to_dict()["name"] == "Funding-Partner-3"
