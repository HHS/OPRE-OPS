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
    AwardType,
    BudgetLineItemStatus,
    ChangeRequestType,
    ContractAgreement,
    ContractCategory,
    ContractType,
    DirectAgreement,
    GrantAgreement,
    IaaAgreement,
    IAADirectionType,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    Portfolio,
    ProcurementAction,
    ProcurementActionStatus,
    ProcurementShop,
    ProcurementShopFee,
    ResearchProject,
    ServiceRequirementType,
    User,
    Vendor,
)
from models.budget_line_items import BudgetLineItem, ContractBudgetLineItem


def test_agreement_retrieve(loaded_db, app_ctx):
    agreement = loaded_db.get(Agreement, 1)

    assert agreement is not None
    assert agreement.contract_number == "XXXX000000001"
    assert agreement.name == "Contract #1: African American Child and Family Research Center"
    assert agreement.display_name == agreement.name
    assert agreement.id == 1
    assert agreement.agreement_type.name == "CONTRACT"


def test_agreements_get_all(auth_client, loaded_db, test_project, app_ctx):
    stmt = select(func.count()).select_from(Agreement)
    count = loaded_db.scalar(stmt)

    response = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 50})
    assert response.status_code == 200
    assert len(response.json["data"]) == count
    assert response.json["count"] == count
    assert response.json["limit"] == 50
    assert response.json["offset"] == 0

    # test an agreement
    contract = next((item for item in response.json["data"] if "CONTRACT #2" in item["name"]))
    assert contract["agreement_type"] == "CONTRACT"
    assert contract["project"]["id"] == 1002
    assert contract["procurement_shop"]["fee_percentage"] == 4.8
    assert contract["vendor"] == "Vendor 1"
    assert "budget_line_items" in contract


def test_agreements_get_all_by_fiscal_year(auth_client, loaded_db, app_ctx):
    # determine how many agreements in the DB are in fiscal year 2043
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.fiscal_year == 2043)
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) > 0

    response = auth_client.get(url_for("api.agreements-group"), query_string={"fiscal_year": 2043})
    assert response.status_code == 200
    assert len(response.json["data"]) == len(agreements)

    # determine how many agreements in the DB are in fiscal year 2000
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.fiscal_year == 2000)
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) == 0
    response = auth_client.get(url_for("api.agreements-group"), query_string={"fiscal_year": 2000})
    assert response.status_code == 200
    assert len(response.json["data"]) == 0

    # determine how many agreements in the DB are in fiscal year 2043 or 2044
    agreement_ids = set()
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.fiscal_year == 2043)
    agreement_ids.update([a.id for a in loaded_db.scalars(stmt).all()])
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.fiscal_year == 2044)
    agreement_ids.update([a.id for a in loaded_db.scalars(stmt).all()])
    # agreement_ids now contains unique agreement IDs across both fiscal years
    assert len(agreement_ids) > 0

    response = auth_client.get(url_for("api.agreements-group") + "?fiscal_year=2043&fiscal_year=2044")
    assert response.status_code == 200
    assert response.json["count"] == len(agreement_ids)


def test_agreements_get_all_by_budget_line_status(auth_client, loaded_db, app_ctx):
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
        url_for("api.agreements-group"),
        query_string={"budget_line_status": BudgetLineItemStatus.DRAFT.name},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) == len(agreements)

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
        url_for("api.agreements-group"),
        query_string={"budget_line_status": BudgetLineItemStatus.OBLIGATED.name},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) == len(agreements)


def test_agreements_get_all_by_portfolio(auth_client, loaded_db, app_ctx):
    # determine how many agreements in the DB are in portfolio 1
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.portfolio_id == 1)
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) > 0

    response = auth_client.get(url_for("api.agreements-group"), query_string={"portfolio": 1})
    assert response.status_code == 200
    assert len(response.json["data"]) == len(agreements)

    # determine how many agreements in the DB are in portfolio 1000
    stmt = select(Agreement).distinct().join(BudgetLineItem).where(BudgetLineItem.portfolio_id == 1000)
    agreements = loaded_db.scalars(stmt).all()
    assert len(agreements) == 0
    response = auth_client.get(url_for("api.agreements-group"), query_string={"portfolio": 1000})
    assert response.status_code == 200
    assert len(response.json["data"]) == 0


def test_agreements_get_by_id(auth_client, app_ctx):
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


def test_agreements_get_by_id_404(auth_client, app_ctx):
    response = auth_client.get(url_for("api.agreements-item", id=1000))
    assert response.status_code == 404


def test_agreements_serialization(auth_client, loaded_db, test_project, test_can, app_ctx):
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
    assert response.json["is_awarded"] == agreement.is_awarded

    response = auth_client.get(url_for("api.agreements-item", id=2))
    assert response.status_code == 200
    research_methodologies = response.json.get("research_methodologies", [])
    assert len(research_methodologies) == 1
    assert research_methodologies[0]["id"] == 1
    assert research_methodologies[0]["name"] == "Knowledge Development"
    assert research_methodologies[0]["detailed_name"] == "Knowledge Development (Lit Review, Expert Consultations)"

    response = auth_client.get(url_for("api.agreements-item", id=10))
    assert response.status_code == 200
    special_topics = response.json.get("special_topics", [])
    assert len(special_topics) == 2
    assert special_topics[0]["id"] == 1
    assert special_topics[0]["name"] == "Special Topic 1"
    assert special_topics[1]["id"] == 2
    assert special_topics[1]["name"] == "Special Topic 2"

    # Agreement 1 has about 1000 budget lines, so construct a new agreement + BLI
    # to be sure we know exactly what to expect for authorized_user_ids
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
                    "id": 504,
                    "full_name": "Tia Brown",
                    "email": "Tia.Brown@example.com",
                }
            ],
            "notes": "test notes",
            "project_id": test_project.id,
            "awarding_entity_id": 2,
            "contract_type": "FIRM_FIXED_PRICE",
            "service_requirement_type": "SEVERABLE",
            "vendor": None,
            "research_methodologies": [
                {
                    "id": 1,
                    "name": "Knowledge Development",
                    "detailed_name": "Knowledge Development (Lit Review, Expert Consultations)",
                }
            ],
            "special_topics": [
                {"id": 1, "name": "Special Topic 1"},
                {"id": 2, "name": "Special Topic 2"},
            ],
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    data = {
        "line_description": "LI 1",
        "comments": "blah blah",
        "agreement_id": contract_id,
        "can_id": test_can.id,
        "amount": 100.12,
        "status": "DRAFT",
        "date_needed": "2043-01-01",
        "proc_shop_fee_percentage": 1.23,
        "services_component_id": 1,
    }
    response = auth_client.post("/api/v1/budget-line-items/", json=data)
    assert response.status_code == 201
    bli_id = response.json["id"]

    response_2 = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response_2.status_code == 200
    authorized_user_ids = response_2.json["authorized_user_ids"]
    authorized_user_ids.sort()
    # Created an Agreement with BLI where:
    # COR is 500
    # ACOR is 501
    # Team Member is 504
    # Team Leader for Portfolio is 505
    # Division Director is 522
    # Deputy Director is NONE
    # Budget Team Members add 68, 523
    assert authorized_user_ids == [
        68,
        500,
        501,
        503,
        504,
        505,
        511,
        512,
        513,
        514,
        515,
        516,
        517,
        518,
        519,
        520,
        522,
        523,
        528,
    ]

    delete_bli_response = auth_client.delete(url_for("api.budget-line-items-item", id=bli_id))
    assert delete_bli_response.status_code == 200
    delete_agreement_response = auth_client.delete(url_for("api.agreements-item", id=contract_id))
    assert delete_agreement_response.status_code == 200


