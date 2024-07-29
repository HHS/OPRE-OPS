import pytest
from flask import url_for

from models.procurement_tracker import AcquisitionPlanning, Award, Evaluation, PreAward, PreSolicitation, Solicitation

TEST_AGREEMENT_ID = 1
TEST_AGREEMENT_ID2 = 2
TEST_CREATED_BY = 502


@pytest.fixture()
def test_acquisition_planning(app, loaded_db):
    # Needed to set the new user's created_by and updated_by fields
    app.config["SKIP_SETTING_CREATED_BY"] = True

    acquisition_planning = AcquisitionPlanning()
    acquisition_planning.agreement_id = TEST_AGREEMENT_ID
    acquisition_planning.created_by = TEST_CREATED_BY
    loaded_db.add(acquisition_planning)
    loaded_db.commit()

    yield acquisition_planning

    loaded_db.delete(acquisition_planning)
    loaded_db.commit()


@pytest.fixture()
def test_pre_solicitation(app, loaded_db):
    # Needed to set the new user's created_by and updated_by fields
    app.config["SKIP_SETTING_CREATED_BY"] = True

    pre_solicitation = PreSolicitation()
    pre_solicitation.agreement_id = TEST_AGREEMENT_ID
    pre_solicitation.created_by = TEST_CREATED_BY
    loaded_db.add(pre_solicitation)
    loaded_db.commit()

    yield pre_solicitation

    loaded_db.delete(pre_solicitation)
    loaded_db.commit()


@pytest.fixture()
def test_solicitation(app, loaded_db):
    # Needed to set the new user's created_by and updated_by fields
    app.config["SKIP_SETTING_CREATED_BY"] = True

    solicitation = Solicitation()
    solicitation.agreement_id = TEST_AGREEMENT_ID
    solicitation.created_by = TEST_CREATED_BY

    loaded_db.add(solicitation)
    loaded_db.commit()

    yield solicitation

    loaded_db.delete(solicitation)
    loaded_db.commit()


@pytest.fixture()
def test_evaluation(app, loaded_db):
    # Needed to set the new user's created_by and updated_by fields
    app.config["SKIP_SETTING_CREATED_BY"] = True

    evaluation = Evaluation()
    evaluation.agreement_id = TEST_AGREEMENT_ID
    evaluation.created_by = TEST_CREATED_BY

    loaded_db.add(evaluation)
    loaded_db.commit()

    yield evaluation

    loaded_db.delete(evaluation)
    loaded_db.commit()


@pytest.fixture()
def test_pre_award(app, loaded_db):
    # Needed to set the new user's created_by and updated_by fields
    app.config["SKIP_SETTING_CREATED_BY"] = True

    pre_award = PreAward()
    pre_award.agreement_id = TEST_AGREEMENT_ID
    pre_award.created_by = TEST_CREATED_BY

    loaded_db.add(pre_award)
    loaded_db.commit()

    yield pre_award

    loaded_db.delete(pre_award)
    loaded_db.commit()


@pytest.fixture()
def test_award(app, loaded_db):
    # Needed to set the new user's created_by and updated_by fields
    app.config["SKIP_SETTING_CREATED_BY"] = True

    award = Award()
    award.agreement_id = TEST_AGREEMENT_ID
    award.created_by = TEST_CREATED_BY

    loaded_db.add(award)
    loaded_db.commit()

    yield award

    loaded_db.delete(award)
    loaded_db.commit()


#  Procurement Step List of all types with query by agreement_id
@pytest.mark.usefixtures("app_ctx")
def test_procurement_step_get_list(auth_client, loaded_db, test_acquisition_planning, test_pre_solicitation):
    # create another step with a different agreement ID
    solicitation = Solicitation()
    solicitation.agreement_id = TEST_AGREEMENT_ID2
    solicitation.created_by = TEST_CREATED_BY
    loaded_db.add(solicitation)
    loaded_db.commit()

    response = auth_client.get(url_for("api.procurement-step-group"))
    assert response.status_code == 200
    assert len(response.json) == 3

    response = auth_client.get(url_for("api.procurement-step-group"), query_string={"agreement_id": "1"})
    assert response.status_code == 200
    assert len(response.json) == 2

    loaded_db.delete(solicitation)
    loaded_db.commit()


