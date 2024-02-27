from datetime import date

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import verify_jwt_in_request
from models import OpsEventType
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
from ops_api.ops.schemas.procurement_steps import (
    AcquisitionPlanningRequest,
    AcquisitionPlanningRequestPost,
    AcquisitionPlanningResponse,
    AwardRequest,
    AwardResponse,
    EvaluationRequest,
    EvaluationResponse,
    PreAwardRequest,
    PreAwardResponse,
    PreSolicitationRequest,
    PreSolicitationResponse,
    ProcurementStepRequest,
    ProcurementStepResponse,
    SolicitationRequest,
    SolicitationResponse,
)
from ops_api.ops.utils.api_helpers import get_change_data, update_and_commit_model_instance
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import SQLAlchemyError
from typing_extensions import override


class BaseProcurementStepItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ProcurementStepResponse)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


def get_current_user_id():
    token = verify_jwt_in_request()
    user = get_user_from_token(token[1])
    return user.id


# Procurement Step (Base) Endpoint


class ProcurementStepListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ProcurementStepResponse)()

    def _get_item_with_try(self, id: int) -> Response:
        try:
            item = self._get_item(id)

            if item:
                response = make_response_with_headers(self._response_schema.dump(item))
            else:
                response = make_response_with_headers({}, 404)
        except SQLAlchemyError as se:
            current_app.logger.error(se)
            response = make_response_with_headers({}, 500)

        return response

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


class ProcurementStepItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ProcurementStepResponse)()
        self._patch_schema = mmdc.class_schema(ProcurementStepRequest)(dump_only=["type"])

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)

    def _update(self, id, method, schema) -> Response:
        message_prefix = f"{request.method} to {request.path}"

        with OpsEventHandler(OpsEventType.UPDATE_PROCUREMENT_ACQUISITION_PLANNING) as meta:
            old_instance = self._get_item(id)
            if not old_instance:
                raise ValueError(f"Invalid {self.model.__name__} id: {id}.")
            schema.context["id"] = id
            schema.context["method"] = method
            data = get_change_data(request.json, old_instance, schema, ["id", "type", "agreement_id"])
            for k in ["actual_date", "target_date"]:
                if k in data and data[k] is not None:
                    data[k] = date.fromisoformat(data[k])

            updated_instance = update_and_commit_model_instance(old_instance, data)
            resp_dict = self._response_schema.dump(updated_instance)
            meta.metadata.update({self.model.__name__: resp_dict})
            current_app.logger.info(f"{message_prefix}: Updated {self.model.__name__}: {resp_dict}")
            resp_dict = {"message": f"{self.model.__name__} updated", "id": id}
            return make_response_with_headers(resp_dict, 200)

    @is_authorized(
        PermissionType.PATCH,
        Permission.WORKFLOW,
        # TODO: extra check?
        # extra_check=partial(sc_associated_with_contract_agreement, permission_type=PermissionType.PATCH),
        # groups=["Budget Team", "Admins"],
    )
    @handle_api_error
    def patch(self, id: int) -> Response:
        return self._update(id, "PATCH", self._patch_schema)


# Acquisition Planning Endpoints


class AcquisitionPlanningListAPI(ProcurementStepListAPI):
    def __init__(self, model: BaseModel = AcquisitionPlanning):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AcquisitionPlanningResponse)()
        self._post_schema = mmdc.class_schema(AcquisitionPlanningRequestPost)(exclude=["type"])

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()


class AcquisitionPlanningItemAPI(ProcurementStepItemAPI):
    def __init__(self, model: BaseModel = AcquisitionPlanning):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AcquisitionPlanningResponse)()
        self._patch_schema = mmdc.class_schema(AcquisitionPlanningRequest)(dump_only=["type"])


# Pre-Solicitation Endpoints


class PreSolicitationListAPI(ProcurementStepListAPI):
    def __init__(self, model: BaseModel = PreSolicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreSolicitationResponse)()


class PreSolicitationItemAPI(ProcurementStepItemAPI):
    def __init__(self, model: BaseModel = PreSolicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreSolicitationResponse)()
        self._patch_schema = mmdc.class_schema(PreSolicitationRequest)(dump_only=["type"])


# Solicitation Endpoints


class SolicitationListAPI(ProcurementStepListAPI):
    def __init__(self, model: BaseModel = Solicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(SolicitationResponse)()


class SolicitationItemAPI(ProcurementStepItemAPI):
    def __init__(self, model: BaseModel = Solicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(SolicitationResponse)()
        self._patch_schema = mmdc.class_schema(SolicitationRequest)(dump_only=["type"])


# Evaluation Endpoints


class EvaluationListAPI(ProcurementStepListAPI):
    def __init__(self, model: BaseModel = Evaluation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(EvaluationResponse)()


class EvaluationItemAPI(ProcurementStepItemAPI):
    def __init__(self, model: BaseModel = Evaluation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(EvaluationResponse)()
        self._patch_schema = mmdc.class_schema(EvaluationRequest)(dump_only=["type"])


# Pre-Award Endpoints


class PreAwardListAPI(ProcurementStepListAPI):
    def __init__(self, model: BaseModel = PreAward):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreAwardResponse)()


class PreAwardItemAPI(ProcurementStepItemAPI):
    def __init__(self, model: BaseModel = PreAward):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreAwardResponse)()
        self._patch_schema = mmdc.class_schema(PreAwardRequest)(dump_only=["type"])


# Award Endpoints


class AwardListAPI(ProcurementStepListAPI):
    def __init__(self, model: BaseModel = Award):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreAwardResponse)()


class AwardItemAPI(ProcurementStepItemAPI):
    def __init__(self, model: BaseModel = Award):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AwardResponse)()
        self._patch_schema = mmdc.class_schema(AwardRequest)(dump_only=["type"])
