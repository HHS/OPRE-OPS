import pytest

from opre_ops.ops_site.cans.models import (
    CANFiscalYear,
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
def test_CANFiscalYear_additional_amount_anticipated():
    apple = FundingPartner.objects.create(
        name="Apple", nickname="Here's to the crazy ones"
    )

    dogcow_can = CommonAccountingNumber.objects.create(
        number="1234", nickname="DogCow", authorizer=apple
    )

    total_fiscal_year_funding = 10
    amount_available = 7
    can_fiscal_year = CANFiscalYear.objects.create(
        fiscal_year=2022,
        total_fiscal_year_funding=total_fiscal_year_funding,
        amount_available=amount_available,
        potential_additional_funding=6,
        can=dogcow_can,
    )

    assert (
        can_fiscal_year.additional_amount_anticipated
        == total_fiscal_year_funding - amount_available
    )


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


@pytest.mark.django_db
def test_FundingPartner_str():
    name = "FundingPartnerName"
    fundingPartner = FundingPartner.objects.create(name=name, nickname="NotTheRealName")
    assert "FundingPartnerName" == str(fundingPartner)
