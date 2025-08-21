"""Module containing views for Services Components."""

from flask import Response, current_app, request

from models import OpsEventType, ServicesComponent
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.services_component import (
    ServicesComponentCreateSchema,
    ServicesComponentItemResponse,
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

            services_component = service.update(id, data)

            schema = ServicesComponentItemResponse()
            sc_dict = schema.dump(services_component)
            meta.metadata.update({"services_component": sc_dict})

            return make_response_with_headers(sc_dict, 200)

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

            services_component = service.update(id, data)

            schema = ServicesComponentItemResponse()
            sc_dict = schema.dump(services_component)
            meta.metadata.update({"services_component": sc_dict})

            return make_response_with_headers(sc_dict, 200)

    @is_authorized(PermissionType.DELETE, Permission.SERVICES_COMPONENT)
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_SERVICES_COMPONENT) as meta:
            service: OpsService[ServicesComponent] = ServicesComponentService(current_app.db_session)
            sc_id = id
            service.delete(id)

            meta.metadata.update({"Deleted ServicesComponent": sc_id})

            return make_response_with_headers({"message": "ServicesComponent deleted", "id": sc_id}, 200)


class ServicesComponentListAPI(BaseListAPI):
    """View to get list of Services Component items and create new ones."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.SERVICES_COMPONENT)
    def get(self) -> Response:
        schema = ServicesComponentItemResponse(many=True)
        service: OpsService[ServicesComponent] = ServicesComponentService(current_app.db_session)
        services_components, _ = service.get_list(request.args)
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
