from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import marshmallow_dataclass as mmdc
from flask import Response

# from models import OpsEventType
from models.base import BaseModel
from models.workflows import (
    AcquisitionPlanning,
    Award,
    Evaluation,
    PreAward,
    PreSolicitation,
    ProcurementStep,
    Solicitation,
)
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized

# from ops_api.ops.utils.events import OpsEventHandler
from typing_extensions import override

PROCUREMENT_ACQUISITIONS_ENDPOINT_STRING = "/procurement-acquisitions/"


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
class AcquisitionPlanningResponse:
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
    def __init__(self, model: BaseModel = AcquisitionPlanning):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AcquisitionPlanningResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class AcquisitionListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = AcquisitionPlanning):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AcquisitionPlanningResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()

    # @override
    # @is_authorized(PermissionType.POST, Permission.WORKFLOW)
    # @handle_api_error
    # def post(self) -> Response:
    #     message_prefix = f"POST to {PROCUREMENT_ACQUISITIONS_ENDPOINT_STRING}"
    #     with OpsEventHandler(OpsEventType.CREATE_PROCUREMENT_ACQUISITION) as meta:
    #         self._post_schema.context["method"] = "POST"
    #
    #         data = self._post_schema.dump(self._post_schema.load(request.json))
    #         data["period_start"] = date.fromisoformat(data["period_start"]) if data.get("period_start") else None
    #         data["period_end"] = date.fromisoformat(data["period_end"]) if data.get("period_end") else None
    #
    #         new_sc = ServicesComponent(**data)
    #
    #         token = verify_jwt_in_request()
    #         user = get_user_from_token(token[1])
    #         new_sc.created_by = user.id
    #
    #         current_app.db_session.add(new_sc)
    #         current_app.db_session.commit()
    #
    #         new_sc_dict = self._response_schema.dump(new_sc)
    #         meta.metadata.update({"new_sc": new_sc_dict})
    #         current_app.logger.info(f"{message_prefix}: New BLI created: {new_sc_dict}")
    #
    #         return make_response_with_headers(new_sc_dict, 201)


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
