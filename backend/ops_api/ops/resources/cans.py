from typing import List

from flask import Response, jsonify
from flask_jwt_extended import jwt_required
from models.base import BaseModel
from models.cans import CAN
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class CANItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class CANListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    @jwt_required(
        True
    )  # For an example case, we're allowing CANs to be queried unauthed
    def get(self) -> Response:
        items = self.model.query.all()
        return jsonify([item.to_dict() for item in items])


class CANsByPortfolioAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> List[CAN]:
        cans = CAN.query.filter(CAN.managing_portfolio_id == id).all()

        return cans

    @override
    def get(self, id: int) -> Response:
        cans = self._get_item(id)
        response = jsonify([can.to_dict() for can in cans])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
