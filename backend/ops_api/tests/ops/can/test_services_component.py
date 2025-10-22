import datetime

import pytest
from flask import url_for

from models import (
    AgreementType,
    ContractAgreement,
    ContractType,
    ServiceRequirementType,
    ServicesComponent,
    User,
)


@pytest.mark.usefixtures("app_ctx")
def test_services_component_retrieve(loaded_db):
    sc = loaded_db.get(ServicesComponent, 1)

    assert sc is not None
    assert sc.number == 1
    assert sc.optional is False
    assert sc.description == "Perform Research"
    assert sc.period_start == datetime.date(2043, 6, 13)  # 2043-06-13
    assert sc.period_end == datetime.date(2044, 6, 13)
    assert len(sc.budget_line_items) > 0
    assert sc.period_duration is not None
    assert sc.display_title == "Services Component 1"
    assert sc.display_name == "SC1"


def test_services_component_creation(loaded_db):
    sc = ServicesComponent(
        number=2,
        optional=True,
        description="Optional Services Component",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )

    assert sc is not None
    assert sc.number == 2
    assert sc.optional
    assert sc.period_duration.days == 181
    assert sc.display_title == "Optional Services Component 2"
    assert sc.display_name == "OSC2"


@pytest.mark.usefixtures("app_ctx")
def test_period_duration_calculation(loaded_db):
    # Test for a Services Component with both start and end dates
    sc_with_dates = ServicesComponent(
        number=3,
        optional=False,
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 3, 1),
    )

    expected_duration = (sc_with_dates.period_end - sc_with_dates.period_start).days
    assert sc_with_dates.period_duration.days == expected_duration


@pytest.mark.usefixtures("app_ctx")
def test_period_duration_calculation_with_missing_dates(loaded_db):
    # Test for a Services Component with no end date
    sc_no_end_date = ServicesComponent(
        number=4,
        optional=False,
        period_start=datetime.date(2024, 1, 1),
        period_end=None,
    )

    assert sc_no_end_date.period_duration is None

    # Test for a Services Component with no start date
    sc_no_start_date = ServicesComponent(
        number=5,
        optional=False,
        period_start=None,
        period_end=datetime.date(2024, 3, 1),
    )

    assert sc_no_start_date.period_duration is None

    # Test for a Services Component with neither start nor end dates
    sc_no_dates = ServicesComponent(
        number=6, optional=False, period_start=None, period_end=None
    )

    assert sc_no_dates.period_duration is None


def test_services_component_naming(loaded_db):
    sc = ServicesComponent(
        number=1,
        optional=False,
    )
    assert sc.display_title == "Services Component 1"
    assert sc.display_name == "SC1"

    contract = ContractAgreement(
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE
    )
    sc.agreement = contract
    sc.number = 2
    sc.optional = True
    assert sc.display_title == "Optional Services Component 2"
    assert sc.display_name == "OSC2"

    contract.service_requirement_type = ServiceRequirementType.SEVERABLE
    sc.number = 1
    sc.optional = False
    assert sc.display_title == "Base Period 1"
    assert sc.display_name == "Base Period 1"

    sc.number = 2
    sc.optional = True
    assert sc.display_title == "Optional Period 2"
    assert sc.display_name == "Optional Period 2"


def test_services_components_get_all(auth_client, loaded_db):
    count = loaded_db.query(ServicesComponent).count()

    response = auth_client.get(url_for("api.services-component-group"))
    assert response.status_code == 200
    assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
def test_services_components_get_by_id(auth_client, loaded_db):
    response = auth_client.get(url_for("api.services-component-item", id=1))
    assert response.status_code == 200
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["number"] == 1
    assert resp_json["description"] == "Perform Research"
    assert resp_json["display_title"] == "Services Component 1"
    assert resp_json["display_name"] == "SC1"
    assert not resp_json["optional"]
    assert resp_json["period_start"] == "2043-06-13"
    assert resp_json["period_end"] == "2044-06-13"


