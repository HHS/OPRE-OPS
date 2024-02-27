import pytest
from flask import url_for
from models.workflows import AcquisitionPlanning, Award, Evaluation, PreAward, PreSolicitation, Solicitation

# STEP 1 : AcquisitionPlanning


def create_test_acquisition_planning(loaded_db):
    # test_procurement_workflow_instance, acquisition_workflow_step_instance = create_procurement_workflow(1)
    acquisition_planning = AcquisitionPlanning()
    acquisition_planning.agreement_id = 1
    # acquisition_planning.workflow_step_id = acquisition_workflow_step_instance.id
    loaded_db.add(acquisition_planning)
    loaded_db.commit()
    assert acquisition_planning.id is not None
    return acquisition_planning


@pytest.mark.usefixtures("app_ctx")
def test_acquisition_planning_get_list(auth_client, loaded_db):
    create_test_acquisition_planning(loaded_db)
    response = auth_client.get(url_for("api.procurement-acquisition-planning-group"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["type"] == "procurement_acquisition_planning"


@pytest.mark.usefixtures("app_ctx")
def test_acquisition_planning_get_by_id(auth_client, loaded_db):
    acquisition_planning = create_test_acquisition_planning(loaded_db)

    response = auth_client.get(url_for("api.procurement-acquisition-planning-item", id=acquisition_planning.id))
    assert response.status_code == 200
    # import json
    #
    # print(json.dumps(response.json, indent=2))
    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by_user",
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
        # if key in ["id", "agreement_id", "created_by_user", "created_on", "display_name", "type", "updated_on"]:
        if key in ["id", "agreement_id", "created_on", "display_name", "type", "updated_on"]:
            assert resp_json[key]
        else:
            assert not resp_json[key]
    assert resp_json["type"] == "procurement_acquisition_planning"


@pytest.mark.usefixtures("app_ctx")
def test_acquisition_planning_patch_by_id(auth_client, loaded_db):
    # test_procurement_workflow_instance, acquisition_workflow_step_instance = create_procurement_workflow(1)
    acquisition_planning = AcquisitionPlanning()
    acquisition_planning.agreement_id = 1
    # acquisition_planning.workflow_step_id = acquisition_workflow_step_instance.id
    loaded_db.add(acquisition_planning)
    loaded_db.commit()
    assert acquisition_planning.id is not None

    # acquisition_planning = create_test_acquisition_planning(loaded_db)
    patch_data = {"actual_date": "2024-10-15", "is_complete": True, "completed_by": 5}
    response = auth_client.patch(
        url_for("api.procurement-acquisition-planning-item", id=acquisition_planning.id), json=patch_data
    )
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-acquisition-planning-item", id=acquisition_planning.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 5


# STEP 2: PreSolicitation


def create_test_pre_solicitation(loaded_db):
    pre_solicitation = PreSolicitation()
    pre_solicitation.agreement_id = 1
    loaded_db.add(pre_solicitation)
    loaded_db.commit()
    assert pre_solicitation.id is not None
    return pre_solicitation


@pytest.mark.usefixtures("app_ctx")
def test_pre_solicitation_get_list(auth_client, loaded_db):
    create_test_pre_solicitation(loaded_db)
    response = auth_client.get(url_for("api.procurement-pre-solicitation-group"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["type"] == "procurement_pre_solicitation"


@pytest.mark.usefixtures("app_ctx")
def test_pre_solicitation_get_by_id(auth_client, loaded_db):
    pre_solicitation = create_test_pre_solicitation(loaded_db)

    response = auth_client.get(url_for("api.procurement-pre-solicitation-item", id=pre_solicitation.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by_user",
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
        # if key in ["id", "agreement_id", "created_by_user", "display_name", "type", "updated_on"]:
        if key in ["id", "agreement_id", "display_name", "type", "updated_on"]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_pre_solicitation"


@pytest.mark.usefixtures("app_ctx")
def test_pre_solicitation_patch_by_id(auth_client, loaded_db):
    pre_solicitation = PreSolicitation()
    pre_solicitation.agreement_id = 1
    loaded_db.add(pre_solicitation)
    loaded_db.commit()
    assert pre_solicitation.id is not None

    patch_data = {"target_date": "2024-10-01", "actual_date": "2024-10-15", "is_complete": True, "completed_by": 5}
    response = auth_client.patch(
        url_for("api.procurement-pre-solicitation-item", id=pre_solicitation.id), json=patch_data
    )
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-pre-solicitation-item", id=pre_solicitation.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["target_date"] == "2024-10-01"
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 5


# STEP 3: Solicitation


def create_test_solicitation(loaded_db):
    solicitation = Solicitation()
    solicitation.agreement_id = 1
    loaded_db.add(solicitation)
    loaded_db.commit()
    assert solicitation.id is not None
    return solicitation


@pytest.mark.usefixtures("app_ctx")
def test_solicitation_get_list(auth_client, loaded_db):
    create_test_solicitation(loaded_db)
    response = auth_client.get(url_for("api.procurement-solicitation-group"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["type"] == "procurement_solicitation"


@pytest.mark.usefixtures("app_ctx")
def test_solicitation_get_by_id(auth_client, loaded_db):
    solicitation = create_test_solicitation(loaded_db)

    response = auth_client.get(url_for("api.procurement-solicitation-item", id=solicitation.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by_user",
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
        # if key in ["id", "agreement_id", "created_by_user", "display_name", "type", "updated_on"]:
        if key in ["id", "agreement_id", "display_name", "type", "updated_on"]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_solicitation"


@pytest.mark.usefixtures("app_ctx")
def test_solicitation_patch_by_id(auth_client, loaded_db):
    solicitation = Solicitation()
    solicitation.agreement_id = 1
    loaded_db.add(solicitation)
    loaded_db.commit()
    assert solicitation.id is not None

    patch_data = {"target_date": "2024-10-01", "actual_date": "2024-10-15", "is_complete": True, "completed_by": 5}
    response = auth_client.patch(url_for("api.procurement-solicitation-item", id=solicitation.id), json=patch_data)
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-solicitation-item", id=solicitation.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["target_date"] == "2024-10-01"
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 5


# STEP 4: Evaluation


def create_test_evaluation(loaded_db):
    evaluation = Evaluation()
    evaluation.agreement_id = 1
    loaded_db.add(evaluation)
    loaded_db.commit()
    assert evaluation.id is not None
    return evaluation


@pytest.mark.usefixtures("app_ctx")
def test_evaluation_get_list(auth_client, loaded_db):
    create_test_evaluation(loaded_db)
    response = auth_client.get(url_for("api.procurement-evaluation-group"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["type"] == "procurement_evaluation"


@pytest.mark.usefixtures("app_ctx")
def test_evaluation_get_by_id(auth_client, loaded_db):
    evaluation = create_test_evaluation(loaded_db)

    response = auth_client.get(url_for("api.procurement-evaluation-item", id=evaluation.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by_user",
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
        # if key in ["id", "agreement_id", "created_by_user", "display_name", "type", "updated_on"]:
        if key in ["id", "agreement_id", "display_name", "type", "updated_on"]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_evaluation"


@pytest.mark.usefixtures("app_ctx")
def test_evaluation_patch_by_id(auth_client, loaded_db):
    evaluation = Evaluation()
    evaluation.agreement_id = 1
    loaded_db.add(evaluation)
    loaded_db.commit()
    assert evaluation.id is not None

    patch_data = {"target_date": "2024-10-01", "actual_date": "2024-10-15", "is_complete": True, "completed_by": 5}
    response = auth_client.patch(url_for("api.procurement-evaluation-item", id=evaluation.id), json=patch_data)
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-evaluation-item", id=evaluation.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["target_date"] == "2024-10-01"
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 5


# STEP 5: PreAward


def create_test_pre_award(loaded_db):
    pre_award = PreAward()
    pre_award.agreement_id = 1
    loaded_db.add(pre_award)
    loaded_db.commit()
    assert pre_award.id is not None
    return pre_award


@pytest.mark.usefixtures("app_ctx")
def test_pre_award_get_list(auth_client, loaded_db):
    create_test_pre_award(loaded_db)
    response = auth_client.get(url_for("api.procurement-pre-award-group"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["type"] == "procurement_preaward"


@pytest.mark.usefixtures("app_ctx")
def test_pre_award_get_by_id(auth_client, loaded_db):
    pre_award = create_test_pre_award(loaded_db)

    response = auth_client.get(url_for("api.procurement-pre-award-item", id=pre_award.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by_user",
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
        # if key in ["id", "agreement_id", "created_by_user", "display_name", "type", "updated_on"]:
        if key in ["id", "agreement_id", "display_name", "type", "updated_on"]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_preaward"


@pytest.mark.usefixtures("app_ctx")
def test_pre_award_patch_by_id(auth_client, loaded_db):
    pre_award = PreAward()
    pre_award.agreement_id = 1
    loaded_db.add(pre_award)
    loaded_db.commit()
    assert pre_award.id is not None

    patch_data = {"target_date": "2024-10-01", "actual_date": "2024-10-15", "is_complete": True, "completed_by": 5}
    response = auth_client.patch(url_for("api.procurement-pre-award-item", id=pre_award.id), json=patch_data)
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-pre-award-item", id=pre_award.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["target_date"] == "2024-10-01"
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 5


# STEP 6: Award


def create_test_award(loaded_db):
    award = Award()
    award.agreement_id = 1
    loaded_db.add(award)
    loaded_db.commit()
    assert award.id is not None
    return award


@pytest.mark.usefixtures("app_ctx")
def test_award_get_list(auth_client, loaded_db):
    create_test_award(loaded_db)
    response = auth_client.get(url_for("api.procurement-award-group"))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["type"] == "procurement_award"


@pytest.mark.usefixtures("app_ctx")
def test_award_get_by_id(auth_client, loaded_db):
    award = create_test_award(loaded_db)

    response = auth_client.get(url_for("api.procurement-award-item", id=award.id))
    assert response.status_code == 200

    resp_json = response.json
    keys = [
        "id",
        "agreement_id",
        "completed_by",
        "created_by_user",
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
        # if key in ["id", "agreement_id", "created_by_user", "display_name", "type", "updated_on"]:
        if key in ["id", "agreement_id", "display_name", "type", "updated_on"]:
            assert resp_json[key]
        else:
            assert not resp_json[key]

    assert resp_json["type"] == "procurement_award"


@pytest.mark.usefixtures("app_ctx")
def test_award_patch_by_id(auth_client, loaded_db):
    award = Award()
    award.agreement_id = 1
    loaded_db.add(award)
    loaded_db.commit()
    assert award.id is not None

    patch_data = {
        "actual_date": "2024-10-15",
        "is_complete": True,
        "completed_by": 5,
        "vendor": "Test Vendor",
        "vendor_type": "Test Vendor Type",
        "financial_number": "Test Financial Number",
    }
    response = auth_client.patch(url_for("api.procurement-award-item", id=award.id), json=patch_data)
    assert response.status_code == 200
    resp_json = response.json
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-award-item", id=award.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 5
    assert resp_json["vendor"] == "Test Vendor"
    assert resp_json["vendor_type"] == "Test Vendor Type"
    assert resp_json["financial_number"] == "Test Financial Number"
