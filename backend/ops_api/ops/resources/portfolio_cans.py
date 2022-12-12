from typing import List

from flask import jsonify
from flask import Response
from ops.base_views import BaseItemAPI
from ops.models.cans import CAN


class PortfolioCansAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    def _get_item(self, id) -> List[CAN]:
        cans = self.model.query.filter(self.model.managing_portfolio_id == id).all()

        return cans

    def get(self, id) -> Response:
        cans = self._get_item(id)
        response = jsonify([can.to_dict() for can in cans])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
