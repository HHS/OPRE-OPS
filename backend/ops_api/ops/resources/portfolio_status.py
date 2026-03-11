from flask import Response, jsonify

from models.base import BaseModel
from models.portfolios import PortfolioStatus
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.services.ops_service import ResourceNotFoundError


class PortfolioStatusItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        try:
            item = PortfolioStatus(id)
        except ValueError:
            raise ResourceNotFoundError("PortfolioStatus", id)
        return jsonify(item.name)


class PortfolioStatusListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self) -> Response:
        items = [e.name for e in PortfolioStatus]
        return jsonify(items)
