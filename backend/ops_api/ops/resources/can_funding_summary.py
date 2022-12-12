from typing import Dict

from flask import jsonify
from flask import request
from flask import Response
from ops.base_views import BaseItemAPI
from ops.utils.cans import get_can_funding_summary
from typing_extensions import override


class CANFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)

    @override
    def _get_item(self, id, fiscal_year) -> Dict[str, object]:
        can = self.model.query.filter_by(id=id).first_or_404()
        can_funding = get_can_funding_summary(can, fiscal_year)
        return can_funding

    @override
    def get(self, id) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        can_funding_summary = self._get_item(id, fiscal_year)
        response = jsonify(can_funding_summary)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
