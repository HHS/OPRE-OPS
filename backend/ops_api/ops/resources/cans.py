from dataclasses import dataclass
from typing import List, Optional, cast

import desert
from flask import Response, current_app, request
from models.base import BaseModel
from models.cans import CAN
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.auth import is_authorized
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

    @override
    @is_authorized("GET_CANS")
    def get(self) -> Response:
        errors = self._get_input_schema.validate(request.args)

        if errors:
            return make_response_with_headers(errors, 400)

        request_data: ListAPIRequest = self._get_input_schema.load(request.args)
        stmt = self._get_query(request_data.search)
        result = current_app.db_session.execute(stmt).all()
        return make_response_with_headers([i.to_dict() for item in result for i in item])


class CANsByPortfolioAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> List[CAN]:
        cans = CAN.query.filter(CAN.managing_portfolio_id == id).all()

        return cans

    @override
    @is_authorized("GET_CAN")
    def get(self, id: int) -> Response:
        cans = self._get_item(id)
        return make_response_with_headers([can.to_dict() for can in cans])
