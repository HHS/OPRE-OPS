import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import current_user, get_jwt_identity
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from models import Agreement, OpsEventType
from models.base import BaseModel
from models.procurement_tracker import (
    AcquisitionPlanning,
    Award,
    Evaluation,
    PreAward,
    PreSolicitation,
    ProcurementStep,
    Solicitation,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.procurement_steps import (
    AcquisitionPlanningRequest,
    AcquisitionPlanningResponse,
    AwardRequest,
    AwardResponse,
    EvaluationRequest,
    EvaluationResponse,
    PreAwardRequest,
    PreAwardResponse,
    PreSolicitationRequest,
    PreSolicitationResponse,
    ProcurementStepListQuery,
    ProcurementStepRequest,
    ProcurementStepResponse,
    SolicitationRequest,
    SolicitationResponse,
)
from ops_api.ops.utils.api_helpers import (
    convert_date_strings_to_dates,
    get_change_data,
    update_and_commit_model_instance,
)
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


def get_current_user_id():
    return current_user.id


# Base Procurement Step APIs


class BaseProcurementStepListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        self._request_schema = mmdc.class_schema(ProcurementStepListQuery)()
        self._response_schema_collection = mmdc.class_schema(ProcurementStepResponse)(many=True)

    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    def get(self) -> Response:
        data = self._request_schema.dump(self._request_schema.load(request.args))

        stmt = select(self.model)
        if data.get("agreement_id"):
            stmt = stmt.where(self.model.agreement_id == data.get("agreement_id"))

        result = current_app.db_session.execute(stmt).all()
        response = make_response_with_headers(self._response_schema_collection.dump([sc[0] for sc in result]))

        return response


class BaseProcurementStepItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ProcurementStepResponse)()

    # Can this be moved to super like this where it uses the schema if it's there?
    def _get_item_with_try(self, id: int) -> Response:
        try:
            item = self._get_item(id)
            if item:
                resp_schema = getattr(self, "_response_schema", None)
                resp_dict = resp_schema.dump(item) if resp_schema else item.to_dict()
                response = make_response_with_headers(resp_dict)
            else:
                response = make_response_with_headers({}, 404)
        except SQLAlchemyError as se:
            current_app.logger.error(se)
            response = make_response_with_headers({}, 500)

        return response

    @is_authorized(PermissionType.GET, Permission.WORKFLOW)
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class EditableProcurementStepItemAPI(BaseProcurementStepItemAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ProcurementStepResponse)()
        self._patch_schema = mmdc.class_schema(ProcurementStepRequest)(dump_only=["type"])

    def step_associated_with_agreement(self, id: int, permission_type: PermissionType) -> bool:
        jwt_identity = get_jwt_identity()
        step: ProcurementStep = current_app.db_session.get(ProcurementStep, id)
        try:
            # should there be a step.agreement ?
            agreement_id = step.agreement_id
            agreement: Agreement = current_app.db_session.get(Agreement, agreement_id)
        except AttributeError as e:
            # No step found in the DB. Erroring out.
            raise ExtraCheckError({}) from e

        if agreement is None:
            # We are faking a validation check at this point. We know there is no agreement associated with the SC.
            # This is made to emulate the validation check from a marshmallow schema.
            if permission_type == PermissionType.PUT:
                raise ExtraCheckError(
                    {
                        "_schema": ["ProcurementStep must have an Agreement"],
                        "contract_agreement_id": ["Missing data for required field."],
                    }
                )
            elif permission_type == PermissionType.PATCH:
                raise ExtraCheckError({"_schema": ["ProcurementStep must have an Agreement"]})
            else:
                raise ExtraCheckError({})

        oidc_ids = set()
        if agreement.created_by_user:
            oidc_ids.add(str(agreement.created_by_user.oidc_id))
        if agreement.project_officer:
            oidc_ids.add(str(agreement.project_officer.oidc_id))
        oidc_ids |= set(str(tm.oidc_id) for tm in agreement.team_members)

        ret = jwt_identity in oidc_ids

        return ret

    def _update(self, id, method, schema) -> Response:
        message_prefix = f"{request.method} to {request.path}"
        with OpsEventHandler(OpsEventType.UPDATE_PROCUREMENT_ACQUISITION_PLANNING) as meta:
            old_instance = self._get_item(id)
            if not old_instance:
                raise ValueError(f"Invalid {self.model.__name__} id: {id}.")
            schema.context["id"] = id
            schema.context["method"] = method
            data = get_change_data(request.json, old_instance, schema, ["id", "type", "agreement_id"])
            data = convert_date_strings_to_dates(data)
            updated_instance = update_and_commit_model_instance(old_instance, data)
            resp_dict = self._response_schema.dump(updated_instance)
            meta.metadata.update({self.model.__name__: resp_dict})
            current_app.logger.info(f"{message_prefix}: Updated {self.model.__name__}: {resp_dict}")
            resp_dict = {"message": f"{self.model.__name__} updated", "id": id}
            return make_response_with_headers(resp_dict, 200)

    @is_authorized(
        PermissionType.PATCH,
        Permission.WORKFLOW,
    )
    def patch(self, id: int) -> Response:
        if not self.step_associated_with_agreement(id, PermissionType.PATCH):
            return make_response_with_headers({}, 403)
        return self._update(id, "PATCH", self._patch_schema)


# Generic Procurement Step Endpoints


class ProcurementStepListAPI(BaseProcurementStepListAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        # self._response_schema = mmdc.class_schema(ProcurementStepResponse)()
        self._response_schema = None  # just using to_dict


class ProcurementStepItemAPI(BaseProcurementStepItemAPI):
    def __init__(self, model: BaseModel = ProcurementStep):
        super().__init__(model)
        # self._response_schema = mmdc.class_schema(ProcurementStepResponse)()
        self._response_schema = None  # just using to_dict


# Acquisition Planning Endpoint


class AcquisitionPlanningItemAPI(EditableProcurementStepItemAPI):
    def __init__(self, model: BaseModel = AcquisitionPlanning):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AcquisitionPlanningResponse)()
        self._patch_schema = mmdc.class_schema(AcquisitionPlanningRequest)(dump_only=["type"])


# Pre-Solicitation Endpoint


class PreSolicitationItemAPI(EditableProcurementStepItemAPI):
    def __init__(self, model: BaseModel = PreSolicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreSolicitationResponse)()
        self._patch_schema = mmdc.class_schema(PreSolicitationRequest)(dump_only=["type"])


# Solicitation Endpoint


class SolicitationItemAPI(EditableProcurementStepItemAPI):
    def __init__(self, model: BaseModel = Solicitation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(SolicitationResponse)()
        self._patch_schema = mmdc.class_schema(SolicitationRequest)(dump_only=["type"])


# Evaluation Endpoint


class EvaluationItemAPI(EditableProcurementStepItemAPI):
    def __init__(self, model: BaseModel = Evaluation):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(EvaluationResponse)()
        self._patch_schema = mmdc.class_schema(EvaluationRequest)(dump_only=["type"])


# Pre-Award Endpoint


class PreAwardItemAPI(EditableProcurementStepItemAPI):
    def __init__(self, model: BaseModel = PreAward):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(PreAwardResponse)()
        self._patch_schema = mmdc.class_schema(PreAwardRequest)(dump_only=["type"])


# Award Endpoint


class AwardItemAPI(EditableProcurementStepItemAPI):
    def __init__(self, model: BaseModel = Award):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(AwardResponse)()
        self._patch_schema = mmdc.class_schema(AwardRequest)(dump_only=["type"])
