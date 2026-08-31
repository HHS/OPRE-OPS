"""Vendors API resource."""

from flask import Response, current_app

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.schemas.vendors import VendorResponseSchema
from ops_api.ops.services.vendors import VendorService
from ops_api.ops.utils.response import make_response_with_headers


class VendorsListAPI(BaseListAPI):
    def __init__(self, _model):
        super().__init__(_model)
        self._response_schema = VendorResponseSchema(many=True)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        """Get list of active vendors."""
        service = VendorService(current_app.db_session)
        vendors = service.get_active_vendors()
        return make_response_with_headers(self._response_schema.dump(vendors))
