import datetime

import pytest
from flask import url_for
from sqlalchemy import func, select

from models import (
    CAN,
    AaAgreement,
    AcquisitionType,
    Agreement,
    AgreementAgency,
    AgreementChangeRequest,
    AgreementReason,
    AgreementType,
    BudgetLineItemStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractCategory,
    ContractType,
    GrantAgreement,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    Portfolio,
    ProcurementShop,
    ProcurementShopFee,
    ResearchProject,
    ServiceRequirementType,
    User,
    Vendor,
)
from models.budget_line_items import BudgetLineItem, ContractBudgetLineItem


@pytest.mark.usefixtures("app_ctx")
def test_agreement_retrieve(loaded_db):
    agreement = loaded_db.get(Agreement, 1)

    assert agreement is not None
    assert agreement.contract_number == "XXXX000000001"
    assert agreement.name == "Contract #1: African American Child and Family Research Center"
    assert agreement.display_name == agreement.name
    assert agreement.id == 1
    assert agreement.agreement_type.name == "CONTRACT"
    assert agreement.procurement_tracker_id is None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_all(auth_client, loaded_db, test_project):
    stmt = select(func.count()).select_from(Agreement)
    count = loaded_db.scalar(stmt)

    response = auth_client.get(url_for("api.agreements-group"))
    assert response.status_code == 200
    assert len(response.json) == count

    # test an agreement
    contract = next((item for item in response.json if "CONTRACT #2" in item["name"]))
    assert contract["agreement_type"] == "CONTRACT"
    assert contract["contract_number"] == "XXXX000000006"
    assert contract["project"]["id"] == 1002
    assert contract["procurement_shop"]["fee_percentage"] == 4.8
    assert contract["vendor"] == "Vendor 1"
    assert "budget_line_items" in contract


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_all_by_fiscal_year(auth_client, loaded_db):
    # determine how many agreements in the DB are in fiscal year 2043
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.fiscal_year == 2043)
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) > 0

    response = auth_client.get(url_for("api.agreements-group"), query_string={"fiscal_year": 2043})
    assert response.status_code == 200
    assert len(response.json) == len(agreements)

    # determine how many agreements in the DB are in fiscal year 2000
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.fiscal_year == 2000)
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) == 0
    response = auth_client.get(url_for("api.agreements-group"), query_string={"fiscal_year": 2000})
    assert response.status_code == 200
    assert len(response.json) == 0

    # determine how many agreements in the DB are in fiscal year 2043 or 2044
    agreements = []
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.fiscal_year == 2043)
    agreements.extend(loaded_db.scalars(stmt).all())
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.fiscal_year == 2044)
    agreements.extend(loaded_db.scalars(stmt).all())
    # remove duplicate agreement objects from agreements list
    set_of_agreements = set(agreements)
    assert len(set_of_agreements) > 0

    response = auth_client.get(url_for("api.agreements-group") + "?fiscal_year=2043&fiscal_year=2044")
    assert response.status_code == 200
    assert len(response.json) == len(set_of_agreements)


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_all_by_budget_line_status(auth_client, loaded_db):
    # determine how many agreements in the DB are in budget line status "DRAFT"
    stmt = (
        select(Agreement)
        .distinct()
        .join(BudgetLineItem)
        .where(BudgetLineItem.status == BudgetLineItemStatus.DRAFT.name)
    )
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) > 0

    response = auth_client.get(
        url_for("api.agreements-group"), query_string={"budget_line_status": BudgetLineItemStatus.DRAFT.name}
    )
    assert response.status_code == 200
    assert len(response.json) == len(agreements)

    # determine how many agreements in the DB are in budget line status "OBLIGATED"
    stmt = (
        select(Agreement)
        .distinct()
        .join(BudgetLineItem)
        .where(BudgetLineItem.status == BudgetLineItemStatus.OBLIGATED.name)
    )
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) > 0
    response = auth_client.get(
        url_for("api.agreements-group"), query_string={"budget_line_status": BudgetLineItemStatus.OBLIGATED.name}
    )
    assert response.status_code == 200
    assert len(response.json) == len(agreements)


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_all_by_portfolio(auth_client, loaded_db):
    # determine how many agreements in the DB are in portfolio 1
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.portfolio_id == 1)
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) > 0

    response = auth_client.get(url_for("api.agreements-group"), query_string={"portfolio": 1})
    assert response.status_code == 200
    assert len(response.json) == len(agreements)

    # determine how many agreements in the DB are in portfolio 1000
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.portfolio_id == 1000)
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) == 0
    response = auth_client.get(url_for("api.agreements-group"), query_string={"portfolio": 1000})
    assert response.status_code == 200
    assert len(response.json) == 0


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_by_id(auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-item", id=1))
    assert response.status_code == 200
    assert response.json["name"] == "Contract #1: African American Child and Family Research Center"
    assert "budget_line_items" in response.json
    assert "can_id" in response.json["budget_line_items"][0]
    assert "can" in response.json["budget_line_items"][0]
    assert response.json["budget_line_items"][0]["can"]["number"] is not None
    assert response.json["budget_line_items"][0]["can"]["display_name"] is not None
    assert response.json["_meta"]["isEditable"] is True
    assert response.json["in_review"] is False
    assert response.json["change_requests_in_review"] is None


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
    assert response.json["awarding_entity_id"] == agreement.awarding_entity_id
    assert response.json["product_service_code_id"] == agreement.product_service_code_id
    assert response.json["project_officer_id"] == agreement.project_officer_id
    assert response.json["alternate_project_officer_id"] == agreement.alternate_project_officer_id
    assert response.json["project_id"] == agreement.project_id
    assert response.json["support_contacts"] == agreement.support_contacts
    assert len(response.json["team_members"]) == len(agreement.team_members)
    assert response.json["vendor_id"] == agreement.vendor_id
    assert response.json["vendor"] == agreement.vendor.name
    assert response.json["in_review"] is False
    assert response.json["change_requests_in_review"] is None


@pytest.mark.skip("Need to consult whether this should return ALL or NONE if the value is empty")
@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_project_empty(auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-group"), query_string={"project_id": ""})
    assert response.status_code == 200
    assert len(response.json) == 6


@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_project_found(auth_client, loaded_db, test_project):
    response = auth_client.get(url_for("api.agreements-group"), query_string={"project_id": test_project.id})
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
        ("agreement_reason", AgreementReason.NEW_REQ.name),
        ("contract_number", "XXXX000000001"),
        ("contract_type", ContractType.FIRM_FIXED_PRICE.name),
        ("agreement_type", AgreementType.CONTRACT.name),
        ("delivered_status", False),
        ("awarding_entity_id", 1),
        ("project_officer_id", 1),
        ("alternate_project_officer_id", 1),
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
def test_agreements_with_only_my_filter(division_director_auth_client):
    query_dict = {"only_my": True}
    response = division_director_auth_client.get(url_for("api.agreements-group"), query_string=query_dict)
    assert response.status_code == 200
    assert len(response.json) == 8


@pytest.mark.usefixtures("app_ctx")
def test_agreements_with_project_not_found(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"project_id": "1000000"},
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
        query_string={"search": "Contract #"},
    )

    assert response.status_code == 200
    assert len(response.json) == 3


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
@pytest.mark.usefixtures("app_ctx")
def test_contract(loaded_db, test_vendor, test_admin_user, test_project):
    contract_agreement = ContractAgreement(
        name="CTXX12399",
        contract_number="XXXX000000002",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_admin_user.id,
        vendor_id=test_vendor.id,
        project_officer_id=test_admin_user.id,
        awarding_entity_id=2,
    )

    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def test_psf(loaded_db):
    """Create a ProcurementShopFee for testing"""
    ps = ProcurementShop(name="Whatever", abbr="WHO")

    loaded_db.add(ps)
    loaded_db.commit()
    loaded_db.refresh(ps)

    psf = ProcurementShopFee(
        id=99,
        procurement_shop_id=ps.id,
        fee=0.2,
    )

    ps.procurement_shop_fees.append(psf)

    loaded_db.add(psf)
    loaded_db.commit()

    yield psf

    loaded_db.delete(ps)
    loaded_db.delete(psf)
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
            "team_members": [{"id": 500}],
            "support_contacts": [{"id": 501}, {"id": 502}],
            "notes": "Test Note",
            "awarding_entity_id": 1,
        },
    )
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "Updated Contract Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "Updated Contract Description"
    assert agreement.notes == "Test Note"
    assert agreement.awarding_entity_id == 1
    assert [m.id for m in agreement.team_members] == [500]
    assert [m.id for m in agreement.support_contacts] == [501, 502]
    assert agreement.in_review is False
    assert agreement.change_requests_in_review is None


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
    assert agreement.in_review is False
    assert agreement.change_requests_in_review is None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_put_by_id_grant(auth_client, loaded_db):
    """PUT GRANT Agreement"""
    response = auth_client.put(
        url_for("api.agreements-item", id=3),
        json={
            "agreement_type": "GRANT",
            "name": "Updated Grant Name",
            "description": "Updated Grant Description",
            "team_members": [{"id": 500}, {"id": 501}, {"id": 502}],
        },
    )
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == 3)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "Updated Grant Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "Updated Grant Description"
    assert [m.id for m in agreement.team_members] == [500, 501, 502]
    assert agreement.in_review is False
    assert agreement.change_requests_in_review is None


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
            "team_members": [{"id": 500}],
            "support_contacts": [{"id": 501}, {"id": 502}],
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
    assert [m.id for m in agreement.team_members] == [500]
    assert [m.id for m in agreement.support_contacts] == [501, 502]
    assert agreement.in_review is False
    assert agreement.change_requests_in_review is None


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
            "team_members": [{"id": 500}],
            "support_contacts": [{"id": 501}, {"id": 502}],
            "notes": "Test Note",
        },
    )
    assert response.status_code == 200

    assert test_contract.name == "Updated Contract Name"
    assert test_contract.display_name == test_contract.name
    assert test_contract.description == "Updated Contract Description"
    assert test_contract.notes == "Test Note"
    assert [m.id for m in test_contract.team_members] == [500]
    assert [m.id for m in test_contract.support_contacts] == [501, 502]
    assert test_contract.in_review is False
    assert test_contract.change_requests_in_review is None

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
    assert test_contract.in_review is False
    assert test_contract.change_requests_in_review is None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_grant(auth_client, loaded_db):
    """PATCH GRANT"""
    response = auth_client.patch(
        url_for("api.agreements-item", id=3),
        json={
            "agreement_type": "GRANT",
            "name": "Updated Grant Name",
            "description": "Updated Grant Description",
            "team_members": [{"id": 500}],
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
    assert [m.id for m in agreement.team_members] == [500]
    assert agreement.in_review is False
    assert agreement.change_requests_in_review is None


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_just_notes(auth_client, loaded_db, test_contract):
    """PATCH with just notes to test out other fields being optional"""
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "notes": "Test PATCH",
        },
    )
    assert response.status_code == 200

    assert test_contract.notes == "Test PATCH"


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