def test_agreement_is_awarded_serialization_in_detail_endpoint(auth_client, loaded_db, app_ctx):
    """Test that is_awarded is properly serialized in GET /agreements/{id} endpoint."""
    # Test 1: Contract agreement with no procurement actions (should be False)
    contract_no_actions = ContractAgreement(
        name="Test Contract - No Actions",
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_no_actions)
    loaded_db.commit()

    response = auth_client.get(url_for("api.agreements-item", id=contract_no_actions.id))
    assert response.status_code == 200
    assert "is_awarded" in response.json
    assert response.json["is_awarded"] is False

    # Test 2: Contract agreement with awarded procurement action (should be True)
    contract_awarded = ContractAgreement(
        name="Test Contract - Awarded",
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_awarded)
    loaded_db.flush()

    procurement_action = ProcurementAction(
        agreement_id=contract_awarded.id,
        status=ProcurementActionStatus.AWARDED,
        award_type=AwardType.NEW_AWARD,
    )
    loaded_db.add(procurement_action)
    loaded_db.commit()

    response = auth_client.get(url_for("api.agreements-item", id=contract_awarded.id))
    assert response.status_code == 200
    assert "is_awarded" in response.json
    assert response.json["is_awarded"] is True

    # Test 3: Grant agreement with no procurement actions (should be False)
    grant = GrantAgreement(
        name="Test Grant",
        agreement_type=AgreementType.GRANT,
    )
    loaded_db.add(grant)
    loaded_db.commit()

    response = auth_client.get(url_for("api.agreements-item", id=grant.id))
    assert response.status_code == 200
    assert "is_awarded" in response.json
    assert response.json["is_awarded"] is False

    # Test 4: Grant agreement with awarded procurement action (should be True)
    grant_awarded = GrantAgreement(
        name="Test Grant - Awarded",
        agreement_type=AgreementType.GRANT,
    )
    loaded_db.add(grant_awarded)
    loaded_db.flush()

    procurement_action_grant = ProcurementAction(
        agreement_id=grant_awarded.id,
        status=ProcurementActionStatus.CERTIFIED,
        award_type=AwardType.NEW_AWARD,
    )
    loaded_db.add(procurement_action_grant)
    loaded_db.commit()

    response = auth_client.get(url_for("api.agreements-item", id=grant_awarded.id))
    assert response.status_code == 200
    assert "is_awarded" in response.json
    assert response.json["is_awarded"] is True

    # Test 5: IAA agreement (should be False)
    iaa = IaaAgreement(
        name="Test IAA",
        agreement_type=AgreementType.IAA,
        direction=IAADirectionType.INCOMING,
    )
    loaded_db.add(iaa)
    loaded_db.commit()

    response = auth_client.get(url_for("api.agreements-item", id=iaa.id))
    assert response.status_code == 200
    assert "is_awarded" in response.json
    assert response.json["is_awarded"] is False

    # Test 6: Direct agreement (should be False)
    direct = DirectAgreement(
        name="Test Direct",
        agreement_type=AgreementType.DIRECT_OBLIGATION,
    )
    loaded_db.add(direct)
    loaded_db.commit()

    response = auth_client.get(url_for("api.agreements-item", id=direct.id))
    assert response.status_code == 200
    assert "is_awarded" in response.json
    assert response.json["is_awarded"] is False

    # Cleanup
    loaded_db.delete(contract_no_actions)
    loaded_db.delete(contract_awarded)
    loaded_db.delete(grant)
    loaded_db.delete(grant_awarded)
    loaded_db.delete(iaa)
    loaded_db.delete(direct)
    loaded_db.commit()


def test_agreement_is_awarded_serialization_in_list_endpoint(auth_client, loaded_db, app_ctx):
    """Test that is_awarded is properly serialized in GET /agreements endpoint."""
    # Create test agreements
    contract_not_awarded = ContractAgreement(
        name="Test Contract - Not Awarded for List",
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_not_awarded)
    loaded_db.flush()

    contract_awarded = ContractAgreement(
        name="Test Contract - Awarded for List",
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_awarded)
    loaded_db.flush()

    procurement_action = ProcurementAction(
        agreement_id=contract_awarded.id,
        status=ProcurementActionStatus.CERTIFIED,
        award_type=AwardType.NEW_AWARD,
    )
    loaded_db.add(procurement_action)

    grant_not_awarded = GrantAgreement(
        name="Test Grant - Not Awarded for List",
        agreement_type=AgreementType.GRANT,
    )
    loaded_db.add(grant_not_awarded)
    loaded_db.flush()

    grant_awarded = GrantAgreement(
        name="Test Grant - Awarded for List",
        agreement_type=AgreementType.GRANT,
    )
    loaded_db.add(grant_awarded)
    loaded_db.flush()

    procurement_action_grant = ProcurementAction(
        agreement_id=grant_awarded.id,
        status=ProcurementActionStatus.AWARDED,
        award_type=AwardType.NEW_AWARD,
    )
    loaded_db.add(procurement_action_grant)
    loaded_db.commit()

    # Get all agreements
    response = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 50})
    assert response.status_code == 200
    assert "data" in response.json

    # Find our test agreements in the response
    test_agreements = {
        item["name"]: item
        for item in response.json["data"]
        if item["name"]
        in [
            "Test Contract - Not Awarded for List",
            "Test Contract - Awarded for List",
            "Test Grant - Not Awarded for List",
            "Test Grant - Awarded for List",
        ]
    }

    # Verify is_awarded field is present and correct for each agreement
    assert "is_awarded" in test_agreements["Test Contract - Not Awarded for List"]
    assert test_agreements["Test Contract - Not Awarded for List"]["is_awarded"] is False

    assert "is_awarded" in test_agreements["Test Contract - Awarded for List"]
    assert test_agreements["Test Contract - Awarded for List"]["is_awarded"] is True

    assert "is_awarded" in test_agreements["Test Grant - Not Awarded for List"]
    assert test_agreements["Test Grant - Not Awarded for List"]["is_awarded"] is False

    assert "is_awarded" in test_agreements["Test Grant - Awarded for List"]
    assert test_agreements["Test Grant - Awarded for List"]["is_awarded"] is True

    # Cleanup
    loaded_db.delete(contract_not_awarded)
    loaded_db.delete(contract_awarded)
    loaded_db.delete(grant_not_awarded)
    loaded_db.delete(grant_awarded)
    loaded_db.commit()


@pytest.mark.skip("Need to consult whether this should return ALL or NONE if the value is empty")
def test_agreements_with_project_empty(auth_client, app_ctx):
    response = auth_client.get(url_for("api.agreements-group"), query_string={"project_id": ""})
    assert response.status_code == 200
    assert len(response.json["data"]) == 6


def test_agreements_with_project_found(auth_client, test_project, app_ctx):
    response = auth_client.get(url_for("api.agreements-group"), query_string={"project_id": test_project.id})
    assert response.status_code == 200
    assert len(response.json["data"]) == 3
    assert response.json["data"][0]["id"] == 1
    assert response.json["data"][1]["id"] == 10
    assert response.json["data"][2]["id"] == 2


def test_get_agreements_by_nickname(auth_client, app_ctx):
    response = auth_client.get(url_for("api.agreements-group"), query_string={"nick_name": "AA1"})
    assert response.status_code == 200
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["nick_name"] == "AA1"

    response = auth_client.get(url_for("api.agreements-group"), query_string={"nick_name": "Contract #1"})
    assert response.status_code == 200
    assert len(response.json["data"]) == 0


@pytest.mark.parametrize(["simulated_error", "expected"], [["true", 500], ["400", 400], ["false", 200]])
def test_agreements_with_simulated_error(auth_client, simulated_error, expected, app_ctx):
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
def test_agreements_with_filter(auth_client, key, value, loaded_db, app_ctx):
    query_dict = {key: value}
    response = auth_client.get(url_for("api.agreements-group"), query_string=query_dict)
    assert response.status_code == 200
    assert all(item[key] == value for item in response.json["data"] if key in item)


def test_agreements_with_only_my_filter(division_director_auth_client, app_ctx):
    query_dict = {"only_my": True}
    response = division_director_auth_client.get(url_for("api.agreements-group"), query_string=query_dict)
    assert response.status_code == 200
    assert len(response.json["data"]) > 1, "Expected multiple agreements for division director"


def test_agreements_with_project_not_found(auth_client, loaded_db, app_ctx):
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"project_id": "1000000"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) == 0


def test_agreement_search(auth_client, loaded_db):
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"search": ""},
    )

    assert response.status_code == 200
    assert len(response.json["data"]) == 0

    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"search": "contract"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) == 5

    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"search": "Contract #"},
    )

    assert response.status_code == 200
    assert len(response.json["data"]) == 4


