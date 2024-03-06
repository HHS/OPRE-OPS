import datetime

import pytest
from models.cans import CLIN, AgreementType, ContractAgreement, ContractType, ServiceRequirementType, ServicesComponent

# Assuming that your testing setup includes a fixture for the database and an authenticated client


@pytest.mark.usefixtures("app_ctx")
def test_services_component_retrieve(loaded_db):
    sc = loaded_db.query(ServicesComponent).filter(ServicesComponent.number == 1).one()

    assert sc is not None
    assert sc.number == 1
    assert sc.optional is False
    assert sc.clin is not None  # Assuming there's a CLIN associated
    assert sc.description == "Perform Research"
    assert sc.period_start == datetime.date(2043, 6, 13)  # 2043-06-13
    assert sc.period_end == datetime.date(2044, 6, 13)
    assert len(sc.budget_line_items) > 0
    assert sc.period_duration is not None
    assert sc.display_title == "Services Component 1"
    assert sc.display_name == "SC1"


def test_services_component_creation(loaded_db):
    clin = CLIN(id=123, name="123")  # Assuming a CLIN object is required

    sc = ServicesComponent(
        number=2,
        optional=True,
        clin_id=clin.id,
        description="Optional Services Component",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )

    assert sc is not None
    assert sc.number == 2
    assert sc.optional
    assert sc.clin_id == clin.id
    assert sc.period_duration.days == 181
    assert sc.display_title == "Optional Services Component 2"
    assert sc.display_name == "OSC2"


@pytest.mark.usefixtures("app_ctx")
def test_period_duration_calculation(loaded_db):
    # Test for a Services Component with both start and end dates
    sc_with_dates = ServicesComponent(
        number=3, optional=False, period_start=datetime.date(2024, 1, 1), period_end=datetime.date(2024, 3, 1)
    )

    expected_duration = (sc_with_dates.period_end - sc_with_dates.period_start).days
    assert sc_with_dates.period_duration.days == expected_duration


@pytest.mark.usefixtures("app_ctx")
def test_period_duration_calculation_with_missing_dates(loaded_db):
    # Test for a Services Component with no end date
    sc_no_end_date = ServicesComponent(
        number=4, optional=False, period_start=datetime.date(2024, 1, 1), period_end=None
    )

    assert sc_no_end_date.period_duration is None

    # Test for a Services Component with no start date
    sc_no_start_date = ServicesComponent(
        number=5, optional=False, period_start=None, period_end=datetime.date(2024, 3, 1)
    )

    assert sc_no_start_date.period_duration is None

    # Test for a Services Component with neither start nor end dates
    sc_no_dates = ServicesComponent(number=6, optional=False, period_start=None, period_end=None)

    assert sc_no_dates.period_duration is None


def test_services_component_naming(loaded_db):
    sc = ServicesComponent(
        number=1,
        optional=False,
    )
    assert sc.display_title == "Services Component 1"
    assert sc.display_name == "SC1"

    contract = ContractAgreement(service_requirement_type=ServiceRequirementType.NON_SEVERABLE)
    sc.contract_agreement = contract
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

    response = auth_client.get("/api/v1/services-components/")
    assert response.status_code == 200
    assert len(response.json) == count


@pytest.mark.usefixtures("app_ctx")
def test_services_components_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/services-components/1")
    assert response.status_code == 200
    resp_json = response.json
    assert resp_json["contract_agreement_id"] == 1
    assert resp_json["number"] == 1
    assert resp_json["description"] == "Perform Research"
    assert resp_json["display_title"] == "Services Component 1"
    assert resp_json["display_name"] == "SC1"
    assert not resp_json["optional"]
    assert resp_json["period_start"] == "2043-06-13"
    assert resp_json["period_end"] == "2044-06-13"


@pytest.mark.usefixtures("app_ctx")
def test_services_components_get_list(auth_client, app):
    response = auth_client.get(
        "/api/v1/services-components/?contract_agreement_id=1",
    )
    assert response.status_code == 200
    resp_json = response.json
    assert len(resp_json) == 3
    for sc in resp_json:
        assert sc["contract_agreement_id"] == 1
    sc1 = resp_json[0]
    assert sc1["number"] == 1
    assert sc1["description"] == "Perform Research"
    assert sc1["display_title"] == "Services Component 1"
    assert sc1["display_name"] == "SC1"
    assert not sc1["optional"]
    assert sc1["period_start"] == "2043-06-13"
    assert sc1["period_end"] == "2044-06-13"


