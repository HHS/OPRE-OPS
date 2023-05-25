import json

import pytest
from pytest_bdd import given, scenario, then, when

from ops_api.ops.resources.agreements import ContractAgreementRequestBody

AGREEMENT_ID = 1


# without these fixture defs, the test works, but it fails checks by IDE, etc.
# @pytest.fixture
# def edited_agreement():
#     raise NotImplementedError("This should be implemented in a step")
#
#
# @pytest.fixture
# def submit_response():
#     raise NotImplementedError("This should be implemented in a step")


@scenario("edit_agreement_metadata.feature", "Required Fields")
def test_required_fields(loaded_db):
    pass


@scenario("edit_agreement_metadata.feature", "Successful Edit")
def test_successful_edit(loaded_db):
    pass


@given("I am a logged in as an OPS user", target_fixture="client")
def client(auth_client):
    print("I am a logged in as an OPS user")
    return auth_client


@given("I have a Contract Agreement", target_fixture="contract_agreement")
def contract_agreement(client, app):
    resp = client.get(f"/api/v1/agreements/{AGREEMENT_ID}")
    data = resp.json
    assert data["id"] == AGREEMENT_ID
    data_to_put = {k: data[k] for k in ContractAgreementRequestBody.__annotations__.keys()}
    return data_to_put


@given("I edit the agreement to remove a required field", target_fixture="edited_agreement")
def remove_required_field(contract_agreement):
    # contract_agreement["name"] = None
    contract_agreement.pop("name")
    return contract_agreement


@given("I edit the agreement to change a value", target_fixture="edited_agreement")
def change_value(contract_agreement):
    contract_agreement["name"] = "Updated Name"
    return contract_agreement


@when("I submit the agreement", target_fixture="submit_response")
def submit(client, edited_agreement):
    print(f"{edited_agreement=}")
    print(f"{json.dumps(edited_agreement, indent=2)}")
    resp = client.put(f"/api/v1/agreements/{AGREEMENT_ID}", json=edited_agreement)
    return resp


@then("I should get an error message that it's invalid")
def invalid(submit_response):
    assert submit_response.status_code == 400


@then("I should get an message that it was successful")
def success(submit_response):
    assert submit_response.status_code == 200
