import numpy
import pytest
from flask import url_for
from sqlalchemy import func, select, update

from models import AgreementType, ContractAgreement, ContractType, GrantAgreement
from models.cans import Agreement, ServiceRequirementType


@pytest.mark.usefixtures("app_ctx")
def test_agreement_retrieve(loaded_db):
    agreement = loaded_db.get(Agreement, 1)

    assert agreement is not None
    assert agreement.contract_number == "XXXX000000001"
    assert agreement.name == "Contract #1: African American Child and Family Research Center"
    assert agreement.display_name == agreement.name
    assert agreement.id == 1
    assert agreement.agreement_type.name == "CONTRACT"
    assert agreement.procurement_tracker_workflow_id is None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_all(auth_client, loaded_db):
    stmt = select(func.count()).select_from(Agreement)
    count = loaded_db.scalar(stmt)

    response = auth_client.get(url_for("api.agreements-group"))
    assert response.status_code == 200
    assert len(response.json) == count

    # test an agreement
    assert response.json[0]["name"] == "Contract #1: African American Child and Family Research Center"
    assert response.json[0]["agreement_type"] == "CONTRACT"
    assert response.json[0]["contract_number"] == "XXXX000000001"
    assert response.json[0]["project"]["id"] == 1
    assert numpy.isclose(response.json[0]["budget_line_items"][0]["amount"], 1000000.0)
    assert numpy.isclose(response.json[0]["procurement_shop"]["fee"], 0.0)
    assert response.json[0]["incumbent"] == "Vendor 1"
    assert "budget_line_items" in response.json[0]
    assert "can_id" in response.json[0]["budget_line_items"][0]
    assert "can" in response.json[0]["budget_line_items"][0]
    assert response.json[0]["budget_line_items"][0]["can"]["number"] is not None
    assert response.json[0]["budget_line_items"][0]["can"]["display_name"] is not None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id(auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-item", id=1))
    assert response.status_code == 200
    assert response.json["name"] == "Contract #1: African American Child and Family Research Center"
    assert "procurement_tracker_workflow_id" in response.json
    assert response.json["procurement_tracker_workflow_id"] is None
    assert "budget_line_items" in response.json
    assert "can_id" in response.json["budget_line_items"][0]
    assert "can" in response.json["budget_line_items"][0]
    assert response.json["budget_line_items"][0]["can"]["number"] is not None
    assert response.json["budget_line_items"][0]["can"]["display_name"] is not None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id_404(auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-item", id=1000))
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_agreements_serialization(auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-item", id=1))
    assert response.status_code == 200

    agreement = loaded_db.get(Agreement, 1)

    assert response.json["agreement_reason"] == agreement.agreement_reason.name
    assert response.json["agreement_type"] == agreement.agreement_type.name
    assert response.json["contract_number"] == agreement.contract_number
    assert response.json["contract_type"] == agreement.contract_type.name
    assert response.json["created_by"] == agreement.created_by
    assert response.json["delivered_status"] == agreement.delivered_status
    assert response.json["description"] == agreement.description
    assert response.json["display_name"] == agreement.display_name
    assert response.json["id"] == agreement.id
    assert response.json["name"] == agreement.name
    assert response.json["notes"] == agreement.notes
    assert response.json["procurement_shop_id"] == agreement.procurement_shop_id
    assert response.json["product_service_code_id"] == agreement.product_service_code_id
    assert response.json["project_officer_id"] == agreement.project_officer_id
    assert response.json["project_id"] == agreement.project_id
    assert response.json["support_contacts"] == agreement.support_contacts
    assert len(response.json["team_members"]) == len(agreement.team_members)
    assert response.json["vendor_id"] == agreement.vendor_id
    assert response.json["incumbent_id"] == agreement.incumbent_id
    assert response.json["vendor"] == agreement.vendor.name


@pytest.mark.skip("Need to consult whether this should return ALL or NONE if the value is empty")
@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_project_empty(auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-group"), query_string={"project_id": ""})
    assert response.status_code == 200
    assert len(response.json) == 6


@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_project_found(auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-group"), query_string={"project_id": "1"})
    assert response.status_code == 200
    assert len(response.json) == 3
    assert response.json[0]["id"] == 1
    assert response.json[1]["id"] == 10
    assert response.json[2]["id"] == 2


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.parametrize(["simulated_error", "expected"], [["true", 500], ["400", 400], ["false", 200]])
def test_agreements_with_simulated_error(auth_client, loaded_db, simulated_error, expected):
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"simulatedError": simulated_error, "project_id": "1"},
    )
    assert response.status_code == expected


@pytest.mark.parametrize(
    "key,value",
    (
        ("agreement_reason", "NEW_REQ"),
        ("contract_number", "XXXX000000001"),
        ("contract_type", "LABOR_HOUR"),
        ("agreement_type", "CONTRACT"),
        ("delivered_status", False),
        ("procurement_shop_id", 1),
        ("project_officer_id", 1),
        ("project_id", 1),
        ("foa", "This is an FOA value"),
        ("name", "Contract #1: African American Child and Family Research Center"),
    ),
)
@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_filter(auth_client, key, value, loaded_db):
    query_dict = {key: value}
    response = auth_client.get(url_for("api.agreements-group"), query_string=query_dict)
    assert response.status_code == 200
    assert all(item[key] == value for item in response.json if key in item)


@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_project_not_found(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"project_id": "1000"},
    )
    assert response.status_code == 200
    assert len(response.json) == 0


def test_agreement_search(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"search": ""},
    )

    assert response.status_code == 200
    assert len(response.json) == 0

    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"search": "contract"},
    )
    assert response.status_code == 200
    assert len(response.json) == 4

    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"search": "fcl"},
    )

    assert response.status_code == 200
    assert len(response.json) == 2


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id_auth(client, loaded_db):
    response = client.get(url_for("api.agreements-item", id=1))
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_agreements_auth(client, loaded_db):
    response = client.get(url_for("api.agreements-group"))
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_agreement_as_contract_has_contract_fields(loaded_db):
    stmt = select(Agreement).where(Agreement.id == 1)
    agreement = loaded_db.scalar(stmt)

    assert agreement.agreement_type.name == "CONTRACT"
    assert agreement.contract_number == "XXXX000000001"