@pytest.mark.usefixtures("app_ctx")
def test_agreements_post(auth_client, loaded_db):
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": AgreementType.CONTRACT.name,
            "name": "Test Contract (for post)",
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_agreements_post_contract_with_service_requirement_type(auth_client, loaded_db, test_project):
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "CONTRACT",
            "agreement_reason": "NEW_REQ",
            "name": "FRANK TEST",
            "description": "test description",
            "product_service_code_id": 1,
            "project_officer_id": 500,
            "alternate_project_officer_id": 501,
            "team_members": [
                {
                    "id": 501,
                    "full_name": "Amy Madigan",
                    "email": "Amy.Madigan@example.com",
                }
            ],
            "notes": "test notes",
            "project_id": test_project.id,
            "awarding_entity_id": 2,
            "contract_type": "FIRM_FIXED_PRICE",
            "service_requirement_type": "SEVERABLE",
            "vendor": None,
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_agreements_post_contract_with_vendor(auth_client, loaded_db, test_user, test_admin_user, test_project):
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "CONTRACT",
            "agreement_reason": "NEW_REQ",
            "name": "REED TEST CONTRACT",
            "description": "test description",
            "product_service_code_id": 1,
            "vendor": "Vendor 1",
            "project_officer_id": test_user.id,
            "alternate_project_officer_id": test_admin_user.id,
            "team_members": [
                {
                    "id": 501,
                    "full_name": "Amy Madigan",
                    "email": "Amy.Madigan@example.com",
                }
            ],
            "notes": "test notes",
            "project_id": test_project.id,
            "awarding_entity_id": 2,
            "contract_type": "FIRM_FIXED_PRICE",
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_by_id_e2e(auth_client, loaded_db, test_contract, test_project):
    """PATCH with mimicking the e2e test"""
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "acquisition_type": None,
            "agreement_reason": "NEW_REQ",
            "agreement_type": "CONTRACT",
            "contract_number": None,
            "contract_type": None,
            "created_by_user": 520,
            "delivered_status": False,
            "description": "Test Description",
            "display_name": "Test Contract",
            "name": "Test Edit Title",
            "notes": "Test Notes test edit notes",
            "po_number": None,
            "awarding_entity_id": 1,
            "product_service_code_id": 1,
            "project_officer": 500,
            "project_officer_id": 500,
            "alternate_project_officer_id": 501,
            "project_id": test_project.id,
            "support_contacts": [],
            "task_order_number": None,
            "team_members": [
                {
                    "id": 502,
                    "full_name": "Ivelisse Martinez-Beck",
                    "email": "Ivelisse.Martinez-Beck@example.com",
                },
                {"id": 504, "full_name": "Tia Brown", "email": "Tia.Brown@example.com"},
            ],
            "vendor": None,
            "vendor_id": None,
            "versions": [{"id": 13, "transaction_id": 313}],
        },
    )
    assert response.status_code == 200

    # Verify that the test contract agreement was updated successfully
    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "Test Edit Title"
    assert agreement.display_name == agreement.name
    assert agreement.description == "Test Description"
    assert [m.id for m in agreement.team_members] == [502, 504]


