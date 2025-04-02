import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from models import OpsEventType, ServicesComponent
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.auth.exceptions import ExtraCheckError
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.services_component import (
    PATCHRequestBody,
    POSTRequestBody,
    QueryParameters,
    ServicesComponentItemResponse,
)
from ops_api.ops.utils.api_helpers import (
    convert_date_strings_to_dates,
    get_change_data,
    update_and_commit_model_instance,
)
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers

ENDPOINT_STRING = "/services-components"


# TODO: Permissions (stop using BLI perms and events and sort out rules for SCs)
class ServicesComponentItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ServicesComponentItemResponse)()
        self._put_schema = mmdc.class_schema(POSTRequestBody)()
        self._patch_schema = mmdc.class_schema(PATCHRequestBody)()

    def sc_associated_with_contract_agreement(self, id: int, permission_type: PermissionType) -> bool:
        jwt_identity = get_jwt_identity()
        sc: ServicesComponent = current_app.db_session.get(ServicesComponent, id)
        try:
            contract_agreement = sc.contract_agreement
        except AttributeError as e:
            # No SC found in the DB. Erroring out.
            raise ExtraCheckError({}) from e

        if contract_agreement is None:
            # We are faking a validation check at this point. We know there is no agreement associated with the SC.
            # This is made to emulate the validation check from a marshmallow schema.
            if permission_type == PermissionType.PUT:
                raise ExtraCheckError(
                    {
                        "_schema": ["Services Component must have a Contract Agreement"],
                        "contract_agreement_id": ["Missing data for required field."],
                    }
                )
            elif permission_type == PermissionType.PATCH:
                raise ExtraCheckError({"_schema": ["Services Component must have a Contract Agreement"]})
            else:
                raise ExtraCheckError({})

        oidc_ids = set()
        if contract_agreement.created_by_user:
            oidc_ids.add(str(contract_agreement.created_by_user.oidc_id))
        if contract_agreement.project_officer:
            oidc_ids.add(str(contract_agreement.project_officer.oidc_id))
        oidc_ids |= set(str(tm.oidc_id) for tm in contract_agreement.team_members)

        ret = jwt_identity in oidc_ids

        return ret

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

    def _update(self, id, method, schema) -> Response:
        message_prefix = f"{method} to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_SERVICES_COMPONENT) as meta:
            old_services_component: ServicesComponent = self._get_item(id)
            if not old_services_component:
                raise ValueError(f"Invalid ServicesComponent id: {id}.")

            schema.context["id"] = id
            schema.context["method"] = method

            data = get_change_data(
                request.json,
                old_services_component,
                schema,
                ["id", "contract_agreement_id"],
            )
            data = convert_date_strings_to_dates(data)
            services_component = update_and_commit_model_instance(old_services_component, data)

            sc_dict = self._response_schema.dump(services_component)
            meta.metadata.update({"services_component": sc_dict})
            current_app.logger.info(f"{message_prefix}: Updated ServicesComponent: {sc_dict}")

            return make_response_with_headers(sc_dict, 200)

    @is_authorized(PermissionType.GET, Permission.SERVICES_COMPONENT)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)
        return response

    @is_authorized(
        PermissionType.PUT,
        Permission.SERVICES_COMPONENT,
    )
    def put(self, id: int) -> Response:
        if not self.sc_associated_with_contract_agreement(id, PermissionType.PUT):
            return make_response_with_headers({}, 403)
        return self._update(id, "PUT", self._put_schema)

    @is_authorized(
        PermissionType.PATCH,
        Permission.SERVICES_COMPONENT,
    )
    def patch(self, id: int) -> Response:
        if not self.sc_associated_with_contract_agreement(id, PermissionType.PATCH):
            return make_response_with_headers({}, 403)
        return self._update(id, "PATCH", self._patch_schema)

    @is_authorized(
        PermissionType.DELETE,
        Permission.SERVICES_COMPONENT,
    )
    def delete(self, id: int) -> Response:
        if not self.sc_associated_with_contract_agreement(id, PermissionType.DELETE):
            return make_response_with_headers({}, 403)

        with OpsEventHandler(OpsEventType.DELETE_SERVICES_COMPONENT) as meta:
            sc: ServicesComponent = self._get_item(id)

            if not sc:
                raise RuntimeError(f"Invalid ServicesComponent id: {id}.")

            # TODO when can we not delete?

            current_app.db_session.delete(sc)
            current_app.db_session.commit()

            meta.metadata.update({"Deleted ServicesComponent": id})

            return make_response_with_headers({"message": "ServicesComponent deleted", "id": sc.id}, 200)


class ServicesComponentListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._post_schema = mmdc.class_schema(POSTRequestBody)()
        self._get_schema = mmdc.class_schema(QueryParameters)()
        self._response_schema = mmdc.class_schema(ServicesComponentItemResponse)()
        self._response_schema_collection = mmdc.class_schema(ServicesComponentItemResponse)(many=True)

    @is_authorized(PermissionType.GET, Permission.SERVICES_COMPONENT)
    def get(self) -> Response:
        data = self._get_schema.dump(self._get_schema.load(request.args))

        stmt = select(self.model)
        if data.get("contract_agreement_id"):
            stmt = stmt.where(self.model.contract_agreement_id == data.get("contract_agreement_id"))

        result = current_app.db_session.execute(stmt).all()
        response = make_response_with_headers(self._response_schema_collection.dump([sc[0] for sc in result]))

        return response

    @is_authorized(PermissionType.POST, Permission.SERVICES_COMPONENT)
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        with OpsEventHandler(OpsEventType.CREATE_SERVICES_COMPONENT) as meta:
            self._post_schema.context["method"] = "POST"

            data = self._post_schema.dump(self._post_schema.load(request.json))
            data = convert_date_strings_to_dates(data)

            new_sc = ServicesComponent(**data)

            current_app.db_session.add(new_sc)
            current_app.db_session.commit()

            new_sc_dict = self._response_schema.dump(new_sc)
            meta.metadata.update({"new_sc": new_sc_dict})
            current_app.logger.info(f"{message_prefix}: New BLI created: {new_sc_dict}")

            return make_response_with_headers(new_sc_dict, 201)
