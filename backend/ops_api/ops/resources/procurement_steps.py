from datetime import date, datetime

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
    AcquisitionPlanningPatch,
    AcquisitionPlanningPost,
    AcquisitionPlanningResponse,
    AwardResponse,
    EvaluationResponse,
    PreAwardResponse,
    PreSolicitationResponse,
    ProcurementStepResponse,
    SolicitationResponse,
)
from ops_api.ops.utils.api_helpers import get_change_data, update_and_commit_model_instance
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from typing_extensions import override


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
        self._patch_schema = mmdc.class_schema(AcquisitionPlanningPatch)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)

    def _update(self, id, method, schema) -> Response:
        message_prefix = f"{request.method} to {request.path}"
        print(message_prefix)

        with OpsEventHandler(OpsEventType.UPDATE_PROCUREMENT_ACQUISITION_PLANNING) as meta:
            old_acquisition_planning: AcquisitionPlanning = self._get_item(id)
            if not old_acquisition_planning:
                raise ValueError(f"Invalid AcquisitionPlanning id: {id}.")
            schema.context["id"] = id
            schema.context["method"] = method
            print(f"{request.json['actual_date']=}")
            data = get_change_data(request.json, old_acquisition_planning, schema, ["id", "agreement_id"])
            print(f"{data['actual_date']=}")
            data["actual_date"] = (
                datetime.fromisoformat(data["actual_date"].replace("Z", "+00:00")) if data.get("actual_date") else None
            )
            print(f"{data['actual_date']=}")

            acquisition_planning = update_and_commit_model_instance(old_acquisition_planning, data)
            resp_dict = self._response_schema.dump(acquisition_planning)
            import json

            print(json.dumps(resp_dict, indent=2))
            meta.metadata.update({"acquisition_planning": resp_dict})
            current_app.logger.info(f"{message_prefix}: Updated AcquisitionPlanning: {resp_dict}")
            resp_dict = {"id": id, "method": method}
            return make_response_with_headers(resp_dict, 200)

    @override
    @is_authorized(
        PermissionType.PATCH,
        Permission.WORKFLOW,
        # extra_check=partial(sc_associated_with_contract_agreement, permission_type=PermissionType.PATCH),
        # groups=["Budget Team", "Admins"],
    )
    @handle_api_error
    def patch(self, id: int) -> Response:
        return self._update(id, "PATCH", self._patch_schema)


class AcquisitionListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = AcquisitionPlanning):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AcquisitionPlanningResponse)()
        self._post_schema = mmdc.class_schema(AcquisitionPlanningPost)()

    @override
    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    @handle_api_error
    def get(self) -> Response:
        return super().get()

    @override
    @is_authorized(PermissionType.POST, Permission.WORKFLOW)
    @handle_api_error
    def post(self) -> Response:
        message_prefix = f"{request.method} to {request.path}"
        with OpsEventHandler(OpsEventType.CREATE_PROCUREMENT_ACQUISITION_PLANNING) as meta:
            self._post_schema.context["method"] = "POST"

            data = self._post_schema.dump(self._post_schema.load(request.json))
            data["actual_date"] = date.fromisoformat(data["actual_date"]) if data.get("actual_date") else None

            new_sc = AcquisitionPlanning(**data)

            token = verify_jwt_in_request()
            user = get_user_from_token(token[1])
            new_sc.created_by = user.id

            current_app.db_session.add(new_sc)
            current_app.db_session.commit()

            new_sc_dict = self._response_schema.dump(new_sc)
            meta.metadata.update({"new_sc": new_sc_dict})
            current_app.logger.info(f"{message_prefix}: New BLI created: {new_sc_dict}")

            return make_response_with_headers(new_sc_dict, 201)


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
