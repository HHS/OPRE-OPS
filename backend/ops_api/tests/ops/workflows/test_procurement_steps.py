import pytest
from flask import url_for
from models.workflows import AcquisitionPlanning


@pytest.mark.usefixtures("app_ctx")
def test_procurement_workflow(auth_client, loaded_db):
    # create workflow instance with what workflow template?
    pass


@pytest.mark.usefixtures("app_ctx")
def test_acquisition_planning(auth_client, loaded_db):
    acquisition_planning = AcquisitionPlanning(agreement_id=1)
    loaded_db.add(acquisition_planning)
    loaded_db.commit()
    assert acquisition_planning.id is not None
    new_acquisition_planning_id = acquisition_planning.id

    new_acquisition_planning = loaded_db.get(AcquisitionPlanning, new_acquisition_planning_id)
    assert new_acquisition_planning.id == new_acquisition_planning_id
    assert new_acquisition_planning.agreement_id == 1

    response = auth_client.get(url_for("api.procurement-acquisition-item", id=new_acquisition_planning.id))

    assert response.status_code == 200
    # import json
    # print(json.dumps(response.json, indent=2))