@pytest.mark.usefixtures("app_ctx")
def test_update_agreement_procurement_shop_without_blis(
    auth_client, loaded_db, test_contract, test_project, test_admin_user, test_vendor
):
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "awarding_entity_id": 1,
        },
    )
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)
    assert agreement.awarding_entity_id == 1
    assert agreement.name == "CTXX12399"
    assert agreement.contract_number == "XXXX000000002"
    assert agreement.contract_type == ContractType.FIRM_FIXED_PRICE
    assert agreement.service_requirement_type == ServiceRequirementType.NON_SEVERABLE
    assert agreement.product_service_code_id == 2
    assert agreement.agreement_type == AgreementType.CONTRACT
    assert agreement.project_id == test_project.id
    assert agreement.vendor_id == test_vendor.id
    assert agreement.project_officer_id == test_admin_user.id


@pytest.mark.usefixtures("app_ctx")
def test_update_agreement_procurement_shop_error_with_bli_in_execution(auth_client, loaded_db, test_contract, test_can):
    """Test that changing agreement procurement shop fails when BLIs are in execution or higher"""
    # Create a BLI in IN_EXECUTION status
    bli = ContractBudgetLineItem(
        line_description="Test BLI for execution status",
        agreement_id=test_contract.id,
        can_id=test_can.id,
        amount=5000.00,
        status=BudgetLineItemStatus.IN_EXECUTION,
        date_needed=datetime.date(2043, 6, 30),
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    # Try to update the awarding_entity_id
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={"awarding_entity_id": 3},  # Different from the current value
    )

    assert response.status_code == 400
    assert "Validation failed" in response.json["message"]

    # Cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_update_agreement_procurement_shop_with_draft_bli(auth_client, loaded_db, test_contract, test_can):
    """Test that changing agreement procurement shop will update draft BLI's procurement shop fee"""

    bli = ContractBudgetLineItem(
        line_description="Test BLI for execution status",
        agreement_id=test_contract.id,
        can_id=test_can.id,
        amount=5000.00,
        status=BudgetLineItemStatus.DRAFT,
        date_needed=datetime.date(2043, 6, 30),
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    # Try to update the awarding_entity_id
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={"awarding_entity_id": 3},  # test_contract.awarding_entity_id is initialized to 2
    )

    assert response.status_code == 200
    assert bli.agreement.awarding_entity_id == 3

    # Cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_update_agreement_procurement_shop_with_planned_bli(auth_client, loaded_db, test_contract, test_can):
    """Test that changing agreement procurement shop with a PLANNED BLI will start a change request"""

    bli = ContractBudgetLineItem(
        line_description="Test BLI for execution status",
        agreement_id=test_contract.id,
        can_id=test_can.id,
        amount=5000.00,
        status=BudgetLineItemStatus.PLANNED,
        date_needed=datetime.date(2043, 6, 30),
        created_by=1,
    )
    loaded_db.add(bli)
    loaded_db.commit()

    patch_response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={"awarding_entity_id": 3},  # Different from the current value
    )
    assert patch_response.status_code == 202

    get_response = auth_client.get(url_for("api.agreements-item", id=test_contract.id))
    assert get_response.status_code == 200
    assert get_response.json["awarding_entity_id"] == 2  # Original value, change request not yet approved
    assert get_response.json["in_review"] is True
    assert get_response.json["change_requests_in_review"] is not None

    # Cleanup
    loaded_db.delete(bli)
    loaded_db.commit()


def test_agreements_get_by_id_in_review(auth_client, loaded_db, test_vendor, test_admin_user, test_project):
    """Test that an agreement in review returns the correct data."""
    ca = ContractAgreement(
        name="CTYY78945",
        contract_number="CONTRACT20250001",
        contract_type=ContractType.COST_PLUS_AWARD_FEE,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
        product_service_code_id=2,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        created_by=test_admin_user.id,
        vendor_id=test_vendor.id,
        project_officer_id=test_admin_user.id,
        awarding_entity_id=2,
    )
    loaded_db.add(ca)
    loaded_db.commit()

    acr = AgreementChangeRequest(
        agreement_id=ca.id,
        change_request_type=ChangeRequestType.AGREEMENT_CHANGE_REQUEST,
        requested_change_diff={
            "awarding_entity_id": {
                "new": 3,
                "old": ca.awarding_entity_id,
            }
        },
        requested_change_data={"awarding_entity_id": 3},
        created_by=test_admin_user.id,
    )
    loaded_db.add(acr)
    loaded_db.commit()

    assert ca.in_review is True
    assert ca.change_requests_in_review == [acr]

    loaded_db.delete(acr)
    loaded_db.delete(ca)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_contract_by_id(auth_client, loaded_db, test_contract):
    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )
    assert response.status_code == 200
    data = response.json
    assert data["name"] == test_contract.name
    assert data["contract_number"] == test_contract.contract_number
    assert data["contract_type"] == test_contract.contract_type.name
    assert data["service_requirement_type"] == test_contract.service_requirement_type.name
    assert data["product_service_code_id"] == test_contract.product_service_code_id
    assert data["agreement_type"] == test_contract.agreement_type.name
    assert data["project_id"] == test_contract.project_id
    assert data["created_by"] is test_contract.created_by


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

    assert response.status_code == 200
    data = response.json
    assert data["name"] == test_contract.name
    assert data["contract_number"] == test_contract.contract_number
    assert data["contract_type"] == test_contract.contract_type.name
    assert data["service_requirement_type"] == ServiceRequirementType.SEVERABLE.name
    assert data["product_service_code_id"] == test_contract.product_service_code_id
    assert data["agreement_type"] == test_contract.agreement_type.name
    assert data["project_id"] == test_contract.project_id
    assert data["created_by"] is test_contract.created_by


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_contract_update_existing_vendor(auth_client, loaded_db, test_contract):
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={"vendor": "Vendor 2"},
    )
    assert response.status_code == 200

    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )

    assert response.status_code == 200
    data = response.json
    assert data["name"] == test_contract.name
    assert data["contract_number"] == test_contract.contract_number
    assert data["contract_type"] == test_contract.contract_type.name
    assert data["service_requirement_type"] == test_contract.service_requirement_type.name
    assert data["product_service_code_id"] == test_contract.product_service_code_id
    assert data["agreement_type"] == test_contract.agreement_type.name
    assert data["project_id"] == test_contract.project_id
    assert data["created_by"] is test_contract.created_by
    assert data["vendor_id"] == 101
    assert data["vendor"] == "Vendor 2"


