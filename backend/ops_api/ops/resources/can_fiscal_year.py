from typing import Optional, cast

from flask import Response, request
from typing_extensions import override

from models.base import BaseModel
from models.cans import CANFiscalYear
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.utils.response import make_response_with_headers


# This API is implemented as a BaseListAPI on purpose -
# since CANFiscalYear does not have an id the can_id is used
# and multiple CANFiscalYear are returned
class CANFiscalYearItemAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int, year: Optional[int] = None) -> list[CANFiscalYear]:
        can_fiscal_year_query = self.model.query.filter_by(can_id=id)

        if year:
            can_fiscal_year_query = can_fiscal_year_query.filter_by(fiscal_year=year)

        return can_fiscal_year_query.all()

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self, id: int) -> Response:
        year = request.args.get("year")
        can_fiscal_year = self._get_item(id, year)
        return make_response_with_headers([cfy.to_dict() for cfy in can_fiscal_year])


class CANFiscalYearListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_items(self, can_id: Optional[int] = None, year: Optional[int] = None) -> list[CANFiscalYear]:
        can_fiscal_years_query = self.model.query

        if can_id:
            can_fiscal_years_query = can_fiscal_years_query.filter_by(can_id=can_id)

        if year:
            can_fiscal_years_query = can_fiscal_years_query.filter_by(fiscal_year=year)

        return can_fiscal_years_query.all()

    @is_authorized(PermissionType.GET, Permission.CAN)
    def get(self) -> Response:
        can_id: int = cast(int, request.args.get("can_id"))
        year: int = cast(int, request.args.get("year"))
        can_fiscal_years = self._get_items(can_id, year)
        return make_response_with_headers([cfy.to_dict() for cfy in can_fiscal_years])