def test_agreement_name_filter_partial_match(auth_client, loaded_db):
    """Test that the name filter uses partial matching (ilike)."""
    # Test with empty string should return no results
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": ""},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) == 0

    # Test partial match with lowercase "contract" should match agreements with "Contract" in name
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": "contract", "exact_match": "false"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) == 5
    # Verify all results contain "contract" in their name (case-insensitive)
    for agreement in response.json["data"]:
        assert "contract" in agreement["name"].lower()

    # Test partial match with "Contract #" should match agreements starting with "Contract #"
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": "Contract #", "exact_match": "false"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) == 4
    # Verify all results contain "Contract #" in their name (case-insensitive)
    for agreement in response.json["data"]:
        assert "contract #" in agreement["name"].lower()


def test_agreement_type_filter(auth_client, loaded_db):
    """Test that the agreement_type filter works correctly."""
    # Test filtering by CONTRACT type
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"agreement_type": AgreementType.CONTRACT.name},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) > 0
    # Verify all results have CONTRACT agreement type
    for agreement in response.json["data"]:
        assert agreement["agreement_type"] == AgreementType.CONTRACT.name

    # Test filtering by GRANT type
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"agreement_type": AgreementType.GRANT.name},
    )
    assert response.status_code == 200
    # Verify all results have GRANT agreement type
    for agreement in response.json["data"]:
        assert agreement["agreement_type"] == AgreementType.GRANT.name


def test_agreement_name_filter_multiple_names_or_logic(auth_client, loaded_db):
    """Test that multiple name filters use OR logic, returning agreements matching ANY of the names."""
    # Test with two different name patterns
    # This should return agreements containing either "Contract #1" OR "Contract #2"
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": ["Contract #1", "Contract #2"], "exact_match": "false"},
    )
    assert response.status_code == 200
    # Should return at least 2 agreements (one for each pattern)
    assert len(response.json["data"]) >= 2

    # Verify that each result matches at least one of the name patterns
    for agreement in response.json["data"]:
        name_lower = agreement["name"].lower()
        assert "contract #1" in name_lower or "contract #2" in name_lower

    # Test with three different patterns to ensure OR logic scales
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={
            "name": ["Contract #1", "Grant", "Direct"],
            "exact_match": "false",
        },
    )
    assert response.status_code == 200
    # Should return multiple agreements matching any of the three patterns
    assert len(response.json["data"]) >= 3


def test_agreement_name_filter_exact_match(auth_client, loaded_db):
    """Test that the name filter uses exact matching when exact_match=true."""
    # Get the exact name of an agreement first
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": "Contract #1", "exact_match": "false"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) >= 1
    exact_name = response.json["data"][0]["name"]

    # Test partial match - should return multiple agreements with "Contract" in the name
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": "Contract", "exact_match": "false"},
    )
    assert response.status_code == 200
    partial_match_count = len(response.json["data"])
    assert partial_match_count >= 4  # Should match "Contract #1", "Contract #2", etc.

    # Now test exact match with the full agreement name
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": exact_name, "exact_match": "true"},
    )
    assert response.status_code == 200
    exact_match_count = len(response.json["data"])
    # With exact match, should only return agreements with exactly that name
    assert exact_match_count >= 1
    # Should return fewer or equal results than partial match
    assert exact_match_count <= partial_match_count
    # Verify all results have the exact name (case-insensitive)
    for agreement in response.json["data"]:
        assert agreement["name"].lower() == exact_name.lower()

    # Test exact match with just "Contract" - should return 0 results
    # since no agreement is named exactly "Contract"
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": "Contract", "exact_match": "true"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) == 0


def test_agreement_name_filter_exact_match_case_insensitive(auth_client, loaded_db):
    """Test that exact_match is case-insensitive."""
    # Get an agreement name
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": "Contract #1", "exact_match": "false"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) >= 1
    exact_name = response.json["data"][0]["name"]

    # Test with lowercase version
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": exact_name.lower(), "exact_match": "true"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) >= 1
    for agreement in response.json["data"]:
        assert agreement["name"].lower() == exact_name.lower()

    # Test with uppercase version
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": exact_name.upper(), "exact_match": "true"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) >= 1
    for agreement in response.json["data"]:
        assert agreement["name"].lower() == exact_name.lower()


def test_agreement_name_filter_exact_match_multiple_names(auth_client, loaded_db):
    """Test that exact_match works with multiple names using OR logic."""
    # Get exact names of two different agreements
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": "Contract #1", "exact_match": "false"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) >= 1
    name1 = response.json["data"][0]["name"]

    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": "Contract #2", "exact_match": "false"},
    )
    assert response.status_code == 200
    assert len(response.json["data"]) >= 1
    name2 = response.json["data"][0]["name"]

    # Test exact match with both names
    response = auth_client.get(
        url_for("api.agreements-group"),
        query_string={"name": [name1, name2], "exact_match": "true"},
    )
    assert response.status_code == 200
    results = response.json["data"]
    # Should return agreements matching exactly name1 OR name2
    assert len(results) >= 2
    for agreement in results:
        assert agreement["name"].lower() in [name1.lower(), name2.lower()]


def test_agreements_get_by_id_auth(client, loaded_db, app_ctx):
    response = client.get(url_for("api.agreements-item", id=1))
    assert response.status_code == 401


def test_agreements_auth(client, loaded_db, app_ctx):
    response = client.get(url_for("api.agreements-group"))
    assert response.status_code == 401


def test_agreement_as_contract_has_contract_fields(loaded_db, app_ctx):
    stmt = select(Agreement).where(Agreement.id == 1)
    agreement = loaded_db.scalar(stmt)

    assert agreement.agreement_type.name == "CONTRACT"
    assert agreement.contract_number == "XXXX000000001"


@pytest.fixture()
def contract_agreement_for_create_test(loaded_db, app_ctx):
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

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


def test_agreement_create_contract_agreement(loaded_db, contract_agreement_for_create_test, app_ctx):
    stmt = select(Agreement).where(Agreement.id == contract_agreement_for_create_test.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.contract_number == "XXXX000000002"
    assert agreement.contract_type == ContractType.FIRM_FIXED_PRICE
    assert agreement.service_requirement_type == ServiceRequirementType.SEVERABLE


def test_agreement_create_grant_agreement(loaded_db, app_ctx):
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
def test_contract(loaded_db, test_vendor, test_admin_user, test_project, app_ctx):
    contract_agreement = ContractAgreement(
        name="CTXX12399-fixture",
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
def test_psf(loaded_db, app_ctx):
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


def test_agreements_put_by_id_400_for_type_change(auth_client, test_contract, app_ctx):
    """400 is returned if the agreement_type is changed"""

    response = auth_client.put(
        f"/api/v1/agreements/{test_contract.id}",
        json={
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
        },
    )
    assert response.status_code == 400


def test_agreements_put_by_id_400_for_missing_required(auth_client, test_contract, app_ctx):
    """400 is returned required fields are missing"""
    response = auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
        },
    )
    assert response.status_code == 400


def test_create_agreements_400_with_bad_research_methodology(auth_client, app_ctx):
    """400 is returned when creating an agreement with invalid research methodology"""
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "CONTRACT",
            "name": "Test Contract with Bad Research Methodology",
            "description": "This is a test contract",
            "research_methodologies": [
                {
                    "id": 9999,
                    "name": "Knowledge Development",
                    "detailed_name": "Knowledge Development (Lit Review, Expert Consultations)",
                }
            ],
        },
    )
    assert response.status_code == 400

    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "CONTRACT",
            "name": "Test Contract with Bad Research Methodology",
            "description": "This is a test contract",
            "research_methodologies": [
                {
                    "id": 1,
                    "name": "Nonexistent Method",
                    "detailed_name": "Knowledge Development (Lit Review, Expert Consultations)",
                }
            ],
        },
    )
    assert response.status_code == 400

    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "CONTRACT",
            "name": "Test Contract with Bad Research Methodology",
            "description": "This is a test contract",
            "research_methodologies": [
                {
                    "id": 1,
                    "name": "Knowledge Development",
                    "detailed_name": "Knowledge Development (Incorrect, Parenthesis)",
                }
            ],
        },
    )
    assert response.status_code == 400


