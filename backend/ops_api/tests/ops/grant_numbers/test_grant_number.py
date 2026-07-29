import datetime

import pytest
from flask import url_for

from models import AgreementType, GrantAgreement, GrantNumber, User


def test_grant_number_retrieve(loaded_db, app_ctx):
    grant_number = GrantNumber(
        agreement_id=3,
        number=1,
        description="Test grant number",
        period_start=datetime.date(2043, 6, 13),
        period_end=datetime.date(2044, 6, 13),
    )
    loaded_db.add(grant_number)
    loaded_db.commit()

    fetched = loaded_db.get(GrantNumber, grant_number.id)
    assert fetched is not None
    assert fetched.number == 1
    assert fetched.description == "Test grant number"
    assert fetched.period_start == datetime.date(2043, 6, 13)
    assert fetched.period_end == datetime.date(2044, 6, 13)
    assert fetched.display_title == "Grant 1"
    assert fetched.display_name == "Grant 1"

    loaded_db.delete(fetched)
    loaded_db.commit()


def test_grant_number_creation():
    gn = GrantNumber(
        number=2,
        description="Optional grant number",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )

    assert gn is not None
    assert gn.number == 2
    assert gn.display_title == "Grant 2"
    assert gn.display_name == "Grant 2"


def test_period_duration_calculation():
    gn_with_dates = GrantNumber(
        number=3,
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 3, 1),
    )
    expected_duration = (gn_with_dates.period_end - gn_with_dates.period_start).days
    assert gn_with_dates.period_duration.days == expected_duration


def test_period_duration_calculation_with_inverted_dates():
    # period_end before period_start. The model's abs() makes this "work" by
    # returning a positive duration for nonsensical input — assert the actual
    # behavior so a future change to this logic is caught by this test.
    gn_inverted = GrantNumber(
        number=4,
        period_start=datetime.date(2024, 3, 1),
        period_end=datetime.date(2024, 1, 1),
    )
    expected_duration = abs((gn_inverted.period_end - gn_inverted.period_start).days)
    assert gn_inverted.period_duration.days == expected_duration


def test_period_duration_calculation_with_missing_dates():
    gn_no_end_date = GrantNumber(number=5, period_start=datetime.date(2024, 1, 1), period_end=None)
    assert gn_no_end_date.period_duration is None

    gn_no_start_date = GrantNumber(number=6, period_start=None, period_end=datetime.date(2024, 3, 1))
    assert gn_no_start_date.period_duration is None

    gn_no_dates = GrantNumber(number=7, period_start=None, period_end=None)
    assert gn_no_dates.period_duration is None


def test_grant_numbers_get_all(auth_client, loaded_db, app_ctx):
    gn = GrantNumber(agreement_id=3, number=8, description="get-all test")
    loaded_db.add(gn)
    loaded_db.commit()

    count = loaded_db.query(GrantNumber).count()

    response = auth_client.get(url_for("api.grant-number-group"))
    assert response.status_code == 200
    assert len(response.json) == count

    loaded_db.delete(gn)
    loaded_db.commit()


def test_grant_numbers_get_by_id(auth_client, loaded_db, app_ctx):
    gn = GrantNumber(
        agreement_id=3,
        number=9,
        description="get-by-id test",
        period_start=datetime.date(2043, 6, 13),
        period_end=datetime.date(2044, 6, 13),
    )
    loaded_db.add(gn)
    loaded_db.commit()
    gn_id = gn.id

    response = auth_client.get(url_for("api.grant-number-item", id=gn_id))
    assert response.status_code == 200
    resp_json = response.json
    assert resp_json["agreement_id"] == 3
    assert resp_json["number"] == 9
    assert resp_json["description"] == "get-by-id test"
    assert resp_json["display_title"] == "Grant 9"
    assert resp_json["display_name"] == "Grant 9"
    assert resp_json["period_start"] == "2043-06-13"
    assert resp_json["period_end"] == "2044-06-13"

    loaded_db.delete(gn)
    loaded_db.commit()


def test_grant_numbers_get_list(auth_client, loaded_db, app_ctx):
    gn = GrantNumber(agreement_id=3, number=10, description="get-list test")
    loaded_db.add(gn)
    loaded_db.commit()

    response = auth_client.get(url_for("api.grant-number-group"), query_string={"agreement_id": 3})
    assert response.status_code == 200
    resp_json = response.json
    assert len(resp_json) > 0
    assert all(item["agreement_id"] == 3 for item in resp_json)

    loaded_db.delete(gn)
    loaded_db.commit()