@pytest.mark.usefixtures("app_ctx")
def test_agreement_create_contract_agreement(loaded_db):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    stmt = select(Agreement).where(Agreement.id == contract_agreement.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.contract_number == "XXXX000000002"
    assert agreement.contract_type == ContractType.FIRM_FIXED_PRICE
    assert agreement.service_requirement_type == ServiceRequirementType.SEVERABLE


@pytest.mark.usefixtures("app_ctx")
def test_agreement_create_grant_agreement(loaded_db):
    grant_agreement = GrantAgreement(
        name="GNTXX12399",
        foa="NIH",
        agreement_type=AgreementType.GRANT,
    )
    loaded_db.add(grant_agreement)
    loaded_db.commit()

    stmt = select(Agreement).where(Agreement.id == grant_agreement.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.foa == "NIH"


@pytest.fixture()
def test_contract(loaded_db):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=1,
        created_by=4,
        vendor_id=1,
        incumbent_id=1,
    )

    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreements_put_by_id_400_for_type_change(auth_client, test_contract):
    """400 is returned if the agreement_type is changed"""

    response = auth_client.put(
        f"/api/v1/agreements/{test_contract.id}",
        json={
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
        },
    )
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
def test_agreements_put_by_id_400_for_missing_required(auth_client, test_contract):
    """400 is returned required fields are missing"""
    response = auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
        },
    )
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
def test_agreements_put_by_id_contract(auth_client, loaded_db, test_contract):
    """PUT CONTRACT Agreement"""
    response = auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
            "team_members": [{"id": 1}],
            "support_contacts": [{"id": 2}, {"id": 3}],
            "notes": "Test Note",
        },
    )
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "Updated Contract Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "Updated Contract Description"
    assert agreement.notes == "Test Note"
    assert [m.id for m in agreement.team_members] == [1]
    assert [m.id for m in agreement.support_contacts] == [2, 3]


@pytest.mark.usefixtures("app_ctx")
def test_agreements_put_by_id_contract_remove_fields(auth_client, loaded_db, test_contract):
    """PUT CONTRACT Agreement and verify missing fields are removed (for PUT)"""
    response = auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
        },
    )
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "Updated Contract Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "Updated Contract Description"
    assert agreement.notes == ""
    assert agreement.team_members == []
    assert agreement.support_contacts == []


