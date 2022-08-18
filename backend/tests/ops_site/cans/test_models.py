import pytest

from opre_ops.ops_site.cans.models import CommonAccountingNumber, Contract, FundingPartner


@pytest.mark.django_db
def test_Contract_research_areas():
    apple = FundingPartner.objects.create(name="Apple", nickname="Here's to the crazy ones")
    dogcow_can = CommonAccountingNumber.objects.create(number="DogCow", nickname="DogCow combo", authorizer=apple)
    contract_for_dogcow = Contract.objects.create(name="PageSetup")
    contract_for_dogcow.cans.add(dogcow_can)

    assert contract_for_dogcow.research_areas == ["DogCow combo"]