# STEP 1 : AcquisitionPlanning


@pytest.mark.usefixtures("app_ctx")
def test_acquisition_planning_get_by_id(auth_client, loaded_db, test_acquisition_planning):
    response = auth_client.get(url_for("api.procurement-acquisition-planning-item", id=test_acquisition_planning.id))
    assert response.status_code == 200
    import json

    print(json.dumps(response.json, indent=2))
    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by",
        "created_on",
        "display_name",
        "is_complete",
        "notes",
        "type",
        "updated_on",
        "workflow_step_id",
    ]
    for key in keys:
        assert key in resp_json
        if key in [
            "id",
            "agreement_id",
            "created_by",
            "created_on",
            "display_name",
            "type",
            "updated_on",
        ]:
            assert resp_json[key]
        else:
            assert not resp_json[key]
    assert resp_json["type"] == "procurement_acquisition_planning"


@pytest.mark.usefixtures("app_ctx")
def test_acquisition_planning_patch_by_id(auth_client, loaded_db, test_acquisition_planning):
    assert test_acquisition_planning.id is not None

    patch_data = {"actual_date": "2024-10-15", "is_complete": True, "completed_by": 504}
    response = auth_client.patch(
        url_for("api.procurement-acquisition-planning-item", id=test_acquisition_planning.id),
        json=patch_data,
    )
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-acquisition-planning-item", id=test_acquisition_planning.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 504


# STEP 2: PreSolicitation


