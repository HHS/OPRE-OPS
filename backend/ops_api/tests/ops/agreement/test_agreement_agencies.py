from flask import url_for

from models import AgreementAgency
from ops_api.ops.services.agreement_agency import AgreementAgencyService

test_user_id = 503
test_user_name = "Amelia Popham"


def test_get_agreement_agency(loaded_db, app_ctx):
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


def test_get_agreement_agency_list(loaded_db, app_ctx):
    agreement_agency_service = AgreementAgencyService(loaded_db)
    agreement_agency_list = agreement_agency_service.get_list(10, 0, False, True)
    assert agreement_agency_list[0] is not None
    assert agreement_agency_list[0].name == "Administration for Children and Families"
    assert agreement_agency_list[0].abbreviation == "ACF"
    assert agreement_agency_list[0].requesting is True
    assert agreement_agency_list[0].servicing is False

    agreement_agency_list_2 = agreement_agency_service.get_list(10, 0, True, False)
    assert agreement_agency_list_2[0] is not None
    assert agreement_agency_list_2[0].name == "Another Federal Agency"
    assert agreement_agency_list_2[0].abbreviation == "AFA"
    assert agreement_agency_list_2[0].requesting is False
    assert agreement_agency_list_2[0].servicing is True

    agreement_agency_list_3 = agreement_agency_service.get_list(10, 0, True, True)
    assert len(agreement_agency_list_3) == 5


def test_create_update_delete_agreement_agency(loaded_db, app_ctx):
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


def test_get_agreement_agency_apis(auth_client, app_ctx):
    url_get_one = url_for("api.agreement-agency-item", id=1)
    response = auth_client.get(url_get_one)
    assert response.status_code == 200
    assert response.json["name"] == "Administration for Children and Families"
    assert response.json["abbreviation"] == "ACF"
    assert response.json["requesting"] is True
    assert response.json["servicing"] is False

    url_get_list = url_for("api.agreement-agency-group")
    url_get_list_with_requesting = url_get_list + "?requesting=true&limit=10&offset=0"
    response = auth_client.get(url_get_list_with_requesting)

    assert response.status_code == 200
    assert len(response.json) == 3
    assert response.json[0]["name"] == "Administration for Children and Families"
    assert response.json[0]["abbreviation"] == "ACF"
    assert response.json[0]["requesting"] is True
    assert response.json[0]["servicing"] is False

    assert response.json[1]["name"] == "Requesting Agency Inc"
    assert response.json[1]["abbreviation"] == "RAI"
    assert response.json[1]["requesting"] is True
    assert response.json[1]["servicing"] is False

    assert response.json[2]["name"] == "Zebra Federal Agency"
    assert response.json[2]["abbreviation"] == "ZFA"
    assert response.json[2]["requesting"] is True
    assert response.json[2]["servicing"] is False

    url_get_list_with_servicing = url_get_list + "?servicing=true&limit=10&offset=0"
    response = auth_client.get(url_get_list_with_servicing)
    assert response.json[0]["name"] == "Another Federal Agency"
    assert response.json[0]["abbreviation"] == "AFA"
    assert response.json[0]["requesting"] is False
    assert response.json[0]["servicing"] is True
    assert response.status_code == 200

    url_get_list_with_both = url_get_list + "?requesting=true&servicing=true&limit=10&offset=0"
    response = auth_client.get(url_get_list_with_both)
    assert response.status_code == 200
    assert len(response.json) == 5
    assert response.json[0]["name"] == "Administration for Children and Families"
    assert response.json[1]["name"] == "Another Federal Agency"

    # The return for requesting both true and nothing provided should be functionally the same.
    response = auth_client.get(url_get_list)
    assert response.status_code == 200
    assert len(response.json) == 5
    assert response.json[0]["name"] == "Administration for Children and Families"
    assert response.json[1]["name"] == "Another Federal Agency"

    # should return empty list if getting offset beyond available records
    url_get_list_with_high_offset = url_get_list + "?limit=10&offset=20"
    response = auth_client.get(url_get_list_with_high_offset)
    assert response.status_code == 200
    assert len(response.json) == 0
