import pytest

from ops_api.ops.cans.models import (
    FundingPartner,
)


@pytest.mark.django_db
def test_FundingPartner_str():
    name = "FundingPartnerName"
    fundingPartner = FundingPartner.objects.create(name=name, nickname="NotTheRealName")
    assert name == str(fundingPartner)
