from flask import Response, jsonify
from typing_extensions import override

from models.base import BaseModel
from models.portfolios import PortfolioStatus
from ops_api.ops.auth.auth import Permission, PermissionType, is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error


class PortfolioStatusItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    @handle_api_error
    def get(self, id: int) -> Response:
        item = PortfolioStatus(id)
        return jsonify(item.name)


class PortfolioStatusListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    @handle_api_error
    def get(self) -> Response:
        items = [e.name for e in PortfolioStatus]
        return jsonify(items)
