"""Module containing views for Product Service Codes."""
from flask import Response
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.auth import is_authorized
from typing_extensions import override


class ProductServiceCodeItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized("GET_AGREEMENT", "GET_AGREEMENTS")
    def get(self, id: int) -> Response:
        return super().get(id)


class ProductServiceCodeListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized("GET_AGREEMENT", "GET_AGREEMENTS")
    def get(self) -> Response:
        return super().get()
