"""Module containing views for Grant Numbers."""

from flask import Response, current_app, request

from models import GrantNumber, OpsEventType
from models.base import BaseModel
from models.utils import generate_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.grant_number import (
    GrantNumberCreateSchema,
    GrantNumberItemResponse,
    GrantNumberSchema,
    GrantNumberUpdateSchema,
)
from ops_api.ops.services.grant_number import GrantNumberService
from ops_api.ops.services.ops_service import OpsService
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class GrantNumberItemAPI(BaseItemAPI):
    """View to get and manage individual Grant Number items."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.GRANT_NUMBER)
    def get(self, id: int) -> Response:
        schema = GrantNumberItemResponse()
        service: OpsService[GrantNumber] = GrantNumberService(current_app.db_session)
        grant_number = service.get(id)
        return make_response_with_headers(schema.dump(grant_number))

    @is_authorized(PermissionType.PUT, Permission.GRANT_NUMBER)
    def put(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_GRANT_NUMBER) as meta:
            schema = GrantNumberUpdateSchema()
            data = schema.load(
                request.json,
                unknown="exclude",
            )
            service: OpsService[GrantNumber] = GrantNumberService(current_app.db_session)
            old_grant_number = service.get(id)
            old_grant_number_dict = old_grant_number.to_dict()
            grant_number, status_code = service.update(id, data)
            gn_dict_for_update = grant_number.to_dict()
            updates = generate_events_update(
                old_grant_number_dict,
                gn_dict_for_update,
                grant_number.agreement_id,
                grant_number.updated_by,
            )

            meta.metadata.update({"grant_number_updates": updates})
            schema = GrantNumberItemResponse()
            gn_dict = schema.dump(grant_number)

            return make_response_with_headers(gn_dict, status_code)

    @is_authorized(PermissionType.PATCH, Permission.GRANT_NUMBER)
    def patch(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_GRANT_NUMBER) as meta:
            schema = GrantNumberUpdateSchema()
            data = schema.load(
                request.json,
                unknown="exclude",
                partial=True,
            )
            service: OpsService[GrantNumber] = GrantNumberService(current_app.db_session)
            old_grant_number = service.get(id)
            old_grant_number_dict = old_grant_number.to_dict()
            grant_number, status_code = service.update(id, data)
            # need the full updated grant number for generating the diff event
            gn_for_update = service.get(id)
            gn_dict_for_update = gn_for_update.to_dict()
            updates = generate_events_update(
                old_grant_number_dict,
                gn_dict_for_update,
                gn_for_update.agreement_id,
                gn_for_update.updated_by,
            )

            meta.metadata.update({"grant_number_updates": updates})

            schema = GrantNumberItemResponse()
            gn_dict = schema.dump(grant_number)

            return make_response_with_headers(gn_dict, status_code)

    @is_authorized(PermissionType.DELETE, Permission.GRANT_NUMBER)
    def delete(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.DELETE_GRANT_NUMBER) as meta:
            service: OpsService[GrantNumber] = GrantNumberService(current_app.db_session)
            old_grant_number = service.get(id)
            gn_id = id
            service.delete(id)

            meta.metadata.update({"grant_number": old_grant_number.to_dict()})

            return make_response_with_headers({"message": "GrantNumber deleted", "id": gn_id}, 200)


class GrantNumberListAPI(BaseListAPI):
    """View to get list of Grant Number items and create new ones."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.GRANT_NUMBER)
    def get(self) -> Response:
        schema = GrantNumberSchema()
        data = schema.load(
            request.args,
            unknown="exclude",
            partial=True,
        )
        service: OpsService[GrantNumber] = GrantNumberService(current_app.db_session)
        grant_numbers, _ = service.get_list(data)
        schema = GrantNumberItemResponse(many=True)
        return make_response_with_headers(schema.dump(grant_numbers))

    @is_authorized(PermissionType.POST, Permission.GRANT_NUMBER)
    def post(self) -> Response:
        with OpsEventHandler(OpsEventType.CREATE_GRANT_NUMBER) as meta:
            schema = GrantNumberCreateSchema()
            data = schema.load(
                request.json,
                unknown="exclude",
            )
            service: OpsService[GrantNumber] = GrantNumberService(current_app.db_session)
            new_gn = service.create(data)

            schema = GrantNumberItemResponse()
            new_gn_dict = schema.dump(new_gn)
            meta.metadata.update({"new_gn": new_gn_dict})

            return make_response_with_headers(new_gn_dict, 201)
