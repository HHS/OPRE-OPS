from dataclasses import dataclass
from typing import Any, List, Optional, cast

import desert
from flask import Response, current_app, request
from flask_jwt_extended import jwt_required
from models import CANArrangementType
from models.base import BaseModel
from models.cans import CAN
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy import select
from sqlalchemy.orm import InstrumentedAttribute
from typing_extensions import override


@dataclass
class ListAPIRequest:
    search: Optional[str]


class CANItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class CANListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self._get_input_schema = desert.schema(ListAPIRequest)

    @staticmethod
    def _get_query(search=None):
        stmt = select(CAN).order_by(CAN.id)

        query_helper = QueryHelper(stmt)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(cast(InstrumentedAttribute, CAN.number), search)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @jwt_required(True)  # For an example case, we're allowing CANs to be queried unauthed
    @error_simulator
    def get(self) -> Response:
        errors = self._get_input_schema.validate(request.args)

        if errors:
            return make_response_with_headers(errors, 400)

        request_data: ListAPIRequest = self._get_input_schema.load(request.args)
        stmt = self._get_query(request_data.search)
        result = current_app.db_session.execute(stmt).all()

        cans_with_additional_fields = []
        for item in result:
            cans_with_additional_fields.extend(enhance_cans(item))

        return make_response_with_headers(cans_with_additional_fields)


class CANsByPortfolioAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> List[CAN]:
        cans = CAN.query.filter(CAN.managing_portfolio_id == id).all()

        return cans

    @override
    def get(self, id: int) -> Response:
        cans = self._get_item(id)
        cans_with_additional_fields = enhance_cans(cans)

        return make_response_with_headers(cans_with_additional_fields)


def add_additional_fields_to_can_response(can: CAN) -> dict[str, Any]:
    """
    Add additional fields to the CAN response.

    N.B. This is a temporary solution to add additional fields to the response.
    This should be refactored to use marshmallow.
    Also, the frontend/OpenAPI needs to be refactored to not use these fields.
    """
    if not can:
        return {}

    if isinstance(can.arrangement_type, str):
        can.arrangement_type = CANArrangementType[can.arrangement_type]

    return {
        "appropriation_date": can.appropriation_date.strftime("%d/%m/%Y") if can.appropriation_date else None,
        "expiration_date": can.expiration_date.strftime("%d/%m/%Y") if can.expiration_date else None,
        "arrangement_type": can.arrangement_type.name if can.arrangement_type else None,
    }


def enhance_cans(cans: List[CAN]) -> List[CAN]:
    cans_with_additional_fields = []
    for can in cans:
        additional_fields = add_additional_fields_to_can_response(can)
        can_dict = can.to_dict()
        can_dict.update(additional_fields)
        cans_with_additional_fields.append(can_dict)
    return cans_with_additional_fields
