import datetime

import pytest
from pytest_bdd import given, scenario, then, when
from sqlalchemy import select

from models import (
    CAN,
    AgreementType,
    AwardType,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    ContractType,
    Division,
    Portfolio,
    ProcurementAction,
    ProcurementActionStatus,
)
from ops_api.ops.resources.agreements import AGREEMENTS_REQUEST_SCHEMAS

TEST_CONTRACT_DATA = {
    "agreement_type": "CONTRACT",
    "name": "Feature Test Contract",
    "description": "Contract Description",
    "team_members": [{"id": 1}],
    "support_contacts": [{"id": 2}, {"id": 3}],
    "notes": "Test Note",
}


@pytest.fixture()
def test_contract(loaded_db, test_project, test_admin_user):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        contract_number="CT0999",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
        project_officer_id=test_admin_user.id,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.fixture()
def test_contract_unassociated(loaded_db):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        contract_number="CT0999",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.fixture()
def awarded_contract(loaded_db, test_contract, test_can):
    procurement_action = ProcurementAction(
        agreement_id=test_contract.id, status=ProcurementActionStatus.AWARDED, award_type=AwardType.NEW_AWARD
    )
    loaded_db.add(procurement_action)
    loaded_db.commit()

    yield test_contract
    loaded_db.delete(procurement_action)
    loaded_db.commit()


@pytest.fixture()
def contract_with_planned_bli(loaded_db, test_contract, test_can):
    planned_bli = ContractBudgetLineItem(
        agreement_id=test_contract.id,
        comments="blah blah bleh blah",
        line_description="LI Planned",
        amount=200.24,
        can_id=test_can.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.PLANNED,
        proc_shop_fee_percentage=2.34,
        created_by=1,
    )
    loaded_db.add(planned_bli)
    loaded_db.commit()

    yield test_contract

    loaded_db.delete(planned_bli)
    loaded_db.commit()


@pytest.fixture()
def test_can_with_division_director(loaded_db, test_admin_user):
    """Get a test CAN."""
    # get the division with the greatest id
    greatest_division = loaded_db.execute(select(Division).order_by(Division.id.desc()).limit(1)).scalar_one_or_none()

    division = Division(
        id=greatest_division.id + 1,
        name="Division 1",
        abbreviation="DIV1",
        division_director_id=test_admin_user.id,
    )

    loaded_db.add(division)
    loaded_db.commit()

    portfolio = Portfolio(
        name="Test Portfolio",
        description="Test Portfolio Description",
        division_id=division.id,
    )

    loaded_db.add(portfolio)
    loaded_db.commit()

    can = CAN(
        number="CAN1234",
        description="Test CAN Description",
        portfolio_id=portfolio.id,
    )

    loaded_db.add(can)
    loaded_db.commit()

    yield can

    loaded_db.delete(can)
    loaded_db.delete(portfolio)
    loaded_db.commit()
    loaded_db.delete(division)
    loaded_db.commit()


@pytest.fixture()
def test_can_with_portfolio_team_leader(loaded_db, test_admin_user):
    """Get a test CAN."""
    # get the division with the greatest id
    greatest_division = loaded_db.execute(select(Division).order_by(Division.id.desc()).limit(1)).scalar_one_or_none()

    division = Division(
        id=greatest_division.id + 1,
        name="Division 1",
        abbreviation="DIV1",
    )

    loaded_db.add(division)
    loaded_db.commit()

    portfolio = Portfolio(
        name="Test Portfolio",
        description="Test Portfolio Description",
        division_id=division.id,
    )

    portfolio.team_leaders.append(test_admin_user)

    loaded_db.add(portfolio)
    loaded_db.commit()

    can = CAN(
        number="CAN1234",
        description="Test CAN Description",
        portfolio_id=portfolio.id,
    )

    loaded_db.add(can)
    loaded_db.commit()

    yield can

    loaded_db.delete(can)
    loaded_db.delete(portfolio)
    loaded_db.commit()
    loaded_db.delete(division)
    loaded_db.commit()