def test_update_agreements_400_with_bad_research_methodology(auth_client, test_contract):
    """400 is returned when updating an agreement with invalid research methodology"""
    response = auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
            "research_methodologies": [
                {
                    "id": 9999,
                    "name": "Knowledge Development (Lit Review, Expert Consultations)",
                }
            ],
        },
    )
    assert response.status_code == 400

    """400 is returned when updating an agreement with invalid research methodology"""
    response = auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
            "research_methodologies": [{"id": 1, "name": "Nonexistent Method"}],
        },
    )
    assert response.status_code == 400


def test_create_agreements_400_with_bad_special_topic(auth_client, app_ctx):
    """400 is returned when creating an agreement with invalid special topic"""
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "CONTRACT",
            "name": "Test Contract with Bad Special Topic",
            "description": "This is a test contract",
            "special_topics": [
                {
                    "id": 9999,
                    "name": "Special Topic 1",
                }
            ],
        },
    )
    assert response.status_code == 400

    """400 is returned when creating an agreement with invalid special topic"""
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "CONTRACT",
            "name": "Test Contract with Bad Special Topic",
            "description": "This is a test contract",
            "special_topics": [{"id": 1, "name": "Nonexistent Method"}],
        },
    )
    assert response.status_code == 400


def test_update_agreements_400_with_bad_special_topic(auth_client, test_contract):
    """400 is returned when updating an agreement with invalid special topic"""
    response = auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
            "special_topics": [
                {
                    "id": 9999,
                    "name": "Special Topic 1",
                }
            ],
        },
    )
    assert response.status_code == 400

    """400 is returned when updating an agreement with invalid special topic"""
    response = auth_client.put(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "agreement_type": "CONTRACT",
            "name": "Updated Contract Name",
            "description": "Updated Contract Description",
            "special_topics": [{"id": 1, "name": "Nonexistent Method"}],
        },
    )
    assert response.status_code == 400


def test_agreements_put_by_id_contract(auth_client, loaded_db, test_contract, app_ctx):
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


def test_agreements_put_by_id_contract_remove_fields(auth_client, loaded_db, test_contract, app_ctx):
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


def test_agreements_put_by_id_grant(auth_client, loaded_db, app_ctx):
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


def test_agreements_patch_by_id_400_for_type_change(auth_client, loaded_db, test_contract, app_ctx):
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


def test_agreements_patch_by_id_contract(auth_client, loaded_db, test_contract, app_ctx):
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
            "research_methodologies": [
                {
                    "id": 1,
                    "name": "Knowledge Development",
                    "detailed_name": "Knowledge Development (Lit Review, Expert Consultations)",
                }
            ],
            "special_topics": [
                {"id": 1, "name": "Special Topic 1"},
                {"id": 2, "name": "Special Topic 2"},
            ],
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
    assert len(agreement.research_methodologies) == 1
    assert agreement.research_methodologies[0].id == 1
    assert len(agreement.special_topics) == 2


def test_agreements_patch_by_id_contract_with_nones(auth_client, loaded_db, test_contract, app_ctx):
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


def test_agreements_patch_by_id_grant(auth_client, loaded_db, app_ctx):
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


def test_agreements_patch_by_id_just_notes(auth_client, loaded_db, test_contract, app_ctx):
    """PATCH with just notes to test out other fields being optional"""
    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "notes": "Test PATCH",
        },
    )
    assert response.status_code == 200

    assert test_contract.notes == "Test PATCH"


def test_agreements_delete_contract_by_id(auth_client, loaded_db, test_contract, app_ctx):
    response = auth_client.delete(url_for("api.agreements-item", id=test_contract.id))
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == test_contract.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement is None


def test_agreements_delete_non_contract_by_id(auth_client, loaded_db, basic_user_auth_client, app_ctx):
    grant_agreement = GrantAgreement(
        name="test",
        foa="NIH",
        agreement_type=AgreementType.GRANT,
    )
    loaded_db.add(grant_agreement)
    loaded_db.commit()

    stmt = select(Agreement).where(Agreement.id == grant_agreement.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement.foa == "NIH"

    response = basic_user_auth_client.delete(url_for("api.agreements-item", id=grant_agreement.id))
    assert response.status_code == 403

    response = auth_client.delete(url_for("api.agreements-item", id=grant_agreement.id))
    assert response.status_code == 200

    stmt = select(Agreement).where(Agreement.id == grant_agreement.id)
    agreement = loaded_db.scalar(stmt)

    assert agreement is None


def test_get_iaa_agreement(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.agreements-item", id=4))
    assert response.status_code == 200
    assert response.json["agreement_type"] == "IAA"


def test_post_iaa_agreement(auth_client, loaded_db, app_ctx):

    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": AgreementType.IAA.name,
            "name": "Test IAA (for post)",
            "direction": "OUTGOING",
        },
    )

    assert response.status_code == 201
    iaa_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=iaa_id))
    assert response.status_code == 200


def test_agreements_post(auth_client, loaded_db, app_ctx):
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


def test_agreements_post_contract_with_service_requirement_type(auth_client, loaded_db, test_project, app_ctx):
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
            "research_methodologies": [
                {
                    "id": 1,
                    "name": "Knowledge Development",
                    "detailed_name": "Knowledge Development (Lit Review, Expert Consultations)",
                }
            ],
            "special_topics": [
                {"id": 1, "name": "Special Topic 1"},
                {"id": 2, "name": "Special Topic 2"},
            ],
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response.status_code == 200


def test_agreements_post_contract_with_vendor(
    auth_client, loaded_db, test_user, test_admin_user, test_project, app_ctx
):
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
            "research_methodologies": [
                {
                    "id": 1,
                    "name": "Knowledge Development",
                    "detailed_name": "Knowledge Development (Lit Review, Expert Consultations)",
                }
            ],
            "special_topics": [
                {"id": 1, "name": "Special Topic 1"},
                {"id": 2, "name": "Special Topic 2"},
            ],
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]

    response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert response.status_code == 200


def test_agreements_post_duplicate_name_case_insensitive(auth_client, loaded_db, test_contract, app_ctx):
    """Test that POSTing an agreement with a duplicate name (case-insensitive) returns 400"""
    # test_contract has name "CTXX12399-fixture" and agreement_type CONTRACT
    # Attempt to POST with same name but different case
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": AgreementType.CONTRACT.name,
            "name": "ctxx12399-fixture",  # Same as test_contract.name but lowercase
        },
    )
    assert response.status_code == 400


def test_agreements_patch_by_id_e2e(auth_client, loaded_db, test_contract, test_project, app_ctx):
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