@pytest.mark.usefixtures("app_ctx")
def test_agreements_patch_contract_update_new_vendor(auth_client, loaded_db, test_contract):
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={"vendor": "Random Test Vendor"},
    )
    assert response.status_code == 200

    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )

    data = response.json
    assert data["name"] == test_contract.name
    assert data["contract_number"] == test_contract.contract_number
    assert data["contract_type"] == test_contract.contract_type.name
    assert data["service_requirement_type"] == test_contract.service_requirement_type.name
    assert data["product_service_code_id"] == test_contract.product_service_code_id
    assert data["agreement_type"] == test_contract.agreement_type.name
    assert data["project_id"] == test_contract.project_id
    assert data["created_by"] is test_contract.created_by
    assert data["vendor_id"] == 103
    assert data["vendor"] == "Random Test Vendor"


@pytest.mark.usefixtures("app_ctx")
def test_agreements_includes_meta(auth_client, basic_user_auth_client, loaded_db):
    response = auth_client.get(url_for("api.agreements-group"))
    assert response.status_code == 200

    # test an agreement
    data = response.json
    for item in data:
        assert "_meta" in item

    # most/all of the agreements should be editable
    assert any(item["_meta"]["isEditable"] for item in data)

    response = basic_user_auth_client.get(url_for("api.agreements-group"))
    assert response.status_code == 200

    # test an agreement
    data = response.json
    for item in data:
        assert "_meta" in item

    # most/all of the agreements should not be editable
    assert any(not item["_meta"]["isEditable"] for item in data)


@pytest.mark.usefixtures("app_ctx")
def test_agreement_updates_by_team_leaders(
    division_director_auth_client, auth_client, test_contract, loaded_db, test_project, test_admin_user, test_vendor
):
    # Add test division director as a team member to the test contract agreement
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "team_members": [
                {
                    "id": 522,  # DivisionDirectorAuthClient user id
                    "full_name": "Dave Director",
                    "email": "dave.director@email.com",
                }
            ],
        },
    )
    assert response.status_code == 200

    # Verify that the division director can do partial updates the test contract agreement
    patch_response = division_director_auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "PATCH Updated Contract Name",
            "description": "PATCH Updated Contract Description",
        },
    )
    assert patch_response.status_code == 200

    # Verify that the test contract agreement was updated successfully
    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "PATCH Updated Contract Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "PATCH Updated Contract Description"
    assert [m.id for m in agreement.team_members] == [522]

    # Verify that the division director can do full updates to the test contract agreement
    put_response = division_director_auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "name": "PUT Updated Contract Name",
            "contract_number": "XXXX000000002",
            "contract_type": "FIRM_FIXED_PRICE",
            "service_requirement_type": "NON_SEVERABLE",
            "product_service_code_id": 2,
            "agreement_type": "CONTRACT",
            "project_id": test_project.id,
            "created_by": test_admin_user.id,
            "updated_by": 522,  # DivisionDirectorAuthClient user id
            "vendor_id": test_vendor.id,
            "description": "PUT Updated Contract Description",
            "alternate_project_officer_id": test_admin_user.id,
            "team_members": [
                {
                    "id": 522,  # DivisionDirectorAuthClient user id
                    "full_name": "Dave Director",
                    "email": "dave.director@email.com",
                }
            ],
        },
    )
    assert put_response.status_code == 200

    # Verify that the test contract agreement was updated successfully
    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.name == "PUT Updated Contract Name"
    assert agreement.display_name == agreement.name
    assert agreement.description == "PUT Updated Contract Description"
    assert agreement.contract_number == "XXXX000000002"
    assert agreement.contract_type == ContractType.FIRM_FIXED_PRICE
    assert agreement.service_requirement_type == ServiceRequirementType.NON_SEVERABLE
    assert agreement.product_service_code_id == 2
    assert agreement.agreement_type.name == "CONTRACT"
    assert agreement.project_id == test_project.id
    assert agreement.updated_by == 522  # DivisionDirectorAuthClient user id
    assert agreement.vendor_id == test_vendor.id
    assert agreement.project_officer_id == test_admin_user.id
    assert agreement.alternate_project_officer_id == test_admin_user.id
    assert [m.id for m in agreement.team_members] == [522]


