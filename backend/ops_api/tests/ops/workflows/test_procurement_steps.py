import pytest
from flask import url_for
from models.workflows import AcquisitionPlanning

# from ops_api.ops.utils.procurement_workflow_helper import create_procurement_workflow


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
    # print(json.dumps(response.json, indent=2))


@pytest.mark.usefixtures("app_ctx")
def test_acquisition_planning_post(auth_client, loaded_db):
    # acquisition_planning = create_test_acquisition_planning(loaded_db)
    post_data = {"agreement_id": 1}

    response = auth_client.post(url_for("api.procurement-acquisition-planning-group"), json=post_data)
    assert response.status_code == 201
    resp_json = response.json
    import json

    print(json.dumps(response.json, indent=2))
    assert "id" in resp_json
    assert resp_json["agreement_id"] == 1
    assert not resp_json["is_complete"]
    assert not resp_json["actual_date"]
    assert not resp_json["completed_by"]


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
    assert not resp_json["completed_by"] == 4
