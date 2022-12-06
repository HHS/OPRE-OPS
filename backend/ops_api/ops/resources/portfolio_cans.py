from flask import jsonify
from ops.views import BaseItemAPI


class PortfolioCansAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    def _get_item(self, id):
        cans = self.model.query.filter(self.model.managing_portfolio_id == id).all()

        return cans

    def get(self, id):
        cans = self._get_item(id)
        response = jsonify([can.to_dict() for can in cans])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
