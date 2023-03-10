from flask import Response, jsonify
from flask_jwt_extended import jwt_required
from models.base import BaseModel
from models.portfolios import PortfolioStatus
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class PortfolioStatusItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @jwt_required()
    @override
    def get(self, id: int) -> Response:
        item = PortfolioStatus(id)
        return jsonify(item.name)


class PortfolioStatusListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @jwt_required()
    @override
    def get(self) -> Response:
        items = [e.name for e in PortfolioStatus]
        return jsonify(items)
