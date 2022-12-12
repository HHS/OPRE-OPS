from typing import List

from flask import jsonify
from flask import Response
from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from ops.models.cans import CAN
from typing_extensions import override


class CANItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class CANListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)


class CANsByPortfolioAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @override
    def _get_item(self, id) -> List[CAN]:
        cans = CAN.query.filter(CAN.managing_portfolio_id == id).all()

        return cans

    @override
    def get(self, id) -> Response:
        cans = self._get_item(id)
        response = jsonify([can.to_dict() for can in cans])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
