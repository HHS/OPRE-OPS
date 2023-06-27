from flask import Response
from flask_jwt_extended import jwt_required
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.auth import is_authorized
from typing_extensions import override


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @jwt_required()
    @is_authorized("GET_PORTFOLIO")
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @jwt_required()
    @is_authorized("GET_PORTFOLIOS")
    def get(self) -> Response:
        return super().get()
