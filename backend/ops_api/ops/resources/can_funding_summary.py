from flask import Response, jsonify, request
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.utils.cans import get_can_funding_summary
from typing_extensions import override


class CANFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def get(self, id: int) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        can = self._get_item(id)
        can_funding_summary = get_can_funding_summary(can, fiscal_year)
        response = jsonify(can_funding_summary)
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
