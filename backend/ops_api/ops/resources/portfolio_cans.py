from typing import Optional

from flask import Response, current_app, request
from sqlalchemy import select

from models import CAN, BaseModel, CANFundingBudget, CANFundingDetails
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.portfolios import PortfolioCansRequestSchema
from ops_api.ops.utils.response import make_response_with_headers


class PortfolioCansAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_item(self, id: int, year: Optional[int] = None, bli_year: Optional[int] = None) -> set[CAN]:
        can_stmt = (
            select(CAN)
            .outerjoin(CANFundingDetails, CAN.funding_details_id == CANFundingDetails.id)
            .outerjoin(CANFundingBudget, CAN.id == CANFundingBudget.can_id)
            .where(CAN.portfolio_id == id)
        )

        if year:
            can_stmt = can_stmt.where(CANFundingBudget.fiscal_year == year)

        can_set = set(current_app.db_session.execute(can_stmt).scalars().all())

        if bli_year:
            bli_year = int(bli_year)
            for can in can_set:
                can.budget_line_items = [bli for bli in can.budget_line_items if bli.date_needed.year == bli_year]

        return can_set

    @is_authorized(PermissionType.GET, Permission.PORTFOLIO)
    def get(self, id: int) -> Response:
        request_schema = PortfolioCansRequestSchema()
        data = request_schema.load(request.args)
        cans = self._get_item(id, data.get("year"), data.get("budgetFiscalYear"))
        return make_response_with_headers([can.to_dict() for can in cans])