@pytest.mark.usefixtures("app_ctx")
def test_services_components_get_list(auth_client):
    response = auth_client.get(
        url_for("api.services-component-group"), query_string={"agreement_id": 1}
    )
    assert response.status_code == 200
    resp_json = response.json
    assert len(resp_json) > 0
    assert all(sc["agreement_id"] == 1 for sc in resp_json)

    sc1 = resp_json[0]
    expected = {
        "number": 1,
        "description": "Perform Research",
        "display_title": "Services Component 1",
        "display_name": "SC1",
        "optional": False,
        "period_start": "2043-06-13",
        "period_end": "2044-06-13",
    }
    for key, value in expected.items():
        assert sc1[key] == value


@pytest.mark.usefixtures("app_ctx")
def test_services_components_post(auth_client, loaded_db):
    data = {
        "agreement_id": 1,
        "number": 99,
        "optional": False,
        "description": "Test SC description",
        "period_end": "2044-06-13",
        "period_start": "2043-06-13",
    }
    response = auth_client.post(url_for("api.services-component-group"), json=data)
    assert response.status_code == 201
    resp_json = response.json
    for key in data:
        assert resp_json.get(key) == data.get(key)
    assert "id" in resp_json
    new_sc_id = resp_json["id"]

    sc = loaded_db.get(ServicesComponent, new_sc_id)
    assert sc.id == new_sc_id
    assert sc.description == data["description"]
    assert sc.number == data["number"]
    assert sc.period_start == datetime.date(2043, 6, 13)
    assert sc.period_end == datetime.date(2044, 6, 13)


