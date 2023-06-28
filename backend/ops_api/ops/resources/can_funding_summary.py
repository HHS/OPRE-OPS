from flask import Response, request
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.utils.auth import is_authorized
from ops_api.ops.utils.cans import get_can_funding_summary
from ops_api.ops.utils.response import make_response_with_headers
from typing_extensions import override


class CANFundingSummaryItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized("GET_CAN", "GET_CANS")
    def get(self, id: int) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        can = self._get_item(id)
        can_funding_summary = get_can_funding_summary(can, fiscal_year)
        return make_response_with_headers(can_funding_summary)
