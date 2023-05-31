"""Module containing views for Product Service Codes."""
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI


class ProductServiceCodeItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)


class ProductServiceCodeListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
