from pytest_bdd import given, scenario, then, when

AGREEMENT_ID = 1


@scenario("edit_agreement_metadata.feature", "Required Fields")
def test_required_fields(loaded_db):
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
    return data


@when("I submit a Contract Agreement that is missing required fields", target_fixture="submit")
def submit(client, contract_agreement):
    # remove required field
    contract_agreement.pop('name', None)
    resp = client.put(f"/api/v1/agreements/{AGREEMENT_ID}", json=contract_agreement)
    return resp


@then("I should get an error message that it's invalid")
def invalid(submit):
    assert submit.status_code == 400