@pytest.mark.usefixtures("app_ctx")
def test_get_agreement_returns_portfolio_team_leaders(auth_client, loaded_db):
    stmt = select(Agreement).where(Agreement.id == 9)
    agreement = loaded_db.scalar(stmt)

    assert agreement is not None
    assert agreement.id == 9
    assert agreement.budget_line_items is not None
    assert agreement.team_leaders == ["Ivelisse Martinez-Beck", "Sheila Celentano"]
    assert agreement.division_directors == ["Dave Director", "Director Derrek"]

    assert len(agreement.budget_line_items) == 2
    assert len(agreement.budget_line_items[0].portfolio_team_leaders) == 1
    assert agreement.budget_line_items[0].portfolio_team_leaders[0].email == "sheila.celentano@acf.hhs.gov"
    assert agreement.budget_line_items[0].portfolio_team_leaders[0].full_name == "Sheila Celentano"
    assert agreement.budget_line_items[0].portfolio_team_leaders[0].id == 68

    assert len(agreement.budget_line_items[1].portfolio_team_leaders) == 1
    assert agreement.budget_line_items[1].portfolio_team_leaders[0].email == "Ivelisse.Martinez-Beck@example.com"
    assert agreement.budget_line_items[1].portfolio_team_leaders[0].full_name == "Ivelisse Martinez-Beck"
    assert agreement.budget_line_items[1].portfolio_team_leaders[0].id == 502

    bli_ids = [b.id for b in agreement.budget_line_items]
    portfolio_team_leaders_ids = [tl[0].id for tl in [b.portfolio_team_leaders for b in agreement.budget_line_items]]

    for _id in bli_ids:
        bli = loaded_db.scalar(select(BudgetLineItem).where(BudgetLineItem.id == _id))
        assert bli.can_id is not None

        can = loaded_db.scalar(select(CAN).where(CAN.id == bli.can_id))
        assert can.portfolio_id is not None

        portfolio = loaded_db.scalar(select(Portfolio).where(Portfolio.id == can.portfolio_id))
        assert portfolio is not None

        assert all(tl.id in portfolio_team_leaders_ids for tl in portfolio.team_leaders)

    response = auth_client.get(
        url_for("api.agreements-item", id=9),
    )
    assert response.status_code == 200
    assert response.json["id"] == 9
    assert response.json["budget_line_items"] is not None
    assert len(response.json["budget_line_items"]) == 2
    assert response.json["team_leaders"] is not None
    assert len(response.json["team_leaders"]) == 2
    assert response.json["team_leaders"] == ["Ivelisse Martinez-Beck", "Sheila Celentano"]
    for bli in response.json["budget_line_items"]:
        assert bli["id"] in bli_ids
        assert "portfolio_team_leaders" in bli
        assert len(bli["portfolio_team_leaders"]) > 0
        for tl in bli["portfolio_team_leaders"]:
            assert tl["email"] is not None
            assert tl["full_name"] is not None
            assert tl["id"] in portfolio_team_leaders_ids


@pytest.mark.usefixtures("app_ctx")
def test_agreement_get_events_are_persisted(auth_client, loaded_db):
    # Count existing GET_AGREEMENT events before our test
    initial_event_count = loaded_db.scalar(
        select(func.count()).select_from(OpsEvent).where(OpsEvent.event_type == OpsEventType.GET_AGREEMENT)
    )

    # Make a GET request to the agreements list endpoint
    list_response = auth_client.get(url_for("api.agreements-group"))
    assert list_response.status_code == 200

    # Verify an event was created for the list request
    list_event_count = loaded_db.scalar(
        select(func.count()).select_from(OpsEvent).where(OpsEvent.event_type == OpsEventType.GET_AGREEMENT)
    )
    assert list_event_count == initial_event_count + 1

    # Get the latest event from the DB
    list_event = loaded_db.scalar(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.GET_AGREEMENT).order_by(OpsEvent.id.desc())
    )

    # Verify the event has the expected properties
    assert list_event is not None
    assert list_event.event_type == OpsEventType.GET_AGREEMENT
    assert list_event.event_status == OpsEventStatus.SUCCESS
    assert "agreement_ids" in list_event.event_details

    # Now test the individual agreement endpoint
    item_response = auth_client.get(url_for("api.agreements-item", id=1))
    assert item_response.status_code == 200

    # Verify another event was created for the item request
    item_event_count = loaded_db.scalar(
        select(func.count()).select_from(OpsEvent).where(OpsEvent.event_type == OpsEventType.GET_AGREEMENT)
    )

    assert item_event_count == list_event_count + 1

    # Get the latest event from the DB
    item_event = loaded_db.scalar(
        select(OpsEvent).where(OpsEvent.event_type == OpsEventType.GET_AGREEMENT).order_by(OpsEvent.id.desc())
    )

    # Verify the event has the expected properties
    assert item_event is not None
    assert item_event.event_type == OpsEventType.GET_AGREEMENT
    assert item_event.event_status == OpsEventStatus.SUCCESS
    assert "agreement_id" in item_event.event_details
    assert item_event.event_details["agreement_id"] == 1


@pytest.mark.usefixtures("app_ctx")
def test_get_agreement_returns_empty_portfolio_team_leaders(auth_client, loaded_db, test_contract):
    """Test that an agreement with no budget lines returns empty portfolio team leaders"""

    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )
    assert response.status_code == 200
    assert response is not None
    assert response.json["budget_line_items"] == []
    assert response.json["team_leaders"] == []
    assert response.json["division_directors"] == []


