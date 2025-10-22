"""Module containing views for Procurement Shops."""

from flask import Response, current_app, request
from models import ProcurementShop
from models.base import BaseModel

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.procurement_shops import ProcurementShopSchema
from ops_api.ops.services.ops_service import OpsService
from ops_api.ops.services.procurement_shops import ProcurementShopService
from ops_api.ops.utils.response import make_response_with_headers


class ProcurementShopsItemAPI(BaseItemAPI):  # type: ignore [misc]
    """View to get individual Procurement Shop item."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        schema = ProcurementShopSchema()
        service: OpsService[ProcurementShop] = ProcurementShopService(
            current_app.db_session
        )
        procurement_shop = service.get(id)
        return make_response_with_headers(schema.dump(procurement_shop))


class ProcurementShopsListAPI(BaseListAPI):  # type: ignore [misc]
    """View to get list of Procurement Shop items."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        schema = ProcurementShopSchema(many=True)
        service: OpsService[ProcurementShop] = ProcurementShopService(
            current_app.db_session
        )
        procurement_shops, _ = service.get_list(request.args)
        return make_response_with_headers(schema.dump(procurement_shops))
