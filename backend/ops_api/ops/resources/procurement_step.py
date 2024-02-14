from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import marshmallow_dataclass as mmdc
from flask import Response
from models.base import BaseModel
from models.workflows import (
    AquicsitionPlanning,
    Award,
    Evaluation,
    PreAward,
    PreSolicitation,
    ProcurementStep,
    Solicitation,
)
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from typing_extensions import override


@dataclass
class ProcurementStepResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class AquicsitionPlanningResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class PreSolicitationResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class SolicitationResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class EvaluationResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class PreAwardResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class AwardResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None
    vendor: Optional[str] = None
    vendor_type: Optional[str] = None
    financial_number: Optional[str] = None


# Procurement Step Endpoints
class ProcurementStepItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ProcurementStepResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class ProcurementStepListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ProcurementStepResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


# Acquisition Planning Endpoints
class AcquisitionItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = AquicsitionPlanning):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AquicsitionPlanningResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class AcquisitionListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = AquicsitionPlanning):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AquicsitionPlanningResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


# Pre-Solicitation Endpoints
class PreSolicitationItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = PreSolicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreSolicitationResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class PreSolicitationListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = PreSolicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreSolicitationResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


# Solicitation Endpoints
class SolicitationItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Solicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(SolicitationResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class SolicitationListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Solicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(SolicitationResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


# Evaluation Endpoints
class EvaluationItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Evaluation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(EvaluationResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class EvaluationListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Evaluation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(EvaluationResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


# Pre-Award Endpoints
class PreAwardItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = PreAward):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreAwardResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class PreAwardListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = PreAward):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreAwardResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


# Award Endpoints
class AwardItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Award):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AwardResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class AwardListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Award):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AwardResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()