@pytest.fixture()
def db_for_aa_agreement(loaded_db):
    requesting_agency = AgreementAgency(
        name="Test Requesting Agency",
        abbreviation="TTA",
        requesting=True,
        servicing=False,
    )

    servicing_agency = AgreementAgency(
        name="Test Servicing Agency",
        abbreviation="TSA",
        requesting=False,
        servicing=True,
    )

    vendor = Vendor(
        name="Test Vendor",
        duns="123456789",
    )

    project = ResearchProject(
        title="Test Project for AA Agreement",
        description="This is a test project for AA agreement.",
    )

    procurement_shop = ProcurementShop(
        name="Test Procurement Shop",
        abbr="TPS",
    )

    loaded_db.add(requesting_agency)
    loaded_db.add(servicing_agency)
    loaded_db.add(vendor)
    loaded_db.add(project)
    loaded_db.add(procurement_shop)
    loaded_db.commit()

    yield loaded_db

    loaded_db.delete(requesting_agency)
    loaded_db.delete(servicing_agency)
    loaded_db.delete(vendor)
    loaded_db.delete(project)
    loaded_db.delete(procurement_shop)
    loaded_db.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreements_post_aa_agreement_min(auth_client, db_for_aa_agreement):
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": AgreementType.AA.name,
            "name": "Test AA Agreement",
            "requesting_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
            ),
            "servicing_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
            ),
            "service_requirement_type": ServiceRequirementType.NON_SEVERABLE.name,
        },
    )
    assert response.status_code == 201
    aa_id = response.json["id"]

    aa_from_db = db_for_aa_agreement.get(AaAgreement, aa_id)

    assert aa_from_db is not None
    assert aa_from_db.name == "Test AA Agreement"
    assert aa_from_db.agreement_type == AgreementType.AA
    assert aa_from_db.requesting_agency_id == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
    )
    assert aa_from_db.servicing_agency_id == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
    )
    assert aa_from_db.service_requirement_type == ServiceRequirementType.NON_SEVERABLE

    # Cleanup
    db_for_aa_agreement.delete(aa_from_db)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreements_post_aa_agreement_max(auth_client, db_for_aa_agreement):
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": AgreementType.AA.name,
            "name": "Test AA Agreement",
            "requesting_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
            ),
            "servicing_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
            ),
            "service_requirement_type": ServiceRequirementType.NON_SEVERABLE.name,
            "contract_number": "AA-123456",
            "vendor": "Test Vendor",
            "task_order_number": "TO-7890",
            "po_number": "PO-1234",
            "acquisition_type": AcquisitionType.GSA_SCHEDULE.name,
            "delivered_status": True,
            "contract_type": ContractType.FIRM_FIXED_PRICE.name,
            "support_contacts": [
                {
                    "id": 501,
                },
            ],
            "contract_category": ContractCategory.SERVICE.name,
            "psc_contract_specialist": "Test Specialist",
            "cotr_id": 502,
            "nick_name": "Test Nickname",
            "description": "This is a test AA agreement with maximum fields.",
            "product_service_code_id": 1,
            "agreement_reason": AgreementReason.NEW_REQ.name,
            "project_officer_id": 500,
            "alternate_project_officer_id": 501,
            "team_members": [
                {
                    "id": 500,
                },
                {
                    "id": 501,
                },
            ],
            "project_id": db_for_aa_agreement.scalar(
                select(ResearchProject.id).where(ResearchProject.title == "Test Project for AA Agreement")
            ),
            "awarding_entity_id": db_for_aa_agreement.scalar(
                select(ProcurementShop.id).where(ProcurementShop.name == "Test Awarding Entity")
            ),
            "notes": "This is a test AA agreement with maximum fields.",
            "start_date": "2023-01-01",
            "end_date": "2024-01-01",
            "maps_sys_id": "1234",
        },
    )
    assert response.status_code == 201
    aa_id = response.json["id"]

    aa_from_db = db_for_aa_agreement.get(AaAgreement, aa_id)

    assert aa_from_db is not None
    assert aa_from_db.name == "Test AA Agreement"
    assert aa_from_db.agreement_type == AgreementType.AA
    assert aa_from_db.requesting_agency_id == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
    )
    assert aa_from_db.servicing_agency_id == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
    )
    assert aa_from_db.service_requirement_type == ServiceRequirementType.NON_SEVERABLE
    assert aa_from_db.contract_number == "AA-123456"
    assert aa_from_db.vendor_id == db_for_aa_agreement.scalar(select(Vendor.id).where(Vendor.name == "Test Vendor"))
    assert aa_from_db.task_order_number == "TO-7890"
    assert aa_from_db.po_number == "PO-1234"
    assert aa_from_db.acquisition_type == AcquisitionType.GSA_SCHEDULE
    assert aa_from_db.delivered_status is True
    assert aa_from_db.contract_type == ContractType.FIRM_FIXED_PRICE
    assert [sc.id for sc in aa_from_db.support_contacts] == [501]
    assert aa_from_db.contract_category == ContractCategory.SERVICE
    assert aa_from_db.psc_contract_specialist == "Test Specialist"
    assert aa_from_db.cotr_id == 502
    assert aa_from_db.nick_name == "Test Nickname"
    assert aa_from_db.description == "This is a test AA agreement with maximum fields."
    assert aa_from_db.product_service_code_id == 1
    assert aa_from_db.agreement_reason == AgreementReason.NEW_REQ
    assert aa_from_db.project_officer_id == 500
    assert aa_from_db.alternate_project_officer_id == 501
    assert [tm.id for tm in aa_from_db.team_members] == [500, 501]
    assert aa_from_db.project_id == db_for_aa_agreement.scalar(
        select(ResearchProject.id).where(ResearchProject.title == "Test Project for AA Agreement")
    )
    assert aa_from_db.awarding_entity_id == db_for_aa_agreement.scalar(
        select(ProcurementShop.id).where(ProcurementShop.name == "Test Awarding Entity")
    )
    assert aa_from_db.notes == "This is a test AA agreement with maximum fields."
    assert aa_from_db.start_date == datetime.date(2023, 1, 1)
    assert aa_from_db.end_date == datetime.date(2024, 1, 1)
    assert aa_from_db.maps_sys_id == 1234

    # Cleanup
    db_for_aa_agreement.delete(aa_from_db)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreements_put_aa_agreement_min(auth_client, db_for_aa_agreement):
    # Create an AA agreement first
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": AgreementType.AA.name,
            "name": "Test AA Agreement",
            "requesting_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
            ),
            "servicing_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
            ),
            "service_requirement_type": ServiceRequirementType.NON_SEVERABLE.name,
        },
    )
    assert response.status_code == 201
    aa_id = response.json["id"]

    # Now update it with PUT
    put_response = auth_client.put(
        url_for("api.agreements-item", id=aa_id),
        json={
            "agreement_type": AgreementType.AA.name,
            "name": "Updated Test AA Agreement",
            "requesting_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
            ),
            "servicing_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
            ),
            "service_requirement_type": ServiceRequirementType.NON_SEVERABLE.name,
        },
    )
    assert put_response.status_code == 200

    aa_from_db = db_for_aa_agreement.get(AaAgreement, aa_id)

    assert aa_from_db is not None
    assert aa_from_db.name == "Updated Test AA Agreement"
    assert aa_from_db.agreement_type == AgreementType.AA
    assert aa_from_db.requesting_agency_id == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
    )
    assert aa_from_db.servicing_agency_id == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
    )
    assert aa_from_db.service_requirement_type == ServiceRequirementType.NON_SEVERABLE

    # Cleanup
    db_for_aa_agreement.delete(aa_from_db)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreements_put_aa_agreement_max(auth_client, db_for_aa_agreement):
    # Create an AA agreement first
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": AgreementType.AA.name,
            "name": "Test AA Agreement",
            "requesting_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
            ),
            "servicing_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
            ),
            "service_requirement_type": ServiceRequirementType.NON_SEVERABLE.name,
        },
    )
    assert response.status_code == 201
    aa_id = response.json["id"]

    # Now update it with PUT
    put_response = auth_client.put(
        url_for("api.agreements-item", id=aa_id),
        json={
            "agreement_type": AgreementType.AA.name,
            "name": "Updated Test AA Agreement",
            "requesting_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
            ),
            "servicing_agency_id": db_for_aa_agreement.scalar(
                select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
            ),
            "service_requirement_type": ServiceRequirementType.NON_SEVERABLE.name,
            "contract_number": "AA-123456",
            "vendor": "Test Vendor",
            "task_order_number": "TO-7890",
            "po_number": "PO-1234",
            "acquisition_type": AcquisitionType.GSA_SCHEDULE.name,
            "delivered_status": True,
            "contract_type": ContractType.FIRM_FIXED_PRICE.name,
            "support_contacts": [
                {
                    "id": 501,
                },
            ],
            "contract_category": ContractCategory.SERVICE.name,
            "psc_contract_specialist": "Test Specialist",
            "cotr_id": 502,
            "nick_name": "Test Nickname",
            "description": "This is a test AA agreement with maximum fields.",
            "product_service_code_id": 1,
            "agreement_reason": AgreementReason.NEW_REQ.name,
            "project_officer_id": 500,
            "alternate_project_officer_id": 501,
            "team_members": [
                {
                    "id": 500,
                },
                {
                    "id": 501,
                },
            ],
            "project_id": db_for_aa_agreement.scalar(
                select(ResearchProject.id).where(ResearchProject.title == "Test Project for AA Agreement")
            ),
            "awarding_entity_id": db_for_aa_agreement.scalar(
                select(ProcurementShop.id).where(ProcurementShop.name == "Test Awarding Entity")
            ),
            "notes": "This is a test AA agreement with maximum fields.",
            "start_date": "2023-01-01",
            "end_date": "2024-01-01",
            "maps_sys_id": "1234",
        },
    )
    assert put_response.status_code == 200
    aa_from_db = db_for_aa_agreement.get(AaAgreement, aa_id)
    assert aa_from_db is not None
    assert aa_from_db.name == "Updated Test AA Agreement"
    assert aa_from_db.agreement_type == AgreementType.AA
    assert aa_from_db.requesting_agency_id == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
    )
    assert aa_from_db.servicing_agency_id == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
    )
    assert aa_from_db.service_requirement_type == ServiceRequirementType.NON_SEVERABLE
    assert aa_from_db.contract_number == "AA-123456"
    assert aa_from_db.vendor_id == db_for_aa_agreement.scalar(select(Vendor.id).where(Vendor.name == "Test Vendor"))
    assert aa_from_db.task_order_number == "TO-7890"
    assert aa_from_db.po_number == "PO-1234"
    assert aa_from_db.acquisition_type == AcquisitionType.GSA_SCHEDULE
    assert aa_from_db.delivered_status is True
    assert aa_from_db.contract_type == ContractType.FIRM_FIXED_PRICE
    assert [sc.id for sc in aa_from_db.support_contacts] == [501]
    assert aa_from_db.contract_category == ContractCategory.SERVICE
    assert aa_from_db.psc_contract_specialist == "Test Specialist"
    assert aa_from_db.cotr_id == 502
    assert aa_from_db.nick_name == "Test Nickname"
    assert aa_from_db.description == "This is a test AA agreement with maximum fields."
    assert aa_from_db.product_service_code_id == 1
    assert aa_from_db.agreement_reason == AgreementReason.NEW_REQ
    assert aa_from_db.project_officer_id == 500
    assert aa_from_db.alternate_project_officer_id == 501
    assert [tm.id for tm in aa_from_db.team_members] == [500, 501]
    assert aa_from_db.project_id == db_for_aa_agreement.scalar(
        select(ResearchProject.id).where(ResearchProject.title == "Test Project for AA Agreement")
    )
    assert aa_from_db.awarding_entity_id == db_for_aa_agreement.scalar(
        select(ProcurementShop.id).where(ProcurementShop.name == "Test Awarding Entity")
    )
    assert aa_from_db.notes == "This is a test AA agreement with maximum fields."
    assert aa_from_db.start_date == datetime.date(2023, 1, 1)
    assert aa_from_db.end_date == datetime.date(2024, 1, 1)
    assert aa_from_db.maps_sys_id == 1234

    # Cleanup
    db_for_aa_agreement.delete(aa_from_db)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_aa_agreement_max(auth_client, db_for_aa_agreement):
    # create an AaAgreement with max params and get it
    aa = AaAgreement(
        name="Test AA Agreement",
        agreement_type=AgreementType.AA,
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        contract_number="AA-123456",
        vendor_id=db_for_aa_agreement.scalar(select(Vendor.id).where(Vendor.name == "Test Vendor")),
        task_order_number="TO-7890",
        po_number="PO-1234",
        acquisition_type=AcquisitionType.GSA_SCHEDULE,
        delivered_status=True,
        contract_type=ContractType.FIRM_FIXED_PRICE,
        support_contacts=[db_for_aa_agreement.get(User, 501)],
        contract_category=ContractCategory.SERVICE,
        psc_contract_specialist="Test Specialist",
        cotr_id=502,
        nick_name="Test Nickname",
        description="This is a test AA agreement with maximum fields.",
        product_service_code_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=500,
        alternate_project_officer_id=501,
        team_members=[db_for_aa_agreement.get(User, 500), db_for_aa_agreement.get(User, 501)],
        project_id=db_for_aa_agreement.scalar(
            select(ResearchProject.id).where(ResearchProject.title == "Test Project for AA Agreement")
        ),
        awarding_entity_id=db_for_aa_agreement.scalar(
            select(ProcurementShop.id).where(ProcurementShop.name == "Test Awarding Entity")
        ),
        notes="This is a test AA agreement with maximum fields.",
        start_date=datetime.date(2023, 1, 1),
        end_date=datetime.date(2024, 1, 1),
        maps_sys_id=1234,
    )

    db_for_aa_agreement.add(aa)
    db_for_aa_agreement.commit()

    response = auth_client.get(
        url_for("api.agreements-item", id=aa.id),
    )

    assert response.status_code == 200
    data = response.json
    assert data["id"] == aa.id
    assert data["name"] == "Test AA Agreement"
    assert data["agreement_type"] == AgreementType.AA.name
    assert data["requesting_agency"]["id"] == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
    )
    assert data["servicing_agency"]["id"] == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
    )
    assert data["service_requirement_type"] == ServiceRequirementType.NON_SEVERABLE.name
    assert data["contract_number"] == "AA-123456"
    assert data["vendor_id"] == db_for_aa_agreement.scalar(select(Vendor.id).where(Vendor.name == "Test Vendor"))
    assert data["task_order_number"] == "TO-7890"
    assert data["po_number"] == "PO-1234"
    assert data["acquisition_type"] == AcquisitionType.GSA_SCHEDULE.name
    assert data["delivered_status"] is True
    assert data["contract_type"] == ContractType.FIRM_FIXED_PRICE.name
    assert [sc["id"] for sc in data["support_contacts"]] == [501]
    assert data["contract_category"] == ContractCategory.SERVICE.name
    assert data["psc_contract_specialist"] == "Test Specialist"
    assert data["cotr_id"] == 502
    assert data["nick_name"] == "Test Nickname"
    assert data["description"] == "This is a test AA agreement with maximum fields."
    assert data["product_service_code_id"] == 1
    assert data["agreement_reason"] == AgreementReason.NEW_REQ.name
    assert data["project_officer_id"] == 500
    assert data["alternate_project_officer_id"] == 501
    assert [tm["id"] for tm in data["team_members"]] == [500, 501]
    assert data["project_id"] == db_for_aa_agreement.scalar(
        select(ResearchProject.id).where(ResearchProject.title == "Test Project for AA Agreement")
    )
    assert data["awarding_entity_id"] == db_for_aa_agreement.scalar(
        select(ProcurementShop.id).where(ProcurementShop.name == "Test Awarding Entity")
    )
    assert data["notes"] == "This is a test AA agreement with maximum fields."
    assert data["start_date"] == "2023-01-01"
    assert data["end_date"] == "2024-01-01"
    assert data["maps_sys_id"] == 1234

    # Cleanup
    db_for_aa_agreement.delete(aa)
    db_for_aa_agreement.commit()


