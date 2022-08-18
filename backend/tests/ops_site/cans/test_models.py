import pytest

from opre_ops.ops_site.cans.models import (
    CommonAccountingNumber,
    Contract,
    ContractLineItem,
    ContractLineItemFiscalYear,
    FundingPartner,
)


@pytest.mark.django_db
def test_Contract_research_areas():
    nickname1 = "DogCow"
    nickname2 = "Clarus"

    apple = FundingPartner.objects.create(
        name="Apple", nickname="Here's to the crazy ones"
    )

    dogcow_can = CommonAccountingNumber.objects.create(
        number="1234", nickname=nickname1, authorizer=apple
    )
    clarus_can = CommonAccountingNumber.objects.create(
        number="5678", nickname=nickname2, authorizer=apple
    )

    contract = Contract.objects.create(name="PageSetup")
    contract.cans.add(dogcow_can)
    contract.cans.add(clarus_can)

    assert nickname1 in contract.research_areas
    assert nickname2 in contract.research_areas


@pytest.mark.django_db
def test_ContractLineItemFiscalYear_contract():
    contract = Contract.objects.create(name="PageSetup")

    contract_line_item = ContractLineItem.objects.create(
        name="DogCow charge", contract=contract
    )

    contract_line_item_for_2022 = ContractLineItemFiscalYear.objects.create(
        fiscal_year=2022, line_item=contract_line_item
    )

    assert contract_line_item_for_2022.contract == contract


@pytest.mark.django_db
def test_ContractLineItemFiscalYear_name():
    contract = Contract.objects.create(name="PageSetup")

    contract_line_item_name = "DogCow charge"
    contract_line_item = ContractLineItem.objects.create(
        name=contract_line_item_name, contract=contract
    )

    contract_line_item_for_2022 = ContractLineItemFiscalYear.objects.create(
        fiscal_year=2022, line_item=contract_line_item
    )

    assert contract_line_item_for_2022.name == contract_line_item_name
