from flask import jsonify
from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from typing_extensions import override


class PortfolioItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @override
    def _get_item(self, id):
        portfolio = self.model.query.filter_by(id=id).first_or_404()

        # Nest with description, division, and status
        # division = Division.query.filter_by(id=portfolio.division_id).first_or_404()
        # portfolio_descriptions = PortfolioDescriptionText.query.filter_by(portfolio_id=id).all()

        return portfolio.to_dict()

    @override
    def get(self, id):
        portfolio = self._get_item(id)
        response = jsonify(portfolio)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response


class PortfolioListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
