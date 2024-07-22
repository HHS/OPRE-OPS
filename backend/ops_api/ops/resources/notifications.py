from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Optional, cast

import desert
import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import current_user
from marshmallow import Schema, fields
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import InstrumentedAttribute

from models import AgreementChangeRequest, ChangeRequestNotification, Notification, NotificationType, OpsEventType, User
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.change_requests import GenericChangeRequestResponseSchema
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers

ENDPOINT_STRING = "/notifications"


@dataclass()
class UpdateSchema:
    is_read: Optional[bool] = None
    title: Optional[str] = None
    message: Optional[str] = None
    recipient_id: Optional[int] = None
    expires: Optional[date] = field(default=None, metadata={"format": "%Y-%m-%d"})


class RecipientSchema(Schema):
    id = fields.Int(required=True)
    oidc_id = fields.Str(required=True)
    full_name = fields.Str(allow_none=True)
    email = fields.Str(allow_none=True)


class NotificationResponseSchema(Schema):
    id = fields.Int(required=True)
    notification_type = fields.Enum(NotificationType, required=True)
    is_read = fields.Bool(required=True)
    created_by = fields.Int(required=True)
    updated_by = fields.Int(required=True)
    created_on = fields.DateTime(allow_none=True, format="%Y-%m-%dT%H:%M:%S.%fZ")
    updated_on = fields.DateTime(allow_none=True, format="%Y-%m-%dT%H:%M:%S.%fZ")
    title = fields.Str(allow_none=True)
    message = fields.Str(allow_none=True)
    recipient = fields.Nested(RecipientSchema(), allow_none=True)
    expires = fields.Date(allow_none=True)
    change_request = fields.Nested(GenericChangeRequestResponseSchema(), allow_none=True)


@dataclass
class ListAPIRequest:
    user_id: Optional[str]
    oidc_id: Optional[str]
    is_read: Optional[bool]
    agreement_id: Optional[int]


class NotificationItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)
        self._response_schema = NotificationResponseSchema()
        self._put_schema = mmdc.class_schema(UpdateSchema)()
        self._patch_schema = mmdc.class_schema(UpdateSchema)()

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

    @is_authorized(PermissionType.GET, Permission.NOTIFICATION)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)

        return response

    @is_authorized(PermissionType.PUT, Permission.NOTIFICATION)
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"
        notification_dict = self.put_notification(id, message_prefix)
        return make_response_with_headers(notification_dict, 200)

    def put_notification(self, id: int, message_prefix: str):
        existing_notification = current_app.db_session.get(Notification, id)
        if is_acknowledging(existing_notification):
            with OpsEventHandler(OpsEventType.ACKNOWLEDGE_NOTIFICATION) as meta:
                check_can_acknowledge(existing_notification)
                notification_dict = self.handle_put(existing_notification, message_prefix, meta)
        else:
            notification_dict = self.handle_put(existing_notification, message_prefix)
        return notification_dict

    def handle_put(
        self,
        existing_notification: Notification,
        message_prefix: str,
        meta: Optional[OpsEventHandler] = None,
    ):
        data = self._put_schema.dump(self._put_schema.load(request.json))
        data["expires"] = date.fromisoformat(data["expires"]) if data.get("expires") else None
        for item in data:
            setattr(existing_notification, item, data[item])
        current_app.db_session.add(existing_notification)
        current_app.db_session.commit()
        notification_dict = self._response_schema.dump(existing_notification)
        if meta:
            meta.metadata.update({"notification": notification_dict})
        current_app.logger.info(f"{message_prefix}: Notification Updated: {notification_dict}")
        return notification_dict

    @is_authorized(PermissionType.PATCH, Permission.NOTIFICATION)
    def patch(self, id: int) -> Response:
        message_prefix = f"PATCH to {ENDPOINT_STRING}"
        notification_dict = self.patch_notification(id, message_prefix)
        return make_response_with_headers(notification_dict, 200)

    def patch_notification(self, id: int, message_prefix: str):
        existing_notification = current_app.db_session.get(Notification, id)
        if is_acknowledging(existing_notification):
            with OpsEventHandler(OpsEventType.ACKNOWLEDGE_NOTIFICATION) as meta:
                check_can_acknowledge(existing_notification)
                notification_dict = self.handle_patch(existing_notification, message_prefix, meta)
        else:
            notification_dict = self.handle_patch(existing_notification, message_prefix)
        return notification_dict

    def handle_patch(
        self,
        existing_notification: Notification,
        message_prefix: str,
        meta: Optional[OpsEventHandler] = None,
    ):
        data = self._patch_schema.dump(self._patch_schema.load(request.json))
        data = {k: v for (k, v) in data.items() if k in request.json}  # only keep the attributes from the request body
        if "expires" in data:
            data["expires"] = date.fromisoformat(data["expires"])
        for item in data:
            setattr(existing_notification, item, data[item])
        current_app.db_session.add(existing_notification)
        current_app.db_session.commit()
        notification_dict = self._response_schema.dump(existing_notification)
        if meta:
            meta.metadata.update({"notification": notification_dict})
        current_app.logger.info(f"{message_prefix}: Notification Updated: {notification_dict}")
        return notification_dict


class NotificationListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self._get_input_schema = desert.schema(ListAPIRequest)
        self._response_schema_collection = NotificationResponseSchema(many=True)

    @staticmethod
    def _get_query(
        user_id: Optional[int] = None,
        oidc_id: Optional[str] = None,
        is_read: Optional[bool] = None,
        agreement_id: Optional[int] = None,
    ):
        if agreement_id:
            # only ChangeRequestNotifications are associated with an agreement
            stmt = (
                select(ChangeRequestNotification)
                .distinct(ChangeRequestNotification.id)
                .join(User, ChangeRequestNotification.recipient_id == User.id, isouter=True)
                .join(
                    AgreementChangeRequest,
                    ChangeRequestNotification.change_request_id == AgreementChangeRequest.agreement_id,
                )
                .where(AgreementChangeRequest.agreement_id == agreement_id)
                .order_by(ChangeRequestNotification.id)
            )
        else:
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

        if is_read is not None:
            query_helper.add_column_equals(cast(InstrumentedAttribute, Notification.is_read), is_read)

        stmt = query_helper.get_stmt()
        return stmt

    @is_authorized(PermissionType.GET, Permission.NOTIFICATION)
    def get(self) -> Response:
        errors = self._get_input_schema.validate(request.args)

        if errors:
            return make_response_with_headers(errors, 400)

        request_data: ListAPIRequest = self._get_input_schema.load(request.args)
        stmt = self._get_query(
            user_id=request_data.user_id,
            oidc_id=request_data.oidc_id,
            is_read=request_data.is_read,
        )
        result = current_app.db_session.execute(stmt).all()
        return make_response_with_headers(self._response_schema_collection.dump([item[0] for item in result]))


def is_acknowledging(notification: Notification | None):
    return notification and not notification.is_read and request.json.get("is_read")


def check_can_acknowledge(notification):
    if notification and notification.recipient_id != current_user.id:
        raise RuntimeError("Cannot acknowledge a notification for another user")