@pytest.mark.usefixtures("app_ctx")
def test_agreements_put_by_id_grant(auth_client, loaded_db):
    """PUT GRANT Agreement"""
    response = auth_client.put(
        url_for("api.agreements-item", id=3),
        json={
            "agreement_type": "GRANT",
            "name": "Updated Grant Name",
            "description": "Updated Grant Description",
            "team_members": [{"id": 1}, {"id": 2}, {"id": 3}],
        },
    )
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == 3)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "Updated Grant Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "Updated Grant Description"
    assert [m.id for m in agreement.team_members] == [1, 2, 3]


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_400_for_type_change(auth_client, loaded_db, test_contract):
    """400 for invalid type change"""
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "GRANT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
        },
    )
    assert response.status_code == 400


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_contract(auth_client, loaded_db, test_contract):
    """PATCH CONTRACT"""
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
            "team_members": [{"id": 1}],
            "support_contacts": [{"id": 2}, {"id": 3}],
            "notes": "Test Note",
        },
    )
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "Updated Contract Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "Updated Contract Description"
    assert agreement.notes == "Test Note"
    assert [m.id for m in agreement.team_members] == [1]
    assert [m.id for m in agreement.support_contacts] == [2, 3]


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_contract_with_nones(auth_client, loaded_db, test_contract):
    """Patch CONTRACT with setting fields to None/empty"""
    # set fields to non-None/non-empty
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
            "team_members": [{"id": 1}],
            "support_contacts": [{"id": 2}, {"id": 3}],
            "notes": "Test Note",
        },
    )
    assert response.status_code == 200

    assert test_contract.name == "Updated Contract Name"
    assert test_contract.display_name == test_contract.name
    assert test_contract.description == "Updated Contract Description"
    assert test_contract.notes == "Test Note"
    assert [m.id for m in test_contract.team_members] == [1]
    assert [m.id for m in test_contract.support_contacts] == [2, 3]

    # path with None/empty
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "team_members": None,
            "support_contacts": [],
            "notes": "",
        },
    )
    assert response.status_code == 200

    assert test_contract.name == "Updated Contract Name"
    assert test_contract.display_name == test_contract.name
    assert test_contract.description == "Updated Contract Description"
    assert test_contract.notes == ""
    assert test_contract.team_members == []
    assert test_contract.support_contacts == []


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_grant(auth_client, loaded_db):
    """PATCH GRANT"""
    response = auth_client.patch(
        url_for("api.agreements-item", id=3),
        json={
            "agreement_type": "GRANT",
            "name": "Updated Grant Name",
            "description": "Updated Grant Description",
            "team_members": [{"id": 1}],
            "notes": "Test Note",
        },
    )
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == 3)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "Updated Grant Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "Updated Grant Description"
    assert agreement.notes == "Test Note"
    assert [m.id for m in agreement.team_members] == [1]


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_just_notes(auth_client, loaded_db):
    """PATCH with just notes to test out other fields being optional"""
    stmt = select(Agreement).where(Agreement.id == 1)
    agreement = loaded_db.scalar(stmt)
    old_notes = agreement.notes
    try:
        response = auth_client.patch(
            "/api/v1/agreements/1",
            json={
                "notes": "Test PATCH",
            },
        )
        assert response.status_code == 200

        stmt = select(Agreement).where(Agreement.id == 1)
        agreement = loaded_db.scalar(stmt)
        assert agreement.notes == "Test PATCH"
    finally:
        stmt = update(Agreement).where(Agreement.id == 1).values(notes=old_notes)
        agreement = loaded_db.execute(stmt)


