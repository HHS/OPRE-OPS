from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import marshmallow_dataclass as mmdc
from flask import Response
from flask.views import MethodView
from marshmallow import fields
from marshmallow_enum import EnumField

from models.base import BaseModel
from models.workflows import (
    WorkflowAction,
    WorkflowInstance,
    WorkflowStepDependency,
    WorkflowStepStatus,
    WorkflowTriggerType,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.resources.workflow_step_instance import WorkflowStepInstanceResponse

ENDPOINT_STRING = "/workflow-instance"


@dataclass
class WorkflowInstanceResponse:
    id: int
    associated_id: Optional[int] = None
    associated_type: Optional[WorkflowTriggerType] = EnumField(WorkflowTriggerType)
    workflow_template_id: Optional[int] = None
    steps: Optional[list[WorkflowStepInstanceResponse]] = fields.List(
        fields.Nested(WorkflowStepInstanceResponse), default=[]
    )
    workflow_action: Optional[WorkflowAction] = EnumField(WorkflowAction)
    current_workflow_step_instance_id: Optional[int] = None
    workflow_status: Optional[WorkflowStepStatus] = EnumField(WorkflowStepStatus)
    created_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None
    package_entities: Optional[list[int]] = None


# Workflows Metadata Endpoings
class WorkflowTriggerTypeListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        reasons = [item.name for item in WorkflowTriggerType]
        return reasons


class WorkflowActionListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        reasons = [item.name for item in WorkflowAction]
        return reasons


class WorkflowStatusListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        reasons = [item.name for item in WorkflowStepStatus]
        return reasons


class WorkflowStepDependencyListAPI(MethodView):
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        reasons = [item.name for item in WorkflowStepDependency]
        return reasons


# Workflows Endpoints
class WorkflowInstanceItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = WorkflowInstance):
        super().__init__(model)
        # self._response_schema = desert.schema(WorkflowInstanceResponse)
        self._response_schema = mmdc.class_schema(WorkflowInstanceResponse)()

    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class WorkflowInstanceListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = WorkflowInstance):
        super().__init__(model)
        # self._post_schema = desert.schema(RequestBody) # TODO implement
        # self._response_schema = desert.schema(WorkflowInstanceResponse)
        self._response_schema = mmdc.class_schema(WorkflowInstanceResponse)()

    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    def get(self) -> Response:
        return super().get()