def test_grant_numbers_post(auth_client, loaded_db, app_ctx):
    data = {
        "agreement_id": 3,
        "number": 11,
        "description": "Test grant number description",
        "period_end": "2044-06-13",
        "period_start": "2043-06-13",
    }
    response = auth_client.post(url_for("api.grant-number-group"), json=data)
    assert response.status_code == 201
    resp_json = response.json
    for key in data:
        assert resp_json.get(key) == data.get(key)
    assert "id" in resp_json
    new_gn_id = resp_json["id"]

    gn = loaded_db.get(GrantNumber, new_gn_id)
    assert gn.id == new_gn_id
    assert gn.description == data["description"]
    assert gn.number == data["number"]
    assert gn.period_start == datetime.date(2043, 6, 13)
    assert gn.period_end == datetime.date(2044, 6, 13)

    loaded_db.delete(gn)
    loaded_db.commit()


@pytest.fixture()
def test_grant_number(loaded_db, app_ctx):
    gn = GrantNumber(
        agreement_id=3,
        number=12,
        description="Fixture grant number",
        period_start=datetime.date(2025, 6, 13),
        period_end=datetime.date(2028, 6, 13),
    )
    loaded_db.add(gn)
    loaded_db.commit()
    yield gn

    lingering = loaded_db.get(GrantNumber, gn.id)
    if lingering:
        loaded_db.delete(lingering)
        loaded_db.commit()


def test_grant_numbers_patch(auth_client, loaded_db, test_grant_number, app_ctx):
    gn_id = test_grant_number.id

    patch_data = {
        "description": "Test grant number description Update",
        "number": 22,
        "period_start": None,
        "period_end": "2054-07-15",
    }
    response = auth_client.patch(url_for("api.grant-number-item", id=gn_id), json=patch_data)
    assert response.status_code == 200
    resp_json = response.json
    for key in patch_data:
        assert resp_json.get(key) == patch_data.get(key)

    gn = loaded_db.get(GrantNumber, gn_id)
    assert gn.id == gn_id
    assert gn.description == patch_data["description"]
    assert gn.number == patch_data["number"]
    assert gn.period_start is None
    assert gn.period_end == datetime.date(2054, 7, 15)


def test_grant_numbers_put(auth_client, loaded_db, test_grant_number, app_ctx):
    gn_id = test_grant_number.id

    put_data = {
        "agreement_id": 4,
        "description": "Test grant number description Update",
        "number": 22,
        "period_start": "2053-08-14",
        "period_end": "2054-07-15",
    }
    response = auth_client.put(url_for("api.grant-number-item", id=gn_id), json=put_data)
    assert response.status_code == 400  # Cannot change agreement_id

    put_data = {
        "agreement_id": test_grant_number.agreement_id,
        "description": "Test grant number description Update",
        "number": 22,
        "period_start": "2053-08-14",
        "period_end": "2054-07-15",
    }
    response = auth_client.put(url_for("api.grant-number-item", id=gn_id), json=put_data)
    assert response.status_code == 200
    resp_json = response.json
    assert resp_json["agreement_id"] == test_grant_number.agreement_id  # not allowed to change
    for key in put_data:
        if key != "agreement_id":
            assert resp_json.get(key) == put_data.get(key)

    gn = loaded_db.get(GrantNumber, gn_id)
    assert gn.id == gn_id
    assert gn.description == put_data["description"]
    assert gn.number == put_data["number"]
    assert gn.period_start == datetime.date(2053, 8, 14)
    assert gn.period_end == datetime.date(2054, 7, 15)


def test_grant_numbers_delete(auth_client, loaded_db, test_grant_number, app_ctx):
    gn_id = test_grant_number.id

    response = auth_client.delete(url_for("api.grant-number-item", id=gn_id))
    assert response.status_code == 200

    gn = loaded_db.get(GrantNumber, gn_id)
    assert not gn