@pytest.mark.usefixtures("app_ctx")
def test_services_components_post(auth_client, app):
    data = {
        "contract_agreement_id": 1,
        "description": "Test SC description",
        # "display_name": "SC3",
        # "id": 1,
        "number": 99,
        # "optional": True,
        "period_end": "2044-06-13",
        "period_start": "2043-06-13",
    }
    response = auth_client.post("/api/v1/services-components/", json=data)
    assert response.status_code == 201
    resp_json = response.json
    for key in data:
        assert resp_json.get(key) == data.get(key)
    assert "id" in resp_json
    new_sc_id = resp_json["id"]

    session = app.db_session
    sc: ServicesComponent = session.get(ServicesComponent, new_sc_id)
    assert sc.id == new_sc_id
    assert sc.description == data["description"]
    assert sc.number == data["number"]
    assert sc.period_start == datetime.date(2043, 6, 13)
    assert sc.period_end == datetime.date(2044, 6, 13)


@pytest.mark.usefixtures("app_ctx")
def test_services_components_patch(auth_client, app):
    session = app.db_session
    contract: ContractAgreement = session.get(ContractAgreement, 1)
    sc = ServicesComponent(
        contract_agreement=contract,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    session.add(sc)
    session.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    patch_data = {
        "description": "Test SC description Update",
        "number": 22,
        "period_start": None,
        "period_end": "2054-07-15",
    }
    response = auth_client.patch(f"/api/v1/services-components/{new_sc_id}", json=patch_data)
    assert response.status_code == 200
    resp_json = response.json
    for key in patch_data:
        assert resp_json.get(key) == patch_data.get(key)

    sc: ServicesComponent = session.get(ServicesComponent, new_sc_id)
    assert sc.id == new_sc_id
    assert sc.description == patch_data["description"]
    assert sc.number == patch_data["number"]
    assert sc.period_start is None
    assert sc.period_end == datetime.date(2054, 7, 15)


@pytest.mark.usefixtures("app_ctx")
def test_services_components_put(auth_client, app):
    session = app.db_session
    contract: ContractAgreement = session.get(ContractAgreement, 1)
    sc = ServicesComponent(
        contract_agreement=contract,
        number=99,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    session.add(sc)
    session.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    put_data = {
        "contract_agreement_id": 2,
        "description": "Test SC description Update",
        "number": 22,
        "optional": True,
        "period_start": "2053-08-14",
        "period_end": "2054-07-15",
    }
    response = auth_client.patch(f"/api/v1/services-components/{new_sc_id}", json=put_data)
    assert response.status_code == 200
    resp_json = response.json
    assert resp_json["contract_agreement_id"] == 1  # not allowed to change
    for key in put_data:
        if key != "contract_agreement_id":
            assert resp_json.get(key) == put_data.get(key)

    session = app.db_session
    sc: ServicesComponent = session.get(ServicesComponent, new_sc_id)
    assert sc.id == new_sc_id
    assert sc.description == put_data["description"]
    assert sc.number == put_data["number"]
    assert sc.optional == put_data["optional"]
    assert sc.period_start == datetime.date(2053, 8, 14)
    assert sc.period_end == datetime.date(2054, 7, 15)


@pytest.mark.usefixtures("app_ctx")
def test_services_components_delete(auth_client, app):
    session = app.db_session
    sc = ServicesComponent(
        contract_agreement_id=1,
        number=1,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    session.add(sc)
    session.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    response = auth_client.delete(f"/api/v1/services-components/{new_sc_id}")
    assert response.status_code == 200

    sc: ServicesComponent = session.get(ServicesComponent, new_sc_id)
    assert not sc


@pytest.mark.usefixtures("app_ctx")
def test_services_components_delete_cascades_from_agreement(auth_client, app, loaded_db):
    session = app.db_session
    ca = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=1,
        created_by=4,
    )
    session.add(ca)
    session.commit()
    assert ca.id is not None
    new_ca_id = ca.id

    sc = ServicesComponent(
        contract_agreement_id=new_ca_id,
        number=1,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    session.add(sc)
    session.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    session.delete(ca)
    session.commit()

    deleted_ca: ContractAgreement = loaded_db.get(ContractAgreement, new_ca_id)
    assert not deleted_ca

    deleted_sc: ServicesComponent = session.get(ServicesComponent, new_sc_id)
    assert not deleted_sc


@pytest.mark.usefixtures("app_ctx")
def test_services_components_delete_does_not_cascade_to_agreement(auth_client, app, loaded_db):
    session = app.db_session
    ca = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=1,
        created_by=4,
    )
    session.add(ca)
    session.commit()
    assert ca.id is not None
    new_ca_id = ca.id

    sc = ServicesComponent(
        contract_agreement_id=new_ca_id,
        number=1,
        optional=False,
        description="Test SC description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    session.add(sc)
    session.commit()

    assert sc.id is not None
    new_sc_id = sc.id

    remaining_ca: ContractAgreement = loaded_db.get(ContractAgreement, new_ca_id)
    assert remaining_ca is not None

    session.delete(sc)
    session.commit()

    deleted_sc: ServicesComponent = session.get(ServicesComponent, new_sc_id)
    assert not deleted_sc

    remaining_ca: ContractAgreement = loaded_db.get(ContractAgreement, new_ca_id)
    assert remaining_ca is not None

    session.delete(remaining_ca)
    session.commit()
