from dataclasses import dataclass
from typing import Optional

import desert
from flask import Response, current_app, request
from flask_jwt_extended import jwt_required
from models import Notification
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy import select


@dataclass
class ListAPIRequest:
    search: Optional[str]


class NotificationItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class NotificationListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self._get_input_schema = desert.schema(ListAPIRequest)

    @staticmethod
    def _get_query(search=None):
        stmt = select(Notification).order_by(Notification.id)

        query_helper = QueryHelper(stmt)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            # query_helper.add_search(cast(InstrumentedAttribute, CAN.number), search)
            ...

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @jwt_required()
    def get(self) -> Response:
        errors = self._get_input_schema.validate(request.args)

        if errors:
            return make_response_with_headers(errors, 400)

        request_data: ListAPIRequest = self._get_input_schema.load(request.args)
        stmt = self._get_query(request_data.search)
        result = current_app.db_session.execute(stmt).all()
        return make_response_with_headers([i.to_dict() for item in result for i in item])