@pytest.mark.usefixtures("app_ctx")
def test_services_components_patch(auth_client, loaded_db):
    contract = loaded_db.get(ContractAgreement, 1)
    sc = ServicesComponent(
        agreement=contract,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    patch_data = {
        "description": "Test SC description Update",
        "number": 22,
        "period_start": None,
        "period_end": "2054-07-15",
    }
    response = auth_client.patch(
        url_for("api.services-component-item", id=new_sc_id), json=patch_data
    )
    assert response.status_code == 200
    resp_json = response.json
    for key in patch_data:
        assert resp_json.get(key) == patch_data.get(key)

    sc = loaded_db.get(ServicesComponent, new_sc_id)
    assert sc.id == new_sc_id
    assert sc.description == patch_data["description"]
    assert sc.number == patch_data["number"]
    assert sc.period_start is None
    assert sc.period_end == datetime.date(2054, 7, 15)


@pytest.mark.usefixtures("app_ctx")
def test_services_components_put(auth_client, loaded_db):
    contract = loaded_db.get(ContractAgreement, 1)
    sc = ServicesComponent(
        agreement=contract,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    put_data = {
        "agreement_id": 2,
        "description": "Test SC description Update",
        "number": 22,
        "optional": True,
        "period_start": "2053-08-14",
        "period_end": "2054-07-15",
    }
    response = auth_client.put(
        url_for("api.services-component-item", id=new_sc_id), json=put_data
    )
    assert response.status_code == 400  # Cannot change agreement_id

    put_data = {
        "agreement_id": 1,
        "description": "Test SC description Update",
        "number": 22,
        "optional": True,
        "period_start": "2053-08-14",
        "period_end": "2054-07-15",
    }
    response = auth_client.put(
        url_for("api.services-component-item", id=new_sc_id), json=put_data
    )
    assert response.status_code == 200
    resp_json = response.json
    assert resp_json["agreement_id"] == 1  # not allowed to change
    for key in put_data:
        if key != "agreement_id":
            assert resp_json.get(key) == put_data.get(key)

    sc = loaded_db.get(ServicesComponent, new_sc_id)
    assert sc.id == new_sc_id
    assert sc.description == put_data["description"]
    assert sc.number == put_data["number"]
    assert sc.optional == put_data["optional"]
    assert sc.period_start == datetime.date(2053, 8, 14)
    assert sc.period_end == datetime.date(2054, 7, 15)


@pytest.mark.usefixtures("app_ctx")
def test_services_components_delete(auth_client, loaded_db):
    sc = ServicesComponent(
        agreement_id=1,
        number=1,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    response = auth_client.delete(url_for("api.services-component-item", id=new_sc_id))
    assert response.status_code == 200

    sc: ServicesComponent = loaded_db.get(ServicesComponent, new_sc_id)
    assert not sc


@pytest.mark.usefixtures("app_ctx")
def test_services_components_delete_cascades_from_agreement(
    auth_client, loaded_db, test_project
):
    ca = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ca)
    loaded_db.commit()
    assert ca.id is not None
    new_ca_id = ca.id

    sc = ServicesComponent(
        agreement_id=new_ca_id,
        number=1,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    loaded_db.delete(ca)
    loaded_db.commit()

    deleted_ca = loaded_db.get(ContractAgreement, new_ca_id)
    assert not deleted_ca

    deleted_sc = loaded_db.get(ServicesComponent, new_sc_id)
    assert not deleted_sc


@pytest.mark.usefixtures("app_ctx")
def test_services_components_delete_does_not_cascade_to_agreement(
    auth_client, loaded_db, test_project
):
    ca = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ca)
    loaded_db.commit()
    assert ca.id is not None
    new_ca_id = ca.id

    sc = ServicesComponent(
        agreement_id=new_ca_id,
        number=1,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(sc)
    loaded_db.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    remaining_ca = loaded_db.get(ContractAgreement, new_ca_id)
    assert remaining_ca is not None

    loaded_db.delete(sc)
    loaded_db.commit()

    deleted_sc = loaded_db.get(ServicesComponent, new_sc_id)
    assert not deleted_sc

    remaining_ca = loaded_db.get(ContractAgreement, new_ca_id)
    assert remaining_ca is not None

    loaded_db.delete(remaining_ca)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_services_components_delete_as_basic_user(
    basic_user_auth_client, loaded_db, test_project
):
    # User ID for the test
    basic_user_id = 521

    # Set up the session
    basic_user = loaded_db.get(User, basic_user_id)

    # Create a test contract agreement with the basic user as a project officer
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=basic_user_id,
        team_members=[basic_user],
        project_officer=basic_user,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()
    assert contract_agreement.id is not None
    ca_id = contract_agreement.id

    # Create a test service component for the contract agreement
    service_component = ServicesComponent(
        agreement_id=ca_id,
        number=1,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(service_component)
    loaded_db.commit()

    assert service_component.id is not None
    sc_id = service_component.id

    # Basic user deletes the service component
    response = basic_user_auth_client.delete(
        url_for("api.services-component-item", id=sc_id)
    )
    assert response.status_code == 200

    # Verify the service component was deleted
    deleted_sc = loaded_db.get(ServicesComponent, sc_id)
    assert not deleted_sc


@pytest.mark.usefixtures("app_ctx")
def test_services_components_delete_forbidden_as_basic_user(
    basic_user_auth_client, system_owner_auth_client, loaded_db, test_project
):
    # User ID for the test
    budget_team_user_id = 523
    so_user_id = 520

    # Set up the session
    budget_team_user = loaded_db.get(User, budget_team_user_id)
    so_user = loaded_db.get(User, so_user_id)

    # Create test contract agreement
    # Budget Team and System Owner set as users who can delete the service component
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=budget_team_user_id,
        team_members=[budget_team_user],
        project_officer=budget_team_user,
        alternate_project_officer=so_user,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()
    assert contract_agreement.id is not None
    ca_id = contract_agreement.id

    # Create a service component for the new contract agreement
    service_component = ServicesComponent(
        agreement_id=ca_id,
        number=1,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(service_component)
    loaded_db.commit()
    assert service_component.id is not None
    sc_id = service_component.id

    # Basic user attempts to delete the service component
    b_response = basic_user_auth_client.delete(
        url_for("api.services-component-item", id=sc_id)
    )
    assert b_response.status_code == 403

    # Verify that the service component was NOT deleted by the basic user
    not_deleted_sc_b = loaded_db.get(ServicesComponent, sc_id)
    assert not_deleted_sc_b is not None

    # System Owner deletes the service component
    d_response = system_owner_auth_client.delete(
        url_for("api.services-component-item", id=sc_id)
    )
    assert d_response.status_code == 200

    # Verify that the service component was deleted by the division director
    deleted_sc_b = loaded_db.get(ServicesComponent, sc_id)
    assert not deleted_sc_b


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def test_service_component(loaded_db, test_project):
    dd_auth_client_id = 522
    dd_user = loaded_db.get(User, dd_auth_client_id)

    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=dd_auth_client_id,
        team_members=[dd_user],
        project_officer=dd_user,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    sc = ServicesComponent(
        agreement_id=contract_agreement.id,
        number=1,
        optional=False,
        description="Team Leaders can CRUD on this SC",
        period_start=datetime.date(2025, 6, 13),
        period_end=datetime.date(2028, 6, 13),
    )

    loaded_db.add(sc)
    loaded_db.commit()
    yield sc

    loaded_db.delete(sc)
    loaded_db.delete(contract_agreement)
    loaded_db.commit()


def test_team_leaders_can_get_service_components(
    division_director_auth_client, test_service_component
):
    # response = division_director_auth_client.get(f"/api/v1/services-components/{test_service_component.id}")
    response = division_director_auth_client.get(
        url_for("api.services-component-item", id=test_service_component.id)
    )
    assert response.status_code == 200
    assert response.json["description"] == "Team Leaders can CRUD on this SC"


def test_team_leaders_can_patch_service_components(
    division_director_auth_client, test_service_component, basic_user_auth_client
):

    patch_data = {
        "description": "Updated by Team Leader",
        "number": 2,
    }
    response = division_director_auth_client.patch(
        url_for("api.services-component-item", id=test_service_component.id),
        json=patch_data,
    )

    assert response.status_code == 200
    assert response.json["description"] == "Updated by Team Leader"
    assert response.json["number"] == 2

    # Verify that non-team members cannot patch the service component
    response2 = basic_user_auth_client.patch(
        url_for("api.services-component-item", id=test_service_component.id), json={}
    )
    assert response2.status_code == 403


def test_team_leaders_can_put_service_components(
    division_director_auth_client, test_service_component, basic_user_auth_client
):

    put_data = {
        "agreement_id": test_service_component.agreement_id,
        "description": "Updated by Team Leader (PUT)",
        "number": 3,
    }
    response = division_director_auth_client.put(
        url_for("api.services-component-item", id=test_service_component.id),
        json=put_data,
    )

    assert response.status_code == 200
    assert response.json["description"] == "Updated by Team Leader (PUT)"
    assert response.json["number"] == 3

    # Verify that non-team members cannot update the service component
    response2 = basic_user_auth_client.put(
        url_for("api.services-component-item", id=test_service_component.id), json={}
    )
    assert response2.status_code == 403


@pytest.mark.usefixtures("app_ctx")
def test_team_leaders_can_post_services_components(
    division_director_auth_client,
    test_service_component,
    basic_user_auth_client,
    loaded_db,
):

    data = {
        "agreement_id": test_service_component.agreement_id,
        "description": "Team Leaders can POST on this SC",
        "optional": False,
        "number": 99,
        "period_end": "2044-06-13",
        "period_start": "2043-06-13",
    }
    response = division_director_auth_client.post(
        url_for("api.services-component-group"), json=data
    )
    assert response.status_code == 201
    resp_json = response.json
    for key in data:
        assert resp_json.get(key) == data.get(key)
    assert "id" in resp_json
    new_sc_id = resp_json["id"]

    sc = loaded_db.get(ServicesComponent, new_sc_id)
    assert sc.id == new_sc_id
    assert sc.description == data["description"]
    assert sc.number == data["number"]
    assert sc.period_start == datetime.date(2043, 6, 13)
    assert sc.period_end == datetime.date(2044, 6, 13)

    # Verify that non-team members cannot create the service component
    response2 = basic_user_auth_client.post(
        url_for("api.services-component-group"), json=data
    )
    assert response2.status_code == 403


def test_team_leaders_can_delete_service_components(
    division_director_auth_client, test_service_component
):
    response = division_director_auth_client.delete(
        url_for("api.services-component-item", id=test_service_component.id)
    )
    assert response.status_code == 200

    # Verify the service component was deleted
    response = division_director_auth_client.get(
        url_for("api.services-component-item", id=test_service_component.id)
    )
    assert response.status_code == 404