@pytest.mark.usefixtures("app_ctx")
def test_agreements_get_aa_agreement_list_max(auth_client, db_for_aa_agreement):
    # create an AaAgreement with max params and get it
    aa = AaAgreement(
        name="Test AA Agreement",
        agreement_type=AgreementType.AA,
        requesting_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
        ),
        servicing_agency_id=db_for_aa_agreement.scalar(
            select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
        ),
        service_requirement_type=ServiceRequirementType.NON_SEVERABLE,
        contract_number="AA-123456",
        vendor_id=db_for_aa_agreement.scalar(select(Vendor.id).where(Vendor.name == "Test Vendor")),
        task_order_number="TO-7890",
        po_number="PO-1234",
        acquisition_type=AcquisitionType.GSA_SCHEDULE,
        delivered_status=True,
        contract_type=ContractType.FIRM_FIXED_PRICE,
        support_contacts=[db_for_aa_agreement.get(User, 501)],
        contract_category=ContractCategory.SERVICE,
        psc_contract_specialist="Test Specialist",
        cotr_id=502,
        nick_name="Test Nickname",
        description="This is a test AA agreement with maximum fields.",
        product_service_code_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=500,
        alternate_project_officer_id=501,
        team_members=[db_for_aa_agreement.get(User, 500), db_for_aa_agreement.get(User, 501)],
        project_id=db_for_aa_agreement.scalar(
            select(ResearchProject.id).where(ResearchProject.title == "Test Project for AA Agreement")
        ),
        awarding_entity_id=db_for_aa_agreement.scalar(
            select(ProcurementShop.id).where(ProcurementShop.name == "Test Awarding Entity")
        ),
        notes="This is a test AA agreement with maximum fields.",
        start_date=datetime.date(2023, 1, 1),
        end_date=datetime.date(2024, 1, 1),
        maps_sys_id=1234,
    )

    db_for_aa_agreement.add(aa)
    db_for_aa_agreement.commit()

    response = auth_client.get(url_for("api.agreements-group"), query_string={"agreement_type": AgreementType.AA.name})

    assert response.status_code == 200
    data = response.json
    assert len(data) > 0
    assert any(agreement["id"] == aa.id for agreement in data)
    aa_data = next((agreement for agreement in data if agreement["id"] == aa.id), None)
    assert aa_data is not None
    assert aa_data["name"] == "Test AA Agreement"
    assert aa_data["agreement_type"] == AgreementType.AA.name
    assert aa_data["requesting_agency"]["id"] == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Requesting Agency")
    )
    assert aa_data["servicing_agency"]["id"] == db_for_aa_agreement.scalar(
        select(AgreementAgency.id).where(AgreementAgency.name == "Test Servicing Agency")
    )
    assert aa_data["service_requirement_type"] == ServiceRequirementType.NON_SEVERABLE.name
    assert aa_data["contract_number"] == "AA-123456"
    assert aa_data["vendor_id"] == db_for_aa_agreement.scalar(select(Vendor.id).where(Vendor.name == "Test Vendor"))
    assert aa_data["task_order_number"] == "TO-7890"
    assert aa_data["po_number"] == "PO-1234"
    assert aa_data["acquisition_type"] == AcquisitionType.GSA_SCHEDULE.name
    assert aa_data["delivered_status"] is True
    assert aa_data["contract_type"] == ContractType.FIRM_FIXED_PRICE.name
    assert [sc["id"] for sc in aa_data["support_contacts"]] == [501]
    assert aa_data["contract_category"] == ContractCategory.SERVICE.name
    assert aa_data["psc_contract_specialist"] == "Test Specialist"
    assert aa_data["cotr_id"] == 502
    assert aa_data["nick_name"] == "Test Nickname"
    assert aa_data["description"] == "This is a test AA agreement with maximum fields."
    assert aa_data["product_service_code_id"] == 1
    assert aa_data["agreement_reason"] == AgreementReason.NEW_REQ.name
    assert aa_data["project_officer_id"] == 500
    assert aa_data["alternate_project_officer_id"] == 501
    assert [tm["id"] for tm in aa_data["team_members"]] == [500, 501]
    assert aa_data["project_id"] == db_for_aa_agreement.scalar(
        select(ResearchProject.id).where(ResearchProject.title == "Test Project for AA Agreement")
    )
    assert aa_data["awarding_entity_id"] == db_for_aa_agreement.scalar(
        select(ProcurementShop.id).where(ProcurementShop.name == "Test Awarding Entity")
    )
    assert aa_data["notes"] == "This is a test AA agreement with maximum fields."
    assert aa_data["start_date"] == "2023-01-01"
    assert aa_data["end_date"] == "2024-01-01"
    assert aa_data["maps_sys_id"] == 1234

    # Cleanup
    db_for_aa_agreement.delete(aa)
    db_for_aa_agreement.commit()
