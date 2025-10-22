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

    @is_authorized(PermissionType.GET, Permission.SERVICES_COMPONENT)
    def get(self, id: int) -> Response:
        schema = ServicesComponentItemResponse()
        service: OpsService[ServicesComponent] = ServicesComponentService(
            current_app.db_session
        )
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
            service: OpsService[ServicesComponent] = ServicesComponentService(
                current_app.db_session
            )
            old_services_component = service.get(id)
            old_services_component_dict = old_services_component.to_dict()
            services_component, status_code = service.update(id, data)
            sc_dict_for_update = services_component.to_dict()
            updates = generate_events_update(
                old_services_component_dict,
                sc_dict_for_update,
                services_component.agreement_id,
                services_component.updated_by,
            )

            updates["sc_display_name"] = services_component.display_name
            updates["sc_display_number"] = services_component.number
            schema = ServicesComponentItemResponse()
            sc_dict = schema.dump(services_component)
            meta.metadata.update({"services_component_updates": updates})

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
            service: OpsService[ServicesComponent] = ServicesComponentService(
                current_app.db_session
            )
            old_services_component = service.get(id)
            old_services_component_dict = old_services_component.to_dict()
            services_component, status_code = service.update(id, data)
            # need the full updated services component for generating the diff event
            sc_for_update = service.get(id)
            sc_dict_for_update = sc_for_update.to_dict()
            updates = generate_events_update(
                old_services_component_dict,
                sc_dict_for_update,
                sc_for_update.agreement_id,
                sc_for_update.updated_by,
            )

            updates["sc_display_name"] = sc_for_update.display_name
            updates["sc_display_number"] = sc_for_update.number
            meta.metadata.update({"services_component_updates": updates})

            schema = ServicesComponentItemResponse()
            sc_dict = schema.dump(services_component)

            return make_response_with_headers(sc_dict, status_code)

    @is_authorized(PermissionType.DELETE, Permission.SERVICES_COMPONENT)
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_SERVICES_COMPONENT) as meta:
            service: OpsService[ServicesComponent] = ServicesComponentService(
                current_app.db_session
            )
            old_services_component = service.get(id)
            sc_id = id
            service.delete(id)

            meta.metadata.update(
                {"service_component": old_services_component.to_dict()}
            )

            return make_response_with_headers(
                {"message": "ServicesComponent deleted", "id": sc_id}, 200
            )


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
        service: OpsService[ServicesComponent] = ServicesComponentService(
            current_app.db_session
        )
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
            service: OpsService[ServicesComponent] = ServicesComponentService(
                current_app.db_session
            )
            new_sc = service.create(data)

            schema = ServicesComponentItemResponse()
            new_sc_dict = schema.dump(new_sc)
            meta.metadata.update({"new_sc": new_sc_dict})

            return make_response_with_headers(new_sc_dict, 201)