@pytest.fixture()
def test_contract_with_division_director(loaded_db, test_project):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        contract_number="CT0111",
        contract_type=ContractType.FIRM_FIXED_PRICE,
        agreement_type=AgreementType.CONTRACT,
        project_id=test_project.id,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
    loaded_db.commit()


@pytest.fixture()
def contract_with_can_with_division_director(
    loaded_db, test_contract_with_division_director, test_can_with_division_director
):
    planned_bli = ContractBudgetLineItem(
        agreement_id=test_contract_with_division_director.id,
        comments="blah blah bleh blah",
        line_description="LI Planned",
        amount=200.24,
        can_id=test_can_with_division_director.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.PLANNED,
        proc_shop_fee_percentage=2.34,
        created_by=1,
    )
    loaded_db.add(planned_bli)
    loaded_db.commit()

    yield test_contract_with_division_director

    loaded_db.delete(planned_bli)
    loaded_db.commit()


@pytest.fixture()
def contract_with_can_with_portfolio_team_leader(
    loaded_db, test_contract_with_division_director, test_can_with_portfolio_team_leader
):
    planned_bli = ContractBudgetLineItem(
        agreement_id=test_contract_with_division_director.id,
        comments="blah blah bleh blah",
        line_description="LI Planned",
        amount=200.24,
        can_id=test_can_with_portfolio_team_leader.id,
        date_needed=datetime.date(2043, 1, 1),
        status=BudgetLineItemStatus.PLANNED,
        proc_shop_fee_percentage=2.34,
        created_by=1,
    )
    loaded_db.add(planned_bli)
    loaded_db.commit()

    yield test_contract_with_division_director

    loaded_db.delete(planned_bli)
    loaded_db.commit()


@scenario("edit_agreement_metadata.feature", "Required Fields")
def test_required_fields():
    pass


@scenario("edit_agreement_metadata.feature", "Successful Edit")
def test_successful_edit():
    pass


@scenario("edit_agreement_metadata.feature", "Successful Edit of Just Notes")
def test_successful_edit_patch_notes():
    pass


@scenario("edit_agreement_metadata.feature", "Failed Edit because Agreement is Awarded")
def test_failed_edit_agreement_awarded():
    pass


@scenario("edit_agreement_metadata.feature", "Division Director can edit Agreement metadata")
def test_division_director_can_edit_agreement():
    pass


@scenario(
    "edit_agreement_metadata.feature",
    "Unassociated user cannot edit Agreement metadata",
)
def test_unassociated_user_cannot_edit_agreement_metadata():
    pass


@scenario(
    "edit_agreement_metadata.feature",
    "Portfolio Team Leader can edit Agreement metadata",
)
def test_portfolio_team_leader_can_edit_agreement_metadata():
    pass


@scenario("edit_agreement_metadata.feature", "System owner can edit Agreement metadata")
def test_system_owner_can_edit_agreement_metadata():
    pass


@given("I am a logged in as an OPS user", target_fixture="client")
def client(auth_client):
    return auth_client


@given("I am a logged in as a system owner", target_fixture="client")
def system_owner_client(system_owner_auth_client):
    return system_owner_auth_client


@given("I am a logged in as a basic user", target_fixture="client")
def basic_user_client(basic_user_auth_client):
    return basic_user_auth_client


@given("I have a Contract Agreement", target_fixture="contract_agreement")
def contract_agreement(client, app, test_contract):
    get_resp = client.get(f"/api/v1/agreements/{test_contract.id}")
    data = get_resp.json
    assert data["id"] == test_contract.id
    return data


@given(
    "I have an Awarded Contract Agreement",
    target_fixture="contract_agreement",
)
def contract_agreement_execution(client, app, awarded_contract):
    get_resp = client.get(f"/api/v1/agreements/{awarded_contract.id}")
    data = get_resp.json
    assert data["id"] == awarded_contract.id
    return data


