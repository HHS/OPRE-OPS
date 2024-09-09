from typing import Optional

from flask import Response, current_app, request
from sqlalchemy import select

from models import CAN, BaseModel, CANFundingDetails
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioCansAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_item(self, id: int, year: Optional[int] = None) -> set[CAN]:
        can_stmt = select(CAN).join(CANFundingDetails).where(CAN.portfolio_id == id).order_by(CAN.id)

        if year:
            can_stmt = can_stmt.where(CANFundingDetails.fiscal_year == year)

        return set(current_app.db_session.execute(can_stmt).scalars().all())

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        year = request.args.get("year")
        cans = self._get_item(id, year)
        return make_response_with_headers([can.to_dict() for can in cans])
