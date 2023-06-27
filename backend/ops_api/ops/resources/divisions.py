from typing_extensions import override
from flask import Response
from flask_jwt_extended import jwt_required
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.auth import is_authorized


class DivisionsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @jwt_required()
    @is_authorized("GET_DIVISION")
    def get(self, id: int) -> Response:
        return super().get(id)


class DivisionsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @jwt_required()
    @is_authorized("GET_DIVISIONS")
    def get(self) -> Response:
        return super().get()
