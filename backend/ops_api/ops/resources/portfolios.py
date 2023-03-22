from flask import Response
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def get(self, id: int) -> Response:
        return self._get_item_with_try(id)


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
