import json

import pytest
from models import WorkflowTemplate
from ops_api.ops.utils.procurement_workflow_helper import create_procurement_workflow, get_procurement_workflow_template


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_get_procurement_workflow_template(loaded_db):
    template: WorkflowTemplate = get_procurement_workflow_template()
    assert template.name == "Procurement Tracker"


@pytest.mark.usefixtures("app_ctx", "loaded_db")
def test_create_procurement_workflow(loaded_db):
    result = create_procurement_workflow(1)
    print(json.dumps(result, indent=2, default=str))
