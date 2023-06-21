from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import desert
import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import jwt_required
from models import Notification
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy import select


@dataclass
class TeamMembers:
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None


@dataclass
class NotificationResponse:
    id: int
    status: bool
    created_by: int
    updated_by: int
    created_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%f"})
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%f"})
    title: Optional[str] = None
    message: Optional[str] = None
    recipients: Optional[list[TeamMembers]] = field(default_factory=list)


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
        self._response_schema = mmdc.class_schema(NotificationResponse)()
        self._response_schema_collection = mmdc.class_schema(NotificationResponse)(many=True)

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
        return make_response_with_headers(self._response_schema_collection.dump([item[0] for item in result]))