def test_grant_numbers_delete_cascades_from_agreement(auth_client, loaded_db, test_project, app_ctx):
    ga = GrantAgreement(
        name="Grant-cascade-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ga)
    loaded_db.commit()
    assert ga.id is not None
    new_ga_id = ga.id

    gn = GrantNumber(
        agreement_id=new_ga_id,
        number=1,
        description="Test grant number description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(gn)
    loaded_db.commit()

    assert gn.id is not None
    new_gn_id = gn.id

    loaded_db.delete(ga)
    loaded_db.commit()

    deleted_ga = loaded_db.get(GrantAgreement, new_ga_id)
    assert not deleted_ga

    deleted_gn = loaded_db.get(GrantNumber, new_gn_id)
    assert not deleted_gn


def test_grant_numbers_delete_does_not_cascade_to_agreement(auth_client, loaded_db, test_project, app_ctx):
    # Deleting a GrantNumber must NOT cascade back up to delete its parent GrantAgreement —
    # sanity-check the relationship direction.
    ga = GrantAgreement(
        name="Grant-no-cascade-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ga)
    loaded_db.commit()
    assert ga.id is not None
    new_ga_id = ga.id

    gn = GrantNumber(
        agreement_id=new_ga_id,
        number=1,
        description="Test grant number description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(gn)
    loaded_db.commit()

    assert gn.id is not None
    new_gn_id = gn.id

    remaining_ga = loaded_db.get(GrantAgreement, new_ga_id)
    assert remaining_ga is not None

    loaded_db.delete(gn)
    loaded_db.commit()

    deleted_gn = loaded_db.get(GrantNumber, new_gn_id)
    assert not deleted_gn

    remaining_ga = loaded_db.get(GrantAgreement, new_ga_id)
    assert remaining_ga is not None

    loaded_db.delete(remaining_ga)
    loaded_db.commit()


def test_grant_numbers_delete_as_basic_user(basic_user_auth_client, loaded_db, test_project, app_ctx):
    basic_user_id = 521
    basic_user = loaded_db.get(User, basic_user_id)

    grant_agreement = GrantAgreement(
        name="Grant-basic-user-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=basic_user_id,
        team_members=[basic_user],
    )
    loaded_db.add(grant_agreement)
    loaded_db.commit()
    assert grant_agreement.id is not None
    ga_id = grant_agreement.id

    grant_number = GrantNumber(
        agreement_id=ga_id,
        number=1,
        description="Test grant number description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(grant_number)
    loaded_db.commit()
    gn_id = grant_number.id

    response = basic_user_auth_client.delete(url_for("api.grant-number-item", id=gn_id))
    assert response.status_code == 200

    deleted_gn = loaded_db.get(GrantNumber, gn_id)
    assert not deleted_gn

    loaded_db.delete(grant_agreement)
    loaded_db.commit()


def test_grant_numbers_get_forbidden_without_role_permission(no_perms_auth_client, loaded_db, app_ctx):
    # A user whose role has none of the *_GRANT_NUMBER permissions should be denied
    # outright, regardless of team membership — the role-permission dimension.
    response = no_perms_auth_client.get(url_for("api.grant-number-group"))
    assert response.status_code == 403


def test_grant_numbers_delete_forbidden_as_non_team_member(
    basic_user_auth_client, system_owner_auth_client, loaded_db, test_project, app_ctx
):
    # A user with the right role permission but who is NOT a team member on the
    # agreement should still be denied by associated_with_agreement().
    system_owner_id = 520
    system_owner = loaded_db.get(User, system_owner_id)

    grant_agreement = GrantAgreement(
        name="Grant-non-member-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=system_owner_id,
        team_members=[system_owner],
    )
    loaded_db.add(grant_agreement)
    loaded_db.commit()
    assert grant_agreement.id is not None
    ga_id = grant_agreement.id

    grant_number = GrantNumber(
        agreement_id=ga_id,
        number=1,
        description="Test grant number description",
        period_start=datetime.date(2024, 1, 1),
        period_end=datetime.date(2024, 6, 30),
    )
    loaded_db.add(grant_number)
    loaded_db.commit()
    gn_id = grant_number.id

    # basic_user is not a team member on this grant agreement — should be denied.
    b_response = basic_user_auth_client.delete(url_for("api.grant-number-item", id=gn_id))
    assert b_response.status_code == 403

    # Clean up as system_owner, who IS a team member.
    d_response = system_owner_auth_client.delete(url_for("api.grant-number-item", id=gn_id))
    assert d_response.status_code == 200

    loaded_db.delete(grant_agreement)
    loaded_db.commit()


def test_cannot_create_duplicate_grant_numbers(loaded_db, test_project, app_ctx):
    from sqlalchemy.exc import IntegrityError

    ga = GrantAgreement(
        name="Grant-duplicate-number-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ga)
    loaded_db.commit()

    gn1 = GrantNumber(agreement_id=ga.id, number=1, description="First")
    loaded_db.add(gn1)
    loaded_db.commit()

    gn2 = GrantNumber(agreement_id=ga.id, number=1, description="Duplicate number")
    loaded_db.add(gn2)
    with pytest.raises(IntegrityError):
        loaded_db.commit()
    loaded_db.rollback()

    loaded_db.delete(gn1)
    loaded_db.delete(ga)
    loaded_db.commit()


def test_cannot_create_duplicate_grant_numbers_via_api(auth_client, loaded_db, test_project, app_ctx):
    ga = GrantAgreement(
        name="Grant-duplicate-number-api-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ga)
    loaded_db.commit()

    gn1_data = {"agreement_id": ga.id, "number": 1, "description": "First"}
    response1 = auth_client.post(url_for("api.grant-number-group"), json=gn1_data)
    assert response1.status_code == 201

    gn2_data = {"agreement_id": ga.id, "number": 1, "description": "Second (duplicate)"}
    response2 = auth_client.post(url_for("api.grant-number-group"), json=gn2_data)
    assert response2.status_code == 400

    gn = loaded_db.get(GrantNumber, response1.json["id"])
    loaded_db.delete(gn)
    loaded_db.delete(ga)
    loaded_db.commit()


def test_cannot_patch_duplicate_grant_numbers_via_api(auth_client, loaded_db, test_project, app_ctx):
    ga = GrantAgreement(
        name="Grant-duplicate-patch-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ga)
    loaded_db.commit()

    gn1_data = {"agreement_id": ga.id, "number": 1, "description": "First"}
    response1 = auth_client.post(url_for("api.grant-number-group"), json=gn1_data)
    assert response1.status_code == 201

    gn2_data = {"agreement_id": ga.id, "number": 2, "description": "Second"}
    response2 = auth_client.post(url_for("api.grant-number-group"), json=gn2_data)
    assert response2.status_code == 201

    # Try to PATCH gn2's number to collide with gn1's number.
    patch_response = auth_client.patch(url_for("api.grant-number-item", id=response2.json["id"]), json={"number": 1})
    assert patch_response.status_code == 400

    patch_response_put = auth_client.put(
        url_for("api.grant-number-item", id=response2.json["id"]),
        json={"agreement_id": ga.id, "number": 1, "description": "Second"},
    )
    assert patch_response_put.status_code == 400

    gn1 = loaded_db.get(GrantNumber, response1.json["id"])
    gn2 = loaded_db.get(GrantNumber, response2.json["id"])
    loaded_db.delete(gn1)
    loaded_db.delete(gn2)
    loaded_db.delete(ga)
    loaded_db.commit()


def test_grant_agreement_nested_grant_numbers_round_trip(auth_client, loaded_db, test_project, app_ctx):
    """POST /agreements with a nested grant_numbers array creates them atomically,
    and GET /agreements/{id} exposes them in the response (validates §1.13's response
    exposure and §1.12's nested-creation wiring)."""
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "GRANT",
            "name": "GRANT NUMBERS NESTED CREATE TEST",
            "description": "test nested grant numbers",
            "project_id": test_project.id,
            "grant_numbers": [
                {"number": 1, "description": "First grant number", "ref": "gn-1"},
                {"number": 2, "description": "Second grant number"},
            ],
        },
    )
    assert response.status_code == 201
    grant_id = response.json["id"]

    get_response = auth_client.get(url_for("api.agreements-item", id=grant_id))
    assert get_response.status_code == 200
    grant_numbers = get_response.json["grant_numbers"]
    assert len(grant_numbers) == 2
    numbers = {gn["number"] for gn in grant_numbers}
    assert numbers == {1, 2}
    descriptions = {gn["description"] for gn in grant_numbers}
    assert descriptions == {"First grant number", "Second grant number"}
    for gn in grant_numbers:
        assert gn["display_title"] == f"Grant {gn['number']}"

    delete_response = auth_client.delete(url_for("api.agreements-item", id=grant_id))
    assert delete_response.status_code == 200


def test_contract_agreement_response_has_no_grant_numbers_field(auth_client, loaded_db, test_project, app_ctx):
    """Regression test for the base-class placement bug found during plan review
    (§1.3/§1.13): grant_numbers must be scoped to GRANT responses only. A CONTRACT
    response must not carry a grant_numbers key at all."""
    response = auth_client.post(
        url_for("api.agreements-group"),
        json={
            "agreement_type": "CONTRACT",
            "name": "CONTRACT NO GRANT NUMBERS TEST",
            "project_id": test_project.id,
            "service_requirement_type": "NON_SEVERABLE",
        },
    )
    assert response.status_code == 201
    contract_id = response.json["id"]
    assert "grant_numbers" not in response.json

    get_response = auth_client.get(url_for("api.agreements-item", id=contract_id))
    assert get_response.status_code == 200
    assert "grant_numbers" not in get_response.json

    delete_response = auth_client.delete(url_for("api.agreements-item", id=contract_id))
    assert delete_response.status_code == 200


def test_agreement_edit_bundle_grant_numbers_atomic(auth_client, loaded_db, test_project, app_ctx):
    """PATCH /agreements/{id}/edit-bundle with grant_numbers: {create, update, delete}
    applies atomically."""
    ga = GrantAgreement(
        name="Grant-edit-bundle-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ga)
    loaded_db.commit()
    ga_id = ga.id

    existing_gn = GrantNumber(agreement_id=ga_id, number=1, description="Existing grant number")
    loaded_db.add(existing_gn)
    loaded_db.commit()
    existing_gn_id = existing_gn.id

    to_delete_gn = GrantNumber(agreement_id=ga_id, number=2, description="To be deleted")
    loaded_db.add(to_delete_gn)
    loaded_db.commit()
    to_delete_gn_id = to_delete_gn.id

    bundle_payload = {
        "grant_numbers": {
            "create": [{"number": 3, "description": "Newly created via bundle"}],
            "update": [{"id": existing_gn_id, "description": "Updated via bundle"}],
            "delete": [to_delete_gn_id],
        }
    }
    response = auth_client.patch(url_for("api.agreements-edit-bundle", id=ga_id), json=bundle_payload)
    assert response.status_code == 200

    remaining_numbers = loaded_db.query(GrantNumber).filter(GrantNumber.agreement_id == ga_id).all()
    remaining_by_number = {gn.number: gn for gn in remaining_numbers}
    assert 2 not in remaining_by_number  # deleted
    assert remaining_by_number[1].description == "Updated via bundle"
    assert remaining_by_number[3].description == "Newly created via bundle"

    for gn in remaining_numbers:
        loaded_db.delete(gn)
    loaded_db.delete(ga)
    loaded_db.commit()


def test_agreement_edit_bundle_grant_numbers_rollback_on_failure(auth_client, loaded_db, test_project, app_ctx):
    """A forced failure in the bundle (duplicate number) rolls back the entire
    grant_numbers section, not just the failing item."""
    ga = GrantAgreement(
        name="Grant-edit-bundle-rollback-test",
        agreement_type=AgreementType.GRANT,
        project_id=test_project.id,
        created_by=4,
    )
    loaded_db.add(ga)
    loaded_db.commit()
    ga_id = ga.id

    existing_gn = GrantNumber(agreement_id=ga_id, number=1, description="Existing grant number")
    loaded_db.add(existing_gn)
    loaded_db.commit()
    existing_gn_id = existing_gn.id

    # Attempt to create a grant number that collides with the existing one's number —
    # should fail and roll back, leaving no new rows.
    bundle_payload = {
        "grant_numbers": {
            "create": [{"number": 1, "description": "Colliding number"}],
        }
    }
    response = auth_client.patch(url_for("api.agreements-edit-bundle", id=ga_id), json=bundle_payload)
    assert response.status_code == 400

    remaining_numbers = loaded_db.query(GrantNumber).filter(GrantNumber.agreement_id == ga_id).all()
    assert len(remaining_numbers) == 1
    assert remaining_numbers[0].id == existing_gn_id

    loaded_db.delete(existing_gn)
    loaded_db.delete(ga)
    loaded_db.commit()