@pytest.mark.usefixtures("app_ctx")
def test_agreements_delete_by_id(auth_client, loaded_db, test_contract):
    response = auth_client.delete(url_for("api.agreements-item", id=test_contract.id))
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement is None


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_get_iaa_agreement(auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-item", id=4))
    assert response.status_code == 200
    assert response.json["agreement_type"] == "IAA"
    assert response.json["iaa"] == "This is an IAA value"


@pytest.mark.usefixtures("app_ctx")
def test_agreements_post(auth_client, loaded_db):
    response = auth_client.post(
        "/api/v1/agreements/",
        json={
            "agreement_type": "CONTRACT",
            "name": "Test Contract (for post)",
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_agreements_post_contract_with_service_requirement_type(auth_client, loaded_db):
    response = auth_client.post(
        "/api/v1/agreements/",
        json={
            "agreement_type": "CONTRACT",
            "agreement_reason": "NEW_REQ",
            "name": "FRANK TEST",
            "description": "test description",
            "product_service_code_id": 1,
            "incumbent": None,
            "project_officer_id": 1,
            "team_members": [
                {
                    "id": 2,
                    "full_name": "Amy Madigan",
                    "email": "Amy.Madigan@example.com",
                }
            ],
            "notes": "test notes",
            "project_id": 1,
            "procurement_shop_id": 2,
            "contract_type": "FIRM_FIXED_PRICE",
            "service_requirement_type": "SEVERABLE",
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_agreements_post_contract_with_incumbent(auth_client, loaded_db):
    response = auth_client.post(
        "/api/v1/agreements/",
        json={
            "agreement_type": "CONTRACT",
            "agreement_reason": "NEW_REQ",
            "name": "REED TEST CONTRACT",
            "description": "test description",
            "product_service_code_id": 1,
            "incumbent": "Vendor 1",
            "project_officer_id": 1,
            "team_members": [
                {
                    "id": 2,
                    "full_name": "Amy Madigan",
                    "email": "Amy.Madigan@example.com",
                }
            ],
            "notes": "test notes",
            "project_id": 1,
            "procurement_shop_id": 2,
            "contract_type": "FIRM_FIXED_PRICE",
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_e2e(auth_client, loaded_db, test_contract):
    """PATCH with mimicking the e2e test"""
    response = auth_client.patch(
        f"/api/v1/agreements/{test_contract.id}",
        json={
            "acquisition_type": None,
            "agreement_reason": "NEW_REQ",
            "agreement_type": "CONTRACT",
            "contract_number": None,
            "contract_type": None,
            "created_by_user": 21,
            "delivered_status": False,
            "description": "Test Description",
            "display_name": "Test Contract",
            "incumbent": None,
            "incumbent_id": None,
            "name": "Test Edit Title",
            "notes": "Test Notes test edit notes",
            "po_number": None,
            "procurement_shop_id": 1,
            "product_service_code_id": 1,
            "project_officer": 1,
            "project_officer_id": 1,
            "project_id": 1,
            "support_contacts": [],
            "task_order_number": None,
            "team_members": [
                {
                    "id": 3,
                    "full_name": "Ivelisse Martinez-Beck",
                    "email": "Ivelisse.Martinez-Beck@example.com",
                },
                {"id": 5, "full_name": "Tia Brown", "email": "Tia.Brown@example.com"},
            ],
            "vendor": None,
            "vendor_id": None,
            "versions": [{"id": 13, "transaction_id": 313}],
        },
    )
    assert response.status_code == 200
    assert test_contract.name == "Test Edit Title"
    assert test_contract.notes == "Test Notes test edit notes"


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_contract_by_id(auth_client, loaded_db, test_contract):
    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )
    assert response.status_code == 200
    data = response.json
    assert data["name"] == "CTXX12399"
    assert data["contract_number"] == "XXXX000000002"
    assert data["contract_type"] == ContractType.FIRM_FIXED_PRICE.name
    assert data["service_requirement_type"] == ServiceRequirementType.NON_SEVERABLE.name
    assert data["product_service_code_id"] == 2
    assert data["agreement_type"] == AgreementType.CONTRACT.name
    assert data["project_id"] == 1
    assert data["created_by"] is None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_contract_by_id(auth_client, loaded_db, test_contract):
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={"service_requirement_type": "SEVERABLE"},
    )
    assert response.status_code == 200

    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )
    data = response.json
    assert data["name"] == "CTXX12399"
    assert data["contract_number"] == "XXXX000000002"
    assert data["contract_type"] == ContractType.FIRM_FIXED_PRICE.name
    assert data["service_requirement_type"] == ServiceRequirementType.SEVERABLE.name
    assert data["product_service_code_id"] == 2
    assert data["agreement_type"] == AgreementType.CONTRACT.name
    assert data["project_id"] == 1
    assert data["created_by"] is None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_contract_update_existing_vendor(auth_client, loaded_db, test_contract):
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={"vendor": "Vendor 2", "incumbent": "Vendor 2"},
    )
    assert response.status_code == 200

    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )
    data = response.json
    assert data["name"] == "CTXX12399"
    assert data["contract_number"] == "XXXX000000002"
    assert data["contract_type"] == ContractType.FIRM_FIXED_PRICE.name
    assert data["vendor_id"] == 2
    assert data["vendor"] == "Vendor 2"
    assert data["incumbent_id"] == 2
    assert data["incumbent"] == "Vendor 2"
    assert data["product_service_code_id"] == 2
    assert data["agreement_type"] == AgreementType.CONTRACT.name
    assert data["project_id"] == 1
    assert data["created_by"] is None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_contract_update_new_vendor(auth_client, loaded_db, test_contract):
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={"vendor": "Random Test Vendor", "incumbent": "Random Test Vendor"},
    )
    assert response.status_code == 200

    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )
    data = response.json
    assert data["name"] == "CTXX12399"
    assert data["contract_number"] == "XXXX000000002"
    assert data["contract_type"] == ContractType.FIRM_FIXED_PRICE.name
    assert data["vendor_id"] == 4
    assert data["vendor"] == "Random Test Vendor"
    assert data["incumbent_id"] == 4
    assert data["incumbent"] == "Random Test Vendor"
    assert data["product_service_code_id"] == 2
    assert data["agreement_type"] == AgreementType.CONTRACT.name
    assert data["project_id"] == 1
    assert data["created_by"] is None