@given(
    "I have a Contract Agreement with a BLI in planned",
    target_fixture="contract_agreement",
)
def contract_agreement_planned(client, app, contract_with_planned_bli):
    get_resp = client.get(f"/api/v1/agreements/{contract_with_planned_bli.id}")
    data = get_resp.json
    assert data["id"] == contract_with_planned_bli.id
    return data


@given(
    "I have a Contract Agreement associated with a CAN where I am the Division Director",
    target_fixture="contract_agreement",
)
def contract_agreement_with_division_director(client, app, contract_with_can_with_division_director):
    get_resp = client.get(f"/api/v1/agreements/{contract_with_can_with_division_director.id}")
    data = get_resp.json
    assert data["id"] == contract_with_can_with_division_director.id
    return data


@given(
    "I have a Contract Agreement associated with a CAN where I am the Portfolio Team Leader",
    target_fixture="contract_agreement",
)
def contract_agreement_with_portfolio_team_leader(client, app, contract_with_can_with_portfolio_team_leader):
    get_resp = client.get(f"/api/v1/agreements/{contract_with_can_with_portfolio_team_leader.id}")
    data = get_resp.json
    assert data["id"] == contract_with_can_with_portfolio_team_leader.id
    return data


@given(
    "I have a Contract Agreement associated with a CAN where I am the system owner",
    target_fixture="contract_agreement",
)
def contract_agreement_with_system_owner(client, app, contract_with_can_with_portfolio_team_leader):
    get_resp = client.get(f"/api/v1/agreements/{contract_with_can_with_portfolio_team_leader.id}")
    data = get_resp.json
    assert data["id"] == contract_with_can_with_portfolio_team_leader.id
    return data


@given(
    "I have a Contract Agreement I am not associated with",
    target_fixture="contract_agreement",
)
def contract_agreement_with_unassociated_user(client, app, test_contract_unassociated):
    get_resp = client.get(f"/api/v1/agreements/{test_contract_unassociated.id}")
    data = get_resp.json
    assert data["id"] == test_contract_unassociated.id
    return data


@given("I edit the agreement to remove a required field", target_fixture="edited_agreement")
def remove_required_field(contract_agreement):
    # contract_agreement["name"] = None
    contract_agreement.pop("name")
    return contract_agreement


@given("I edit the agreement to change a value", target_fixture="edited_agreement")
def change_value(contract_agreement):
    contract_agreement["name"] = "Updated Name"
    return contract_agreement


def reduce_for_put(data):
    """Some fields returned in the GET can't be sent in a PUT|PATCH.
    So this creates a copy of the data reduced to valid fields for PUT|PATCH"""
    agreement_type = AgreementType[data["agreement_type"]]
    schema = AGREEMENTS_REQUEST_SCHEMAS.get(agreement_type)
    data_to_put = {
        k: data[k]
        for k in schema.fields.keys()
        if k in data.keys() and k not in ["budget_line_items", "services_components"]
    }
    return data_to_put


@when("I submit the agreement", target_fixture="submit_response")
def submit(client, edited_agreement):
    data_to_put = reduce_for_put(edited_agreement)
    resp = client.put(f"/api/v1/agreements/{edited_agreement['id']}", json=data_to_put)
    return resp


@when("I submit a new value for notes", target_fixture="submit_response")
def submit_patch_notes(client, test_contract):
    data = {"notes": "patch notes"}
    resp = client.patch(f"/api/v1/agreements/{test_contract.id}", json=data)
    return resp


@then("I should get an error message that it's invalid")
def invalid(submit_response):
    assert submit_response.status_code == 400


@then("I should get an message that it was successful")
def success(submit_response):
    assert submit_response.status_code == 200


@then("the Agreement's budget line items are all now Draft")
def draft_check(client, contract_agreement):
    get_resp = client.get(f"/api/v1/agreements/{contract_agreement['id']}")
    data = get_resp.json
    assert all(bli["status"] == BudgetLineItemStatus.DRAFT.name for bli in data["budget_line_items"])


@then("I should get an error message that I'm not authorized")
def failure_not_authorized(submit_response):
    assert submit_response.status_code == 403