def test_update_agreement_procurement_shop_without_blis(
    auth_client, loaded_db, test_contract, test_project, test_admin_user, test_vendor, app_ctx
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
    assert agreement.name == "CTXX12399-fixture"
    assert agreement.contract_number == "XXXX000000002"
    assert agreement.contract_type == ContractType.FIRM_FIXED_PRICE
    assert agreement.service_requirement_type == ServiceRequirementType.NON_SEVERABLE
    assert agreement.product_service_code_id == 2
    assert agreement.agreement_type == AgreementType.CONTRACT
    assert agreement.project_id == test_project.id
    assert agreement.vendor_id == test_vendor.id
    assert agreement.project_officer_id == test_admin_user.id


def test_update_agreement_procurement_shop_error_with_bli_in_execution(
    auth_client, loaded_db, test_contract, test_can, app_ctx
):
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


def test_update_agreement_procurement_shop_with_draft_bli(auth_client, loaded_db, test_contract, test_can, app_ctx):
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


def test_update_agreement_procurement_shop_with_planned_bli(auth_client, loaded_db, test_contract, test_can, app_ctx):
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


def test_agreements_get_contract_by_id(auth_client, loaded_db, test_contract, app_ctx):
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


def test_agreements_patch_contract_by_id(auth_client, loaded_db, test_contract, app_ctx):
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


def test_agreements_patch_contract_update_existing_vendor(auth_client, loaded_db, test_contract, app_ctx):
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


def test_agreements_patch_contract_update_new_vendor(auth_client, loaded_db, test_contract, app_ctx):
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


def test_agreements_includes_meta(auth_client, basic_user_auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.agreements-group"))
    assert response.status_code == 200

    # test an agreement
    data = response.json["data"]
    for item in data:
        assert "_meta" in item

    # most/all of the agreements should be editable
    assert any(item["_meta"]["isEditable"] for item in data)

    response = basic_user_auth_client.get(url_for("api.agreements-group"))
    assert response.status_code == 200

    # test an agreement
    data = response.json["data"]
    for item in data:
        assert "_meta" in item

    # most/all of the agreements should not be editable
    assert any(not item["_meta"]["isEditable"] for item in data)


def test_agreement_updates_by_team_leaders(
    division_director_auth_client,
    auth_client,
    test_contract,
    loaded_db,
    test_project,
    test_admin_user,
    test_vendor,
    app_ctx,
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


def test_get_agreement_returns_portfolio_team_leaders(auth_client, loaded_db, app_ctx):
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
    assert response.json["team_leaders"] == [
        "Ivelisse Martinez-Beck",
        "Sheila Celentano",
    ]
    for bli in response.json["budget_line_items"]:
        assert bli["id"] in bli_ids
        assert "portfolio_team_leaders" in bli
        assert len(bli["portfolio_team_leaders"]) > 0
        for tl in bli["portfolio_team_leaders"]:
            assert tl["email"] is not None
            assert tl["full_name"] is not None
            assert tl["id"] in portfolio_team_leaders_ids


def test_agreement_get_events_are_persisted(auth_client, loaded_db, app_ctx):
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


def test_get_agreement_returns_empty_portfolio_team_leaders(auth_client, loaded_db, test_contract, app_ctx):
    """Test that an agreement with no budget lines returns empty portfolio team leaders"""

    response = auth_client.get(
        url_for("api.agreements-item", id=test_contract.id),
    )
    assert response.status_code == 200
    assert response is not None
    assert response.json["budget_line_items"] == []
    assert response.json["team_leaders"] == []
    assert response.json["division_directors"] == []


def test_agreements_post_aa_agreement_min(auth_client, db_for_aa_agreement, app_ctx):
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


def test_agreements_post_aa_agreement_max(auth_client, db_for_aa_agreement, app_ctx):
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


def test_agreements_put_aa_agreement_min(auth_client, db_for_aa_agreement, app_ctx):
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


def test_agreements_put_aa_agreement_max(auth_client, db_for_aa_agreement, app_ctx):
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


def test_agreements_get_aa_agreement_max(auth_client, db_for_aa_agreement, app_ctx):
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
        team_members=[
            db_for_aa_agreement.get(User, 500),
            db_for_aa_agreement.get(User, 501),
        ],
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


def test_agreements_get_aa_agreement_list_max(auth_client, db_for_aa_agreement, app_ctx):
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
        team_members=[
            db_for_aa_agreement.get(User, 500),
            db_for_aa_agreement.get(User, 501),
        ],
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
        url_for("api.agreements-group"),
        query_string={"agreement_type": AgreementType.AA.name},
    )

    assert response.status_code == 200
    data = response.json["data"]
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


def test_agreements_patch_procurement_shop(auth_client, loaded_db, test_contract, app_ctx):
    """PATCH to change the procurement shop of a contract agreement."""
    # First clear the awarding_entity_id to test adding one
    test_contract.awarding_entity_id = None
    loaded_db.commit()

    response = auth_client.patch(
        url_for("api.agreements-item", id=test_contract.id),
        json={
            "awarding_entity_id": 2,
        },
    )
    assert response.status_code == 200

    agreement = loaded_db.get(ContractAgreement, test_contract.id)

    assert agreement is not None
    assert agreement.awarding_entity_id == 2


class TestAgreementsPaginationAPI:
    """Integration tests for pagination functionality in the agreements API endpoint"""

    def test_get_agreements_default_pagination(self, auth_client, loaded_db, app_ctx):
        """GET /agreements/ returns first 10 with default pagination"""
        response = auth_client.get(url_for("api.agreements-group"))

        assert response.status_code == 200
        assert "data" in response.json
        assert "count" in response.json
        assert "limit" in response.json
        assert "offset" in response.json

        # Default limit should be 10
        assert len(response.json["data"]) <= 10
        assert response.json["limit"] == 10
        assert response.json["offset"] == 0

    def test_get_agreements_with_limit_offset(self, auth_client, loaded_db, app_ctx):
        """GET /agreements/?limit=10&offset=0 works correctly"""
        response = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 10, "offset": 0})

        assert response.status_code == 200
        assert len(response.json["data"]) <= 10
        assert response.json["limit"] == 10
        assert response.json["offset"] == 0

    def test_get_agreements_second_page(self, auth_client, loaded_db, app_ctx):
        """GET /agreements/?limit=10&offset=10 returns next 10"""
        # Get first page
        response_page1 = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 5, "offset": 0})

        # Get second page
        response_page2 = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 5, "offset": 5})

        assert response_page1.status_code == 200
        assert response_page2.status_code == 200

        # Verify offset is correct
        assert response_page2.json["offset"] == 5
        assert response_page2.json["limit"] == 5

        # Verify counts are the same (total doesn't change)
        assert response_page1.json["count"] == response_page2.json["count"]

        # Verify different results (if enough data)
        if len(response_page1.json["data"]) > 0 and len(response_page2.json["data"]) > 0:
            page1_ids = {agr["id"] for agr in response_page1.json["data"]}
            page2_ids = {agr["id"] for agr in response_page2.json["data"]}
            assert page1_ids != page2_ids

    def test_get_agreements_custom_page_size(self, auth_client, loaded_db, app_ctx):
        """GET /agreements/?limit=25&offset=0 returns up to 25"""
        response = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 25, "offset": 0})

        assert response.status_code == 200
        assert len(response.json["data"]) <= 25
        assert response.json["limit"] == 25

    def test_response_has_wrapped_format(self, auth_client, loaded_db, app_ctx):
        """Response contains data, count, limit, offset"""
        response = auth_client.get(url_for("api.agreements-group"))

        assert response.status_code == 200
        assert "data" in response.json
        assert "count" in response.json
        assert "limit" in response.json
        assert "offset" in response.json

    def test_response_agreements_is_list(self, auth_client, loaded_db, app_ctx):
        """data field is a list"""
        response = auth_client.get(url_for("api.agreements-group"))

        assert response.status_code == 200
        assert isinstance(response.json["data"], list)

    def test_response_metadata_types(self, auth_client, loaded_db, app_ctx):
        """count, limit, offset are integers"""
        response = auth_client.get(url_for("api.agreements-group"))

        assert response.status_code == 200
        assert isinstance(response.json["count"], int)
        assert isinstance(response.json["limit"], int)
        assert isinstance(response.json["offset"], int)

    def test_response_agreement_structure(self, auth_client, loaded_db, app_ctx):
        """Each agreement has expected fields"""
        response = auth_client.get(url_for("api.agreements-group"))

        assert response.status_code == 200
        assert len(response.json["data"]) > 0

        # Check first agreement has expected structure
        agreement = response.json["data"][0]
        assert "id" in agreement
        assert "name" in agreement
        assert "agreement_type" in agreement
        assert "_meta" in agreement

    def test_invalid_limit_zero(self, auth_client, loaded_db, app_ctx):
        """GET /agreements/?limit=0 returns 400"""
        response = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 0})

        assert response.status_code == 400

    def test_invalid_limit_too_high(self, auth_client, loaded_db, app_ctx):
        """GET /agreements/?limit=100 returns 400"""
        response = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 100})

        assert response.status_code == 400

    def test_invalid_offset_negative(self, auth_client, loaded_db, app_ctx):
        """GET /agreements/?offset=-1 returns 400"""
        response = auth_client.get(url_for("api.agreements-group"), query_string={"offset": -1})

        assert response.status_code == 400

    def test_pagination_with_fiscal_year_filter(self, auth_client, loaded_db, app_ctx):
        """Filtered results paginate correctly"""
        response = auth_client.get(
            url_for("api.agreements-group"),
            query_string={"fiscal_year": 2043, "limit": 5, "offset": 0},
        )

        assert response.status_code == 200
        assert response.json["limit"] == 5
        assert response.json["offset"] == 0
        # Count should reflect filtered total
        assert response.json["count"] <= response.json["count"]

    def test_pagination_with_portfolio_filter(self, auth_client, loaded_db, app_ctx):
        """Count reflects filtered total"""
        # Get unfiltered count
        response_all = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 50})

        # Get filtered count
        response_filtered = auth_client.get(url_for("api.agreements-group"), query_string={"portfolio": 1, "limit": 50})

        assert response_all.status_code == 200
        assert response_filtered.status_code == 200

        # Filtered count should be <= total count
        assert response_filtered.json["count"] <= response_all.json["count"]

    def test_pagination_with_status_filter(self, auth_client, loaded_db, app_ctx):
        """Multiple filters + pagination"""
        response = auth_client.get(
            url_for("api.agreements-group"),
            query_string={
                "fiscal_year": 2043,
                "budget_line_status": BudgetLineItemStatus.PLANNED.name,
                "limit": 5,
                "offset": 0,
            },
        )

        assert response.status_code == 200
        assert response.json["limit"] == 5
        assert response.json["offset"] == 0

    def test_pagination_with_only_my(self, auth_client, loaded_db, app_ctx):
        """Ownership filter + pagination"""
        response = auth_client.get(
            url_for("api.agreements-group"),
            query_string={"only_my": True, "limit": 10, "offset": 0},
        )

        assert response.status_code == 200
        assert response.json["limit"] == 10
        assert response.json["offset"] == 0

    def test_pagination_with_sort_by_name(self, auth_client, loaded_db, app_ctx):
        """Results sorted before pagination"""
        response = auth_client.get(
            url_for("api.agreements-group"),
            query_string={"sort_conditions": "AGREEMENT", "limit": 10, "offset": 0},
        )

        assert response.status_code == 200
        assert len(response.json["data"]) > 0

        # Verify results are in sorted order (by name)
        names = [agr.get("name") for agr in response.json["data"] if agr.get("name")]
        if len(names) > 1:
            assert names == sorted(names)

    def test_pagination_with_sort_descending(self, auth_client, loaded_db, app_ctx):
        """Descending sort + pagination"""
        response = auth_client.get(
            url_for("api.agreements-group"),
            query_string={
                "sort_conditions": "AGREEMENT",
                "sort_descending": True,
                "limit": 10,
                "offset": 0,
            },
        )

        assert response.status_code == 200
        assert len(response.json["data"]) > 0

        # Verify results are in descending order
        names = [agr.get("name") for agr in response.json["data"] if agr.get("name")]
        if len(names) > 1:
            assert names == sorted(names, reverse=True)

    def test_pagination_maintains_sort_across_pages(self, auth_client, loaded_db, app_ctx):
        """Consistent sort order across pages"""
        # Get first page
        response_page1 = auth_client.get(
            url_for("api.agreements-group"),
            query_string={"sort_conditions": "AGREEMENT", "limit": 3, "offset": 0},
        )

        # Get second page
        response_page2 = auth_client.get(
            url_for("api.agreements-group"),
            query_string={"sort_conditions": "AGREEMENT", "limit": 3, "offset": 3},
        )

        assert response_page1.status_code == 200
        assert response_page2.status_code == 200

        # Verify sort order is maintained
        if len(response_page1.json["data"]) > 0 and len(response_page2.json["data"]) > 0:
            last_name_page1 = response_page1.json["data"][-1].get("name")
            first_name_page2 = response_page2.json["data"][0].get("name")

            if last_name_page1 and first_name_page2:
                assert last_name_page1 <= first_name_page2

    def test_pagination_empty_results(self, auth_client, loaded_db, app_ctx):
        """Pagination with filters that return no results"""
        response = auth_client.get(
            url_for("api.agreements-group"),
            query_string={"fiscal_year": 1900, "limit": 10, "offset": 0},
        )

        assert response.status_code == 200
        assert len(response.json["data"]) == 0
        assert response.json["count"] == 0
        assert response.json["limit"] == 10
        assert response.json["offset"] == 0

    def test_pagination_offset_beyond_results(self, auth_client, loaded_db, app_ctx):
        """Offset beyond total results returns empty list"""
        response = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 10, "offset": 10000})

        assert response.status_code == 200
        assert len(response.json["data"]) == 0
        assert response.json["offset"] == 10000

    def test_pagination_boundary_last_page(self, auth_client, loaded_db, app_ctx):
        """Last page with partial results"""
        # Get total count
        response_all = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 50})
        total_count = response_all.json["count"]

        if total_count > 5:
            # Request last partial page
            offset = total_count - 3
            response = auth_client.get(
                url_for("api.agreements-group"),
                query_string={"limit": 10, "offset": offset},
            )

            assert response.status_code == 200
            assert len(response.json["data"]) == 3
            assert response.json["count"] == total_count

    def test_pagination_max_limit_allowed(self, auth_client, loaded_db, app_ctx):
        """Maximum limit of 50 is allowed"""
        response = auth_client.get(url_for("api.agreements-group"), query_string={"limit": 50, "offset": 0})

        assert response.status_code == 200
        assert response.json["limit"] == 50


