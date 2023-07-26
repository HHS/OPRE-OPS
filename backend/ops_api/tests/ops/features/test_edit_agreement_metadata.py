import pytest
from models import AgreementType, ContractAgreement, ContractType
from ops_api.ops.resources.agreements import AgreementData
from pytest_bdd import given, scenario, then, when

AGREEMENT_ID = 1

TEST_CONTRACT_DATA = {
    "agreement_type": "CONTRACT",
    "name": "Feature Test Contract",
    "description": "Contract Description",
    "number": "BDD0001",
    "team_members": [{"id": 1}],
    "support_contacts": [{"id": 2}, {"id": 3}],
    "notes": "Test Note",
}


@pytest.fixture()
def test_contract(loaded_db):
    contract_agreement = ContractAgreement(
        name="Feature Test Contract",
        number="BDD0999",
        contract_number="CT0999",
        contract_type=ContractType.RESEARCH,
        agreement_type=AgreementType.CONTRACT,
        research_project_id=1,
    )
    loaded_db.add(contract_agreement)
    loaded_db.commit()

    yield contract_agreement

    loaded_db.delete(contract_agreement)
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


@given("I am a logged in as an OPS user", target_fixture="client")
def client(auth_client):
    return auth_client


@given("I have a Contract Agreement", target_fixture="contract_agreement")
def contract_agreement(client, app, test_contract):
    get_resp = client.get(f"/api/v1/agreements/{test_contract.id}")
    data = get_resp.json
    assert data["id"] == test_contract.id
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
    schema = AgreementData.get_schema(agreement_type)
    data_to_put = {k: data[k] for k in schema.fields.keys() if k in data.keys()}
    return data_to_put


@when("I submit the agreement", target_fixture="submit_response")
def submit(client, edited_agreement):
    data_to_put = reduce_for_put(edited_agreement)
    resp = client.put(f"/api/v1/agreements/{edited_agreement['id']}", json=data_to_put)
    return resp


@when("I submit a new value for notes", target_fixture="submit_response")
def submit_patch_notes(client):
    data = {"notes": "patch notes"}
    resp = client.patch(f"/api/v1/agreements/{AGREEMENT_ID}", json=data)
    return resp


@then("I should get an error message that it's invalid")
def invalid(submit_response):
    assert submit_response.status_code == 400


@then("I should get an message that it was successful")
def success(submit_response):
    assert submit_response.status_code == 200
