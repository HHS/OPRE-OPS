import pytest
from flask import url_for
from models.workflows import AcquisitionPlanning, PreSolicitation

# from ops_api.ops.utils.procurement_workflow_helper import create_procurement_workflow


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
def test_procurement_workflow(auth_client, loaded_db):
    # create workflow instance with what workflow template?
    pass


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
    import json

    print(json.dumps(response.json, indent=2))
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-acquisition-planning-item", id=acquisition_planning.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 5


# STEP 2: PreSolicitation


def create_test_pre_solicitation(loaded_db):
    # test_procurement_workflow_instance, acquisition_workflow_step_instance = create_procurement_workflow(1)
    acquisition_planning = PreSolicitation()
    acquisition_planning.agreement_id = 1
    # acquisition_planning.workflow_step_id = acquisition_workflow_step_instance.id
    loaded_db.add(acquisition_planning)
    loaded_db.commit()
    assert acquisition_planning.id is not None
    return acquisition_planning


@pytest.mark.usefixtures("app_ctx")
def test_pre_solicitation_get_by_id(auth_client, loaded_db):
    pre_solicitation = create_test_pre_solicitation(loaded_db)

    response = auth_client.get(url_for("api.procurement-pre-solicitation-item", id=pre_solicitation.id))
    assert response.status_code == 200
    import json

    print(json.dumps(response.json, indent=2))
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

    patch_data = {"actual_date": "2024-10-15", "is_complete": True, "completed_by": 5}
    response = auth_client.patch(
        url_for("api.procurement-pre-solicitation-item", id=pre_solicitation.id), json=patch_data
    )
    assert response.status_code == 200
    resp_json = response.json
    import json

    print(json.dumps(response.json, indent=2))
    assert "id" in resp_json

    response = auth_client.get(url_for("api.procurement-pre-solicitation-item", id=pre_solicitation.id))
    resp_json = response.json
    assert resp_json["agreement_id"] == 1
    assert resp_json["actual_date"] == "2024-10-15"
    assert resp_json["is_complete"]
    assert resp_json["completed_by"] == 5
