"""Module containing views for Product Service Codes."""
from flask import Response
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class ProductServiceCodeItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class ProductServiceCodeListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def get(self) -> Response:
        return self._get_all_items_with_try()