@pytest.mark.usefixtures("app_ctx")
def test_pre_solicitation_get_by_id(auth_client, loaded_db, test_pre_solicitation):
    response = auth_client.get(url_for("api.procurement-pre-solicitation-item", id=test_pre_solicitation.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by",
        "display_name",
        "is_complete",
        "notes",
        "target_date",
        "type",
        "updated_on",
        "workflow_step_id",
    ]
    for key in keys:
        assert key in resp_json
        if key in [
            "id",
            "agreement_id",
            "created_by",
            "display_name",
            "type",
            "updated_on",
        ]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_pre_solicitation"


@pytest.mark.usefixtures("app_ctx")
def test_pre_solicitation_patch_by_id(auth_client, loaded_db, test_pre_solicitation):
    assert test_pre_solicitation.id is not None

    patch_data = {
        "target_date": "2024-10-01",
        "actual_date": "2024-10-15",
        "is_complete": True,
        "completed_by": 504,
    }
    response = auth_client.patch(
        url_for("api.procurement-pre-solicitation-item", id=test_pre_solicitation.id),
        json=patch_data,
    )
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-pre-solicitation-item", id=test_pre_solicitation.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["target_date"] == "2024-10-01"
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 504


# STEP 3: Solicitation


@pytest.mark.usefixtures("app_ctx")
def test_solicitation_get_by_id(auth_client, loaded_db, test_solicitation):
    response = auth_client.get(url_for("api.procurement-solicitation-item", id=test_solicitation.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by",
        "display_name",
        "is_complete",
        "notes",
        "target_date",
        "type",
        "updated_on",
        "workflow_step_id",
    ]
    for key in keys:
        assert key in resp_json
        if key in [
            "id",
            "agreement_id",
            "created_by",
            "display_name",
            "type",
            "updated_on",
        ]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_solicitation"


@pytest.mark.usefixtures("app_ctx")
def test_solicitation_patch_by_id(auth_client, loaded_db, test_solicitation):
    assert test_solicitation.id is not None

    patch_data = {
        "target_date": "2024-10-01",
        "actual_date": "2024-10-15",
        "is_complete": True,
        "completed_by": 504,
    }
    response = auth_client.patch(
        url_for("api.procurement-solicitation-item", id=test_solicitation.id),
        json=patch_data,
    )
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-solicitation-item", id=test_solicitation.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["target_date"] == "2024-10-01"
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 504


# STEP 4: Evaluation


@pytest.mark.usefixtures("app_ctx")
def test_evaluation_get_by_id(auth_client, loaded_db, test_evaluation):
    response = auth_client.get(url_for("api.procurement-evaluation-item", id=test_evaluation.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by",
        "display_name",
        "is_complete",
        "notes",
        "target_date",
        "type",
        "updated_on",
        "workflow_step_id",
    ]
    for key in keys:
        assert key in resp_json
        if key in [
            "id",
            "agreement_id",
            "created_by",
            "display_name",
            "type",
            "updated_on",
        ]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_evaluation"


@pytest.mark.usefixtures("app_ctx")
def test_evaluation_patch_by_id(auth_client, loaded_db, test_evaluation):
    assert test_evaluation.id is not None

    patch_data = {
        "target_date": "2024-10-01",
        "actual_date": "2024-10-15",
        "is_complete": True,
        "completed_by": 504,
    }
    response = auth_client.patch(
        url_for("api.procurement-evaluation-item", id=test_evaluation.id),
        json=patch_data,
    )
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-evaluation-item", id=test_evaluation.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["target_date"] == "2024-10-01"
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 504


# STEP 5: PreAward


@pytest.mark.usefixtures("app_ctx")
def test_pre_award_get_by_id(auth_client, loaded_db, test_pre_award):
    response = auth_client.get(url_for("api.procurement-pre-award-item", id=test_pre_award.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by",
        "display_name",
        "is_complete",
        "notes",
        "target_date",
        "type",
        "updated_on",
        "workflow_step_id",
    ]
    for key in keys:
        assert key in resp_json
        if key in [
            "id",
            "agreement_id",
            "created_by",
            "display_name",
            "type",
            "updated_on",
        ]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_preaward"


@pytest.mark.usefixtures("app_ctx")
def test_pre_award_patch_by_id(auth_client, loaded_db, test_pre_award):
    patch_data = {
        "target_date": "2024-10-01",
        "actual_date": "2024-10-15",
        "is_complete": True,
        "completed_by": 504,
    }
    response = auth_client.patch(url_for("api.procurement-pre-award-item", id=test_pre_award.id), json=patch_data)
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-pre-award-item", id=test_pre_award.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["target_date"] == "2024-10-01"
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 504


# STEP 6: Award


@pytest.mark.usefixtures("app_ctx")
def test_award_get_by_id(auth_client, loaded_db, test_award):
    response = auth_client.get(url_for("api.procurement-award-item", id=test_award.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by",
        "display_name",
        "financial_number",
        "is_complete",
        "notes",
        "type",
        "updated_on",
        "vendor",
        "vendor_type",
        "workflow_step_id",
    ]
    for key in keys:
        assert key in resp_json
        if key in [
            "id",
            "agreement_id",
            "created_by",
            "display_name",
            "type",
            "updated_on",
        ]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_award"


@pytest.mark.usefixtures("app_ctx")
def test_award_patch_by_id(auth_client, loaded_db, test_award):
    assert test_award.id is not None

    patch_data = {
        "actual_date": "2024-10-15",
        "is_complete": True,
        "completed_by": 504,
        "vendor": "Test Vendor",
        "vendor_type": "Test Vendor Type",
        "financial_number": "Test Financial Number",
    }
    response = auth_client.patch(url_for("api.procurement-award-item", id=test_award.id), json=patch_data)
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-award-item", id=test_award.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 504
    assert resp_json["vendor"] == "Test Vendor"
    assert resp_json["vendor_type"] == "Test Vendor Type"
    assert resp_json["financial_number"] == "Test Financial Number"
