import pytest
from flask import url_for
from models.workflows import AcquisitionPlanning
from ops_api.ops.utils.procurement_workflow_helper import create_procurement_workflow


def create_test_acquisition_planning(loaded_db):
    test_procurement_workflow_instance, acquisition_workflow_step_instance = create_procurement_workflow(1)
    acquisition_planning = AcquisitionPlanning()
    acquisition_planning.agreement_id = 1
    assert acquisition_workflow_step_instance.id
    acquisition_planning.workflow_step_id = acquisition_workflow_step_instance.id
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
    #
    # new_acquisition_planning = loaded_db.get(AcquisitionPlanning, new_acquisition_planning_id)
    # assert new_acquisition_planning.id == new_acquisition_planning_id
    # assert new_acquisition_planning.agreement_id == 1

    response = auth_client.get(url_for("api.procurement-acquisition-item", id=acquisition_planning.id))
    assert response.status_code == 200
    import json

    print(json.dumps(response.json, indent=2))


@pytest.mark.usefixtures("app_ctx")
def test_acquisition_planning_patch_by_id(auth_client, loaded_db):
    test_procurement_workflow_instance, acquisition_workflow_step_instance = create_procurement_workflow(1)
    acquisition_planning = AcquisitionPlanning()
    acquisition_planning.agreement_id = 1
    assert acquisition_workflow_step_instance.id
    acquisition_planning.workflow_step_id = acquisition_workflow_step_instance.id
    loaded_db.add(acquisition_planning)
    loaded_db.commit()
    assert acquisition_planning.id is not None
    new_acquisition_planning_id = acquisition_planning.id

    new_acquisition_planning = loaded_db.get(AcquisitionPlanning, new_acquisition_planning_id)
    assert new_acquisition_planning.id == new_acquisition_planning_id
    assert new_acquisition_planning.agreement_id == 1

    response = auth_client.get(url_for("api.procurement-acquisition-item", id=new_acquisition_planning.id))
    assert response.status_code == 200
    import json

    print(json.dumps(response.json, indent=2))
