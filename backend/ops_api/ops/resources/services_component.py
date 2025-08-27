"""Module containing views for Services Components."""

from flask import Response, current_app, request

from models import OpsEventType, ServicesComponent
from models.base import BaseModel
from models.utils import generate_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.services_component import (
    ServicesComponentCreateSchema,
    ServicesComponentItemResponse,
    ServicesComponentSchema,
    ServicesComponentUpdateSchema,
)
from ops_api.ops.services.ops_service import OpsService
from ops_api.ops.services.services_component import ServicesComponentService
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class ServicesComponentItemAPI(BaseItemAPI):
    """View to get and manage individual Services Component items."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ServicesComponentItemResponse)()
        self._put_schema = mmdc.class_schema(POSTRequestBody)()
        self._patch_schema = mmdc.class_schema(PATCHRequestBody)()

    def sc_associated_with_agreement(self, id: int, permission_type: PermissionType) -> bool:
        sc: ServicesComponent = current_app.db_session.get(ServicesComponent, id)
        try:
            agreement = sc.agreement
        except AttributeError as e:
            # No SC found in the DB. Erroring out.
            raise ExtraCheckError({}) from e

        if agreement is None:
            # We are faking a validation check at this point. We know there is no agreement associated with the SC.
            # This is made to emulate the validation check from a marshmallow schema.
            if permission_type == PermissionType.PUT:
                raise ExtraCheckError(
                    {
                        "_schema": ["Services Component must have an Agreement"],
                        "agreement_id": ["Missing data for required field."],
                    }
                )
            elif permission_type == PermissionType.PATCH:
                raise ExtraCheckError({"_schema": ["Services Component must have an Agreement"]})
            else:
                raise ExtraCheckError({})

        return associated_with_agreement(agreement.id)

    def _get_item_with_try(self, id: int) -> Response:
        try:
            item = self._get_item(id)

            if item:
                response = make_response_with_headers(self._response_schema.dump(item))
            else:
                response = make_response_with_headers({}, 404)
        except SQLAlchemyError as se:
            logger.error(se)
            response = make_response_with_headers({}, 500)

        return response

    def _update(self, id, method, schema) -> Response:
        message_prefix = f"{method} to {ENDPOINT_STRING}"

        with OpsEventHandler(OpsEventType.UPDATE_SERVICES_COMPONENT) as meta:
            old_services_component: ServicesComponent = self._get_item(id)
            if not old_services_component:
                raise ValueError(f"Invalid ServicesComponent id: {id}.")
            old_services_component_dict = old_services_component.to_dict()

            with Context({"id": id, "method": method}):
                data = get_change_data(
                    request.json,
                    old_services_component,
                    schema,
                    ["id", "agreement_id"],
                )

                data = convert_date_strings_to_dates(data)
                services_component = update_and_commit_model_instance(old_services_component, data)
                updates = generate_events_update(
                    old_services_component_dict,
                    services_component.to_dict(),
                    services_component.contract_agreement_id,
                    services_component.updated_by,
                )
                updates["sc_display_name"] = services_component.display_name
                updates["sc_display_number"] = services_component.number
                sc_dict = self._response_schema.dump(services_component)
                meta.metadata.update({"services_component_updates": updates})
                logger.info(f"{message_prefix}: Updated ServicesComponent: {sc_dict}")

            return make_response_with_headers(sc_dict, 200)

    @is_authorized(PermissionType.GET, Permission.SERVICES_COMPONENT)
    def get(self, id: int) -> Response:
        schema = ServicesComponentItemResponse()
        service: OpsService[ServicesComponent] = ServicesComponentService(current_app.db_session)
        services_component = service.get(id)
        return make_response_with_headers(schema.dump(services_component))

    @is_authorized(PermissionType.PUT, Permission.SERVICES_COMPONENT)
    def put(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_SERVICES_COMPONENT) as meta:
            schema = ServicesComponentUpdateSchema()
            data = schema.load(
                request.json,
                unknown="exclude",
            )
            service: OpsService[ServicesComponent] = ServicesComponentService(current_app.db_session)

            services_component, status_code = service.update(id, data)

            schema = ServicesComponentItemResponse()
            sc_dict = schema.dump(services_component)
            meta.metadata.update({"services_component": sc_dict})

            return make_response_with_headers(sc_dict, status_code)

    @is_authorized(PermissionType.PATCH, Permission.SERVICES_COMPONENT)
    def patch(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_SERVICES_COMPONENT) as meta:
            schema = ServicesComponentUpdateSchema()
            data = schema.load(
                request.json,
                unknown="exclude",
                partial=True,
            )
            service: OpsService[ServicesComponent] = ServicesComponentService(current_app.db_session)

            services_component, status_code = service.update(id, data)

            schema = ServicesComponentItemResponse()
            sc_dict = schema.dump(services_component)
            meta.metadata.update({"services_component": sc_dict})

            return make_response_with_headers(sc_dict, status_code)

    @is_authorized(PermissionType.DELETE, Permission.SERVICES_COMPONENT)
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_SERVICES_COMPONENT) as meta:
            service: OpsService[ServicesComponent] = ServicesComponentService(current_app.db_session)
            sc_id = id
            service.delete(id)

            meta.metadata.update({"service_component": sc.to_dict()})

            return make_response_with_headers({"message": "ServicesComponent deleted", "id": sc_id}, 200)


class ServicesComponentListAPI(BaseListAPI):
    """View to get list of Services Component items and create new ones."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.SERVICES_COMPONENT)
    def get(self) -> Response:
        schema = ServicesComponentSchema()
        data = schema.load(
            request.args,
            unknown="exclude",
            partial=True,
        )
        service: OpsService[ServicesComponent] = ServicesComponentService(current_app.db_session)
        services_components, _ = service.get_list(data)
        schema = ServicesComponentItemResponse(many=True)
        return make_response_with_headers(schema.dump(services_components))

    @is_authorized(PermissionType.POST, Permission.SERVICES_COMPONENT)
    def post(self) -> Response:
        with OpsEventHandler(OpsEventType.CREATE_SERVICES_COMPONENT) as meta:
            schema = ServicesComponentCreateSchema()
            data = schema.load(
                request.json,
                unknown="exclude",
            )
            service: OpsService[ServicesComponent] = ServicesComponentService(current_app.db_session)
            new_sc = service.create(data)

            schema = ServicesComponentItemResponse()
            new_sc_dict = schema.dump(new_sc)
            meta.metadata.update({"new_sc": new_sc_dict})

            return make_response_with_headers(new_sc_dict, 201)
