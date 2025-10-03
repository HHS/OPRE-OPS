import pytest

from models import AgreementAgency
from ops_api.ops.services.agreement_agency import AgreementAgencyService

test_user_id = 503
test_user_name = "Amelia Popham"


@pytest.mark.usefixtures("app_ctx")
def test_get_agreement_agency(loaded_db):
    agreement_agency_service = AgreementAgencyService(loaded_db)
    agreement_agency = agreement_agency_service.get(1)
    assert agreement_agency is not None
    assert agreement_agency.name == "Administration for Children and Families"
    assert agreement_agency.abbreviation == "ACF"
    assert agreement_agency.requesting is True
    assert agreement_agency.servicing is False

    agreement_agency2 = agreement_agency_service.get(2)
    assert agreement_agency2 is not None
    assert agreement_agency2.name == "Another Federal Agency"
    assert agreement_agency2.abbreviation == "AFA"
    assert agreement_agency2.requesting is False
    assert agreement_agency2.servicing is True


@pytest.mark.usefixtures("app_ctx")
def test_get_agreement_agency_list(loaded_db):
    agreement_agency_service = AgreementAgencyService(loaded_db)
    agreement_agency_list = agreement_agency_service.get_list(False, True)
    assert agreement_agency_list[0] is not None
    assert agreement_agency_list[0].name == "Administration for Children and Families"
    assert agreement_agency_list[0].abbreviation == "ACF"
    assert agreement_agency_list[0].requesting is True
    assert agreement_agency_list[0].servicing is False

    agreement_agency_list_2 = agreement_agency_service.get_list(True, False)
    assert agreement_agency_list_2[0] is not None
    assert agreement_agency_list_2[0].name == "Another Federal Agency"
    assert agreement_agency_list_2[0].abbreviation == "AFA"
    assert agreement_agency_list_2[0].requesting is False
    assert agreement_agency_list_2[0].servicing is True

    agreement_agency_list_3 = agreement_agency_service.get_list(True, True)
    assert len(agreement_agency_list_3) == 2


@pytest.mark.usefixtures("app_ctx")
def test_create_update_delete_agreement_agency(loaded_db):
    agreement_agency_service = AgreementAgencyService(loaded_db)
    new_agency = {
        "name": "New Agency",
        "abbreviation": "NA",
        "requesting": True,
        "servicing": False,
    }
    created_agency = agreement_agency_service.create(new_agency)
    assert created_agency is not None
    assert created_agency.name == "New Agency"
    assert created_agency.abbreviation == "NA"
    assert created_agency.requesting is True
    assert created_agency.servicing is False

    update_fields = {
        "name": "Updated Agency",
        "abbreviation": "UA",
        "requesting": False,
        "servicing": True,
    }
    updated_agency = agreement_agency_service.update(update_fields, created_agency.id)
    assert updated_agency is not None
    assert updated_agency.name == "Updated Agency"
    assert updated_agency.abbreviation == "UA"
    assert updated_agency.requesting is False
    assert updated_agency.servicing is True

    agreement_agency_service.delete(created_agency.id)

    assert loaded_db.get(AgreementAgency, created_agency.id) is None
