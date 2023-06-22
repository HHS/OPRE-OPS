from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, cast

import desert
import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models import Notification, User
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import InstrumentedAttribute
from typing_extensions import override


@dataclass
class Recipient:
    id: int
    oidc_id: str
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
    recipient: Optional[Recipient] = None


@dataclass
class ListAPIRequest:
    user_id: Optional[str]
    oidc_id: Optional[str]
    status: Optional[bool]


class NotificationItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(NotificationResponse)()

    def _get_item_with_try(self, id: int) -> Response:
        try:
            item = self._get_item(id)

            if item:
                response = make_response_with_headers(self._response_schema.dump(item))
            else:
                response = make_response_with_headers({}, 404)
        except SQLAlchemyError as se:
            current_app.logger.error(se)
            response = make_response_with_headers({}, 500)

        return response

    @override
    @jwt_required()
    def get(self, id: int) -> Response:
        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["GET_NOTIFICATION"])

        if is_authorized:
            response = self._get_item_with_try(id)
        else:
            response = make_response_with_headers({}, 401)

        return response


class NotificationListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self._get_input_schema = desert.schema(ListAPIRequest)
        self._response_schema_collection = mmdc.class_schema(NotificationResponse)(many=True)

    @staticmethod
    def _get_query(user_id=None, oidc_id=None, status=None):
        stmt = (
            select(Notification)
            .distinct(Notification.id)
            .join(User, Notification.recipient_id == User.id, isouter=True)
            .order_by(Notification.id)
        )

        query_helper = QueryHelper(stmt)

        if user_id is not None and len(user_id) == 0:
            query_helper.return_none()
        elif user_id:
            query_helper.add_column_equals(cast(InstrumentedAttribute, User.id), user_id)

        if oidc_id is not None and len(oidc_id) == 0:
            query_helper.return_none()
        elif oidc_id:
            query_helper.add_column_equals(cast(InstrumentedAttribute, User.oidc_id), oidc_id)

        if status is not None:
            query_helper.add_column_equals(cast(InstrumentedAttribute, Notification.status), status)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @jwt_required()
    def get(self) -> Response:
        errors = self._get_input_schema.validate(request.args)

        if errors:
            return make_response_with_headers(errors, 400)

        request_data: ListAPIRequest = self._get_input_schema.load(request.args)
        stmt = self._get_query(
            user_id=request_data.user_id,
            oidc_id=request_data.oidc_id,
            status=request_data.status,
        )
        result = current_app.db_session.execute(stmt).all()
        return make_response_with_headers(self._response_schema_collection.dump([item[0] for item in result]))
