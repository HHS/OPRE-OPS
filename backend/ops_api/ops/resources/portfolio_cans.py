from typing import List, Optional

from flask import Response, request
from typing_extensions import override

from models.base import BaseModel
from models.cans import CAN
from ops_api.ops.base_views import BaseItemAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioCansAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_item(self, id: int, year: Optional[int] = None) -> List[CAN]:
        can_fiscal_year_query = self.model.query.filter(self.model.can.has(managing_portfolio_id=id))

        if year:
            can_fiscal_year_query = can_fiscal_year_query.filter_by(fiscal_year=year)

        return [cfy.can for cfy in can_fiscal_year_query.all()]

    @override
    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    @handle_api_error
    def get(self, id: int) -> Response:
        year = request.args.get("year")
        cans = self._get_item(id, year)
        return make_response_with_headers([can.to_dict() for can in cans])