# ==================== AWARDED AGREEMENT PATCH TESTS ====================


@pytest.fixture
def awarded_contract_agreement(loaded_db, test_project, app_ctx):
    """Create a ContractAgreement with awarded status."""
    agreement = ContractAgreement(
        name="Awarded Contract Test Agreement",
        agreement_type=AgreementType.CONTRACT,
        description="Test awarded contract",
        project_id=test_project.id,
        contract_type=ContractType.FIRM_FIXED_PRICE,
        service_requirement_type=ServiceRequirementType.SEVERABLE,
        product_service_code_id=1,
        awarding_entity_id=1,
        agreement_reason=AgreementReason.NEW_REQ,
        project_officer_id=500,  # test_user
    )
    loaded_db.add(agreement)
    loaded_db.commit()

    # Add procurement action to make it awarded
    proc_action = ProcurementAction(
        agreement_id=agreement.id,
        status=ProcurementActionStatus.AWARDED,
        award_type=AwardType.NEW_AWARD,
    )
    loaded_db.add(proc_action)
    loaded_db.commit()

    yield agreement

    # Cleanup
    loaded_db.query(ProcurementAction).filter(ProcurementAction.agreement_id == agreement.id).delete()
    loaded_db.delete(agreement)
    loaded_db.commit()


class TestAwardedAgreementPatch:
    """Integration tests for PATCH /agreements on awarded agreements."""

    # ==================== Category 1: Regular User - Immutable Field Updates (Should Fail) ====================

    def test_patch_awarded_contract_regular_user_update_name_fails(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a regular user cannot update the 'name' field on an awarded contract."""
        original_name = awarded_contract_agreement.name

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "name": "New Name Should Fail",
            },
        )

        assert response.status_code == 400
        assert "name" in response.json["errors"]
        assert "immutable" in response.json["errors"]["name"].lower()
        assert "awarded agreement" in response.json["errors"]["name"].lower()

        # Verify name was not changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.name == original_name

    def test_patch_awarded_contract_regular_user_update_contract_type_fails(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a regular user cannot update 'contract_type' on an awarded contract."""
        original_type = awarded_contract_agreement.contract_type

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "contract_type": "TIME_AND_MATERIALS",
            },
        )

        assert response.status_code == 400
        assert "contract_type" in response.json["errors"]
        assert "immutable" in response.json["errors"]["contract_type"].lower()

        # Verify contract_type was not changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.contract_type == original_type

    def test_patch_awarded_contract_regular_user_update_multiple_immutable_fields_fails(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that updating multiple immutable fields returns errors for all of them."""
        original_name = awarded_contract_agreement.name
        original_reason = awarded_contract_agreement.agreement_reason

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "name": "New Name",
                "agreement_reason": "RECOMPETE",
            },
        )

        assert response.status_code == 400
        assert "name" in response.json["errors"]
        assert "agreement_reason" in response.json["errors"]

        # Verify fields were not changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.name == original_name
        assert awarded_contract_agreement.agreement_reason == original_reason

    def test_patch_awarded_contract_regular_user_update_service_requirement_type_fails(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that regular user cannot update 'service_requirement_type' on awarded contract."""
        original_type = awarded_contract_agreement.service_requirement_type

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "service_requirement_type": "NON_SEVERABLE",
            },
        )

        assert response.status_code == 400
        assert "service_requirement_type" in response.json["errors"]

        # Verify field was not changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.service_requirement_type == original_type

    def test_patch_awarded_contract_regular_user_update_psc_id_fails(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that regular user cannot update 'product_service_code_id' on awarded contract."""
        original_psc_id = awarded_contract_agreement.product_service_code_id

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "product_service_code_id": 2,  # Different PSC
            },
        )

        assert response.status_code == 400
        assert "product_service_code_id" in response.json["errors"]

        # Verify field was not changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.product_service_code_id == original_psc_id

    def test_patch_awarded_contract_regular_user_update_awarding_entity_id_fails(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that regular user cannot update 'awarding_entity_id' (procurement shop) on awarded contract."""
        original_entity_id = awarded_contract_agreement.awarding_entity_id

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "awarding_entity_id": 2,  # Different procurement shop
            },
        )

        assert response.status_code == 400
        assert "awarding_entity_id" in response.json["errors"]

        # Verify field was not changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.awarding_entity_id == original_entity_id

    def test_patch_awarded_contract_regular_user_update_agreement_reason_fails(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that regular user cannot update 'agreement_reason' on awarded contract."""
        original_reason = awarded_contract_agreement.agreement_reason

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "agreement_reason": "LOGICAL_FOLLOW_ON",
            },
        )

        assert response.status_code == 400
        assert "agreement_reason" in response.json["errors"]

        # Verify field was not changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.agreement_reason == original_reason

    # ==================== Category 2: Regular User - Mutable Field Updates (Should Succeed) ====================

    def test_patch_awarded_contract_regular_user_update_description_succeeds(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a regular user can update 'description' on an awarded contract."""
        new_description = "Updated description for awarded contract"

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "description": new_description,
            },
        )

        assert response.status_code == 200

        # Verify description was changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.description == new_description

    def test_patch_awarded_contract_regular_user_update_notes_succeeds(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a regular user can update 'notes' on an awarded contract."""
        new_notes = "Important notes about this awarded contract"

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "notes": new_notes,
            },
        )

        assert response.status_code == 200

        # Verify notes were changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.notes == new_notes

    def test_patch_awarded_contract_regular_user_update_project_officer_succeeds(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a regular user can update 'project_officer_id' on an awarded contract."""
        new_po_id = 501  # Different user

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "project_officer_id": new_po_id,
            },
        )

        assert response.status_code == 200

        # Verify project officer was changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.project_officer_id == new_po_id

    def test_patch_awarded_contract_regular_user_update_team_members_succeeds(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a regular user can update 'team_members' on an awarded contract."""
        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "team_members": [{"id": 502}, {"id": 503}],
            },
        )

        assert response.status_code == 200

        # Verify team members were changed
        loaded_db.refresh(awarded_contract_agreement)
        team_member_ids = [tm.id for tm in awarded_contract_agreement.team_members]
        assert set(team_member_ids) == {502, 503}

    def test_patch_awarded_contract_regular_user_update_multiple_mutable_fields_succeeds(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a regular user can update multiple mutable fields on an awarded contract."""
        new_description = "Updated description"
        new_notes = "Updated notes"

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "description": new_description,
                "notes": new_notes,
                "team_members": [{"id": 500}],
            },
        )

        assert response.status_code == 200

        # Verify all fields were changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.description == new_description
        assert awarded_contract_agreement.notes == new_notes
        assert len(awarded_contract_agreement.team_members) == 1

    def test_patch_awarded_contract_regular_user_mix_mutable_immutable_fails(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that updating both mutable and immutable fields fails with errors for immutable ones."""
        original_name = awarded_contract_agreement.name
        original_description = awarded_contract_agreement.description

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "name": "New Name",  # Immutable
                "description": "New Description",  # Mutable
            },
        )

        assert response.status_code == 400
        assert "name" in response.json["errors"]

        # Verify NO fields were changed (transaction rollback)
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.name == original_name
        assert awarded_contract_agreement.description == original_description

    # ==================== Category 3: Super User - Immutable Field Updates (Should Succeed) ====================

    def test_patch_awarded_contract_super_user_update_name_succeeds(
        self, power_user_auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a super user can update 'name' on an awarded contract."""
        new_name = "Super User Updated Name"

        response = power_user_auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "name": new_name,
            },
        )

        assert response.status_code == 200

        # Verify name was changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.name == new_name

    def test_patch_awarded_contract_super_user_update_contract_type_succeeds(
        self, power_user_auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a super user can update 'contract_type' on an awarded contract."""
        response = power_user_auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "contract_type": "TIME_AND_MATERIALS",
            },
        )

        assert response.status_code == 200

        # Verify contract_type was changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.contract_type == ContractType.TIME_AND_MATERIALS

    def test_patch_awarded_contract_super_user_update_multiple_immutable_fields_succeeds(
        self, power_user_auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a super user can update multiple immutable fields on an awarded contract."""
        new_name = "Super User New Name"

        response = power_user_auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "name": new_name,
                "agreement_reason": "RECOMPETE",
                "service_requirement_type": "NON_SEVERABLE",
            },
        )

        assert response.status_code == 200

        # Verify all fields were changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.name == new_name
        assert awarded_contract_agreement.agreement_reason == AgreementReason.RECOMPETE
        assert awarded_contract_agreement.service_requirement_type == ServiceRequirementType.NON_SEVERABLE

    def test_patch_awarded_contract_super_user_update_all_immutable_fields_succeeds(
        self, power_user_auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a super user can update ALL immutable fields on an awarded contract."""
        response = power_user_auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "name": "Completely New Name",
                "contract_type": "COST_PLUS_FIXED_FEE",
                "service_requirement_type": "NON_SEVERABLE",
                "product_service_code_id": 2,
                "awarding_entity_id": 2,
                "agreement_reason": "LOGICAL_FOLLOW_ON",
            },
        )

        assert response.status_code == 200

        # Verify all fields were changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.name == "Completely New Name"
        assert awarded_contract_agreement.contract_type == ContractType.COST_PLUS_FIXED_FEE
        assert awarded_contract_agreement.service_requirement_type == ServiceRequirementType.NON_SEVERABLE
        assert awarded_contract_agreement.product_service_code_id == 2
        assert awarded_contract_agreement.awarding_entity_id == 2
        assert awarded_contract_agreement.agreement_reason == AgreementReason.LOGICAL_FOLLOW_ON

    def test_patch_awarded_contract_super_user_update_mix_fields_succeeds(
        self, power_user_auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a super user can update both mutable and immutable fields together."""
        new_name = "Super User Mixed Update"
        new_description = "Updated description"

        response = power_user_auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "name": new_name,  # Immutable
                "description": new_description,  # Mutable
            },
        )

        assert response.status_code == 200

        # Verify both fields were changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.name == new_name
        assert awarded_contract_agreement.description == new_description

    # ==================== Category 4: Super User - Mutable Field Updates (Should Succeed) ====================

    def test_patch_awarded_contract_super_user_update_mutable_fields_succeeds(
        self, power_user_auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that a super user can update mutable fields (same as regular users)."""
        new_description = "Super user updated description"
        new_notes = "Super user notes"

        response = power_user_auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "description": new_description,
                "notes": new_notes,
            },
        )

        assert response.status_code == 200

        # Verify fields were changed
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.description == new_description
        assert awarded_contract_agreement.notes == new_notes

    # ==================== Category 5: Edge Cases ====================

    def test_patch_awarded_contract_regular_user_same_value_succeeds(
        self, auth_client, awarded_contract_agreement, loaded_db, app_ctx
    ):
        """Test that updating an immutable field with its current value is allowed."""
        current_name = awarded_contract_agreement.name

        response = auth_client.patch(
            url_for("api.agreements-item", id=awarded_contract_agreement.id),
            json={
                "name": current_name,  # Same value
            },
        )

        assert response.status_code == 200

        # Verify name unchanged
        loaded_db.refresh(awarded_contract_agreement)
        assert awarded_contract_agreement.name == current_name

    def test_patch_non_awarded_contract_regular_user_update_any_field_succeeds(
        self, auth_client, test_contract, loaded_db, app_ctx
    ):
        """Test that regular users can update 'immutable' fields on non-awarded contracts."""
        new_name = "Updated Name on Non-Awarded Contract"

        # Ensure contract is NOT awarded
        assert not test_contract.is_awarded

        response = auth_client.patch(
            url_for("api.agreements-item", id=test_contract.id),
            json={
                "name": new_name,
            },
        )

        assert response.status_code == 200

        # Verify name was changed
        loaded_db.refresh(test_contract)
        assert test_contract.name == new_name

    def test_patch_awarded_aa_agreement_immutable_fields(self, auth_client, loaded_db, test_project, app_ctx):
        """Test that AA agreements have additional immutable fields (requesting/servicing agency)."""
        # Get agencies
        req_agency = loaded_db.scalar(select(AgreementAgency).where(AgreementAgency.requesting == True))  # noqa: E712

        serv_agency = loaded_db.scalar(select(AgreementAgency).where(AgreementAgency.servicing == True))  # noqa: E712

        if not req_agency or not serv_agency:
            pytest.skip("Requires requesting and servicing agencies in test data")

        # Create awarded AA agreement
        aa_agreement = AaAgreement(
            name="Awarded AA Agreement",
            agreement_type=AgreementType.AA,
            project_id=test_project.id,
            requesting_agency_id=req_agency.id,
            servicing_agency_id=serv_agency.id,
            contract_type=ContractType.FIRM_FIXED_PRICE,
            service_requirement_type=ServiceRequirementType.SEVERABLE,
            product_service_code_id=1,
            awarding_entity_id=1,
            agreement_reason=AgreementReason.NEW_REQ,
            project_officer_id=500,
        )
        loaded_db.add(aa_agreement)
        loaded_db.commit()

        # Make it awarded
        proc_action = ProcurementAction(
            agreement_id=aa_agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(proc_action)
        loaded_db.commit()

        # Get another agency for the update attempt
        different_agency = (
            loaded_db.query(AgreementAgency)
            .filter(AgreementAgency.requesting == True, AgreementAgency.id != req_agency.id)  # noqa: E712
            .first()
        )

        if different_agency:
            # Try to update requesting_agency_id (immutable for AA)
            response = auth_client.patch(
                url_for("api.agreements-item", id=aa_agreement.id),
                json={
                    "requesting_agency_id": different_agency.id,  # Different agency
                },
            )

            assert response.status_code == 400
            assert "requesting_agency_id" in response.json["errors"]

        # Cleanup
        loaded_db.query(ProcurementAction).filter(ProcurementAction.agreement_id == aa_agreement.id).delete()
        loaded_db.delete(aa_agreement)
        loaded_db.commit()

    def test_patch_awarded_grant_no_immutable_fields(self, auth_client, loaded_db, test_project, app_ctx):
        """Test that GrantAgreements have no immutable fields even when awarded."""
        # Create awarded grant
        grant = GrantAgreement(
            name="Awarded Grant Agreement Has No Immutable Fields",
            agreement_type=AgreementType.GRANT,
            project_id=test_project.id,
            project_officer_id=500,
        )
        loaded_db.add(grant)
        loaded_db.commit()

        # Make it awarded
        proc_action = ProcurementAction(
            agreement_id=grant.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(proc_action)
        loaded_db.commit()

        # Try to update name (would be immutable for contracts, but not for grants)
        new_name = "Updated Grant Name Has No Immutable Fields"
        response = auth_client.patch(
            url_for("api.agreements-item", id=grant.id),
            json={
                "name": new_name,
            },
        )

        assert response.status_code == 200

        # Verify name was changed
        loaded_db.refresh(grant)
        assert grant.name == new_name

        # Cleanup
        loaded_db.query(ProcurementAction).filter(ProcurementAction.agreement_id == grant.id).delete()
        loaded_db.delete(grant)
        loaded_db.commit()


class TestAgreementFilterOptions:
    """Tests for GET /agreements-filters/ endpoint."""

    def test_get_agreement_filter_options(self, auth_client, loaded_db, app_ctx):
        """GET /agreements-filters/ returns all expected filter option fields."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        data = response.json
        assert "fiscal_years" in data
        assert "portfolios" in data
        assert "project_titles" in data
        assert "agreement_types" in data
        assert "agreement_names" in data
        assert "contract_numbers" in data
        assert "research_types" in data

    def test_filter_options_fiscal_years_sorted_descending(self, auth_client, loaded_db, app_ctx):
        """Fiscal years should be sorted in descending order."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        fiscal_years = response.json["fiscal_years"]
        assert len(fiscal_years) > 0
        assert fiscal_years == sorted(fiscal_years, reverse=True)

    def test_filter_options_portfolios_have_id_and_name(self, auth_client, loaded_db, app_ctx):
        """Portfolios should be returned as list of dicts with id and name."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        portfolios = response.json["portfolios"]
        assert len(portfolios) > 0
        for portfolio in portfolios:
            assert "id" in portfolio
            assert "name" in portfolio

    def test_filter_options_portfolios_sorted_by_name(self, auth_client, loaded_db, app_ctx):
        """Portfolios should be sorted alphabetically by name."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        portfolios = response.json["portfolios"]
        names = [p["name"] for p in portfolios]
        assert names == sorted(names)

    def test_filter_options_project_titles_have_id_and_name(self, auth_client, loaded_db, app_ctx):
        """Project titles should be returned as list of dicts with id and name."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        project_titles = response.json["project_titles"]
        assert len(project_titles) > 0
        for project in project_titles:
            assert "id" in project
            assert "name" in project

    def test_filter_options_project_titles_sorted_by_name(self, auth_client, loaded_db, app_ctx):
        """Project titles should be sorted alphabetically by name."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        project_titles = response.json["project_titles"]
        names = [p["name"] for p in project_titles]
        assert names == sorted(names)

    def test_filter_options_agreement_types_sorted(self, auth_client, loaded_db, app_ctx):
        """Agreement types should be sorted alphabetically."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        agreement_types = response.json["agreement_types"]
        assert len(agreement_types) > 0
        assert agreement_types == sorted(agreement_types)

    def test_filter_options_agreement_names_have_id_and_name(self, auth_client, loaded_db, app_ctx):
        """Agreement names should be returned as list of dicts with id and name."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        agreement_names = response.json["agreement_names"]
        assert len(agreement_names) > 0
        for name_entry in agreement_names:
            assert "id" in name_entry
            assert "name" in name_entry

    def test_filter_options_agreement_names_sorted_by_name(self, auth_client, loaded_db, app_ctx):
        """Agreement names should be sorted alphabetically by name."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        agreement_names = response.json["agreement_names"]
        names = [a["name"] for a in agreement_names]
        assert names == sorted(names)

    def test_filter_options_contract_numbers_sorted(self, auth_client, loaded_db, app_ctx):
        """Contract numbers should be sorted alphabetically."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        contract_numbers = response.json["contract_numbers"]
        assert len(contract_numbers) > 0
        assert contract_numbers == sorted(contract_numbers)

    def test_filter_options_research_types_empty(self, auth_client, loaded_db, app_ctx):
        """Research types should be an empty list (placeholder for future logic)."""
        response = auth_client.get(url_for("api.agreements-filters"))
        assert response.status_code == 200

        assert response.json["research_types"] == []

    def test_filter_options_with_only_my(self, division_director_auth_client, loaded_db, app_ctx):
        """GET /agreements-filters/?only_my=true returns filter options scoped to user's agreements."""
        response = division_director_auth_client.get(
            url_for("api.agreements-filters"),
            query_string={"only_my": "true"},
        )
        assert response.status_code == 200

        data = response.json
        assert "fiscal_years" in data
        assert "portfolios" in data
        assert "project_titles" in data
        assert "agreement_types" in data
        assert "agreement_names" in data
        assert "contract_numbers" in data

    def test_filter_options_only_my_returns_subset(self, basic_user_auth_client, auth_client, loaded_db, app_ctx):
        """Filter options with only_my should return a subset of the unfiltered options."""
        # Get all filter options (auth_client has SYSTEM_OWNER privileges)
        all_response = auth_client.get(url_for("api.agreements-filters"))
        assert all_response.status_code == 200

        # Get only_my filter options (basic_user has limited associations)
        my_response = basic_user_auth_client.get(
            url_for("api.agreements-filters"),
            query_string={"only_my": "true"},
        )
        assert my_response.status_code == 200

        # The user-scoped options should be a subset (or equal) of all options
        assert len(my_response.json["agreement_names"]) <= len(all_response.json["agreement_names"])

    def test_filter_options_no_permission(self, no_perms_auth_client):
        """GET /agreements-filters/ should return 403 for unauthorized users."""
        response = no_perms_auth_client.get("/api/v1/agreements-filters/")
        assert response.status_code == 403
