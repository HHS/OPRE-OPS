from typing import List, Optional

from flask import jsonify
from flask import request
from flask import Response
from ops.base_views import BaseItemAPI
from ops.models.base import BaseModel
from ops.models.cans import CAN


class PortfolioCansAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_item(self, id: int, year: Optional[int] = None) -> List[CAN]:
        can_fiscal_year_query = self.model.query.filter(
            self.model.can.has(managing_portfolio_id=id)
        )

        if year:
            can_fiscal_year_query = can_fiscal_year_query.filter_by(fiscal_year=year)

        return [cfy.can for cfy in can_fiscal_year_query.all()]

    def get(self, id: int) -> Response:
        year = request.args.get("year")
        cans = self._get_item(id, year)
        response = jsonify([can.to_dict() for can in cans])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
