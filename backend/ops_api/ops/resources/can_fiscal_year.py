from typing import List

from flask import jsonify
from flask import request
from flask import Response
from ops.base_views import BaseListAPI
from ops.models.base import BaseModel
from ops.models.cans import CANFiscalYear
from typing_extensions import override


# This API is implemented as a BaseListAPI on purpose -
# since CANFiscalYear does not have an id the can_id is used
# and multiple CANFiscalYear are returned
class CANFiscalYearItemAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int, year: int = None) -> List[CANFiscalYear]:
        can_fiscal_year_query = self.model.query.filter_by(can_id=id)

        if year:
            can_fiscal_year_query = can_fiscal_year_query.filter_by(fiscal_year=year)

        return can_fiscal_year_query.all()

    @override
    def get(self, id: int) -> Response:
        year = request.args.get("year")
        can_fiscal_year = self._get_item(id, year)
        response = jsonify([cfy.to_dict() for cfy in can_fiscal_year])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response


class CANFiscalYearListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_items(self, can_id: int = None, year: int = None) -> List[CANFiscalYear]:
        can_fiscal_years_query = self.model.query

        if can_id:
            can_fiscal_years_query = can_fiscal_years_query.filter_by(can_id=can_id)

        if year:
            can_fiscal_years_query = can_fiscal_years_query.filter_by(fiscal_year=year)

        return can_fiscal_years_query.all()

    @override
    def get(self) -> Response:
        can_id = request.args.get("can_id")
        year = request.args.get("year")
        can_fiscal_years = self._get_items(can_id, year)
        response = jsonify([cfy.to_dict() for cfy in can_fiscal_years])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
