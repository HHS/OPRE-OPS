from __future__ import annotations

from contextlib import suppress
from datetime import date
from functools import partial
from typing import Optional

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from marshmallow import EXCLUDE, Schema, ValidationError
from models import BudgetLineItemStatus, OpsEventType
from models.base import BaseModel
from models.cans import AgreementType, BudgetLineItem
from models.workflows import BliPackage
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.resources.budget_line_item_schemas import (
    BudgetLineItemResponse,
    PATCHRequestBody,
    POSTRequestBody,
    QueryParameters,
)
from ops_api.ops.utils.auth import ExtraCheckError, Permission, PermissionType, is_authorized
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy import select
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from typing_extensions import Any, override

ENDPOINT_STRING = "/budget-line-items"


def bli_associated_with_agreement(self, id: int, permission_type: PermissionType) -> bool:
    jwt_identity = get_jwt_identity()
    try:
        agreement_id = request.json["agreement_id"]
        agreement_type = AgreementType[request.json["agreement_type"]]
        agreement_cls = BliPackage.get_class(agreement_type)
        agreement_id_field = agreement_cls.get_class_field("id")
        agreement_stmt = select(agreement_cls).where(agreement_id_field == agreement_id)
        agreement = current_app.db_session.scalar(agreement_stmt)

    except KeyError:
        budget_line_item_stmt = select(BudgetLineItem).where(BudgetLineItem.id == id)
        budget_line_item = current_app.db_session.scalar(budget_line_item_stmt)
        try:
            agreement = budget_line_item.agreement
        except AttributeError as e:
            # No BLI found in the DB. Erroring out.
            raise ExtraCheckError({}) from e

    if agreement is None:
        # We are faking a validation check at this point. We know there is no agreement associated with the BLI.
        # This is made to emulate the validation check from a marshmallow schema.
        if permission_type == PermissionType.PUT:
            raise ExtraCheckError(
                {
                    "_schema": ["BLI must have an Agreement when status is not DRAFT"],
                    "agreement_id": ["Missing data for required field."],
                }
            )
        elif permission_type == PermissionType.PATCH:
            raise ExtraCheckError({"_schema": ["BLI must have an Agreement when status is not DRAFT"]})
        else:
            raise ExtraCheckError({})

    oidc_ids = set()
    if agreement.created_by_user:
        oidc_ids.add(str(agreement.created_by_user.oidc_id))
    if agreement.project_officer_user:
        oidc_ids.add(str(agreement.project_officer_user.oidc_id))
    oidc_ids |= set(str(tm.oidc_id) for tm in agreement.team_members)

    ret = jwt_identity in oidc_ids

    return ret


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(BudgetLineItemResponse)()
        self._put_schema = mmdc.class_schema(POSTRequestBody)()
        self._patch_schema = mmdc.class_schema(PATCHRequestBody)()

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
    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)

        return response

    def _update(self, id, method, schema) -> Response:
        message_prefix = f"{method} to {ENDPOINT_STRING}"
        try:
            with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
                schema.context["id"] = id
                schema.context["method"] = method

                if request.json.get("status") == BudgetLineItemStatus.UNDER_REVIEW.name:
                    with OpsEventHandler(OpsEventType.SEND_BLI_FOR_APPROVAL) as approval_meta:
                        data = validate_and_normalize_request_data(schema)
                        budget_line_item = self.update_and_commit_budget_line_item(data, id)

                        approval_meta.metadata.update({"bli": budget_line_item.to_dict()})
                        approval_meta.metadata.update({"agreement": budget_line_item.agreement.to_dict()})
                        current_app.logger.info(
                            f"{message_prefix}: BLI Sent For Approval: {budget_line_item.to_dict()}"
                        )
                else:
                    data = validate_and_normalize_request_data(schema)
                    budget_line_item = self.update_and_commit_budget_line_item(data, id)

                bli_dict = self._response_schema.dump(budget_line_item)
                meta.metadata.update({"bli": bli_dict})
                current_app.logger.info(f"{message_prefix}: Updated BLI: {bli_dict}")

                return make_response_with_headers(bli_dict, 200)
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"{message_prefix}: {se}")
            return make_response_with_headers({}, 500)

    @override
    @is_authorized(
        PermissionType.PUT,
        Permission.BUDGET_LINE_ITEM,
        extra_check=partial(bli_associated_with_agreement, permission_type=PermissionType.PUT),
        groups=["Budget Team", "Admins"],
    )
    def put(self, id: int) -> Response:
        return self._update(id, "PUT", self._put_schema)

    @override
    @is_authorized(
        PermissionType.PATCH,
        Permission.BUDGET_LINE_ITEM,
        extra_check=partial(bli_associated_with_agreement, permission_type=PermissionType.PATCH),
        groups=["Budget Team", "Admins"],
    )
    def patch(self, id: int) -> Response:
        return self._update(id, "PATCH", self._patch_schema)

    def update_and_commit_budget_line_item(self, data, id):
        budget_line_item = update_budget_line_item(data, id)
        current_app.db_session.add(budget_line_item)
        current_app.db_session.commit()
        return budget_line_item


class BudgetLineItemsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._post_schema = mmdc.class_schema(POSTRequestBody)()
        self._get_schema = mmdc.class_schema(QueryParameters)()
        self._response_schema = mmdc.class_schema(BudgetLineItemResponse)()
        self._response_schema_collection = mmdc.class_schema(BudgetLineItemResponse)(many=True)

    @staticmethod
    def _get_query(
        can_id: Optional[int] = None,
        agreement_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> list[BudgetLineItem]:
        stmt = select(BudgetLineItem).order_by(BudgetLineItem.id)

        query_helper = QueryHelper(stmt)

        if can_id:
            query_helper.add_column_equals(BudgetLineItem.can_id, can_id)

        if agreement_id:
            query_helper.add_column_equals(BudgetLineItem.agreement_id, agreement_id)

        if status:
            query_helper.add_column_equals(BudgetLineItem.status, status)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @override
    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    def get(self) -> Response:
        message_prefix = f"GET to {ENDPOINT_STRING}"
        try:
            data = self._get_schema.dump(self._get_schema.load(request.args))

            data["status"] = BudgetLineItemStatus[data["status"]] if data.get("status") else None
            data["date_needed"] = date.fromisoformat(data["date_needed"]) if data.get("date_needed") else None

            stmt = self._get_query(data.get("can_id"), data.get("agreement_id"), data.get("status"))

            result = current_app.db_session.execute(stmt).all()

            response = make_response_with_headers(self._response_schema_collection.dump([bli[0] for bli in result]))
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"{message_prefix}: {se}")
            return make_response_with_headers({}, 500)

        return response

    @override
    @is_authorized(PermissionType.POST, Permission.BUDGET_LINE_ITEM)
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        try:
            with OpsEventHandler(OpsEventType.CREATE_BLI) as meta:
                self._post_schema.context["method"] = "POST"

                data = self._post_schema.dump(self._post_schema.load(request.json))
                data["status"] = BudgetLineItemStatus[data["status"]] if data.get("status") else None
                data["date_needed"] = date.fromisoformat(data["date_needed"]) if data.get("date_needed") else None

                new_bli = BudgetLineItem(**data)

                token = verify_jwt_in_request()
                user = get_user_from_token(token[1])
                new_bli.created_by = user.id

                current_app.db_session.add(new_bli)
                current_app.db_session.commit()

                new_bli_dict = self._response_schema.dump(new_bli)
                meta.metadata.update({"new_bli": new_bli_dict})
                current_app.logger.info(f"{message_prefix}: New BLI created: {new_bli_dict}")

                return make_response_with_headers(new_bli_dict, 201)
        except (KeyError, RuntimeError, PendingRollbackError) as re:
            current_app.logger.error(f"{message_prefix}: {re}")
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"{message_prefix}: {ve}")
            return make_response_with_headers(ve.normalized_messages(), 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"{message_prefix}: {se}")
            return make_response_with_headers({}, 500)


def update_data(budget_line_item: BudgetLineItem, data: dict[str, Any]) -> None:
    for item in data:
        setattr(budget_line_item, item, data[item])


def update_budget_line_item(data: dict[str, Any], id: int):
    budget_line_item = current_app.db_session.get(BudgetLineItem, id)
    if not budget_line_item:
        raise RuntimeError("Invalid BLI id.")
    update_data(budget_line_item, data)
    current_app.db_session.add(budget_line_item)
    current_app.db_session.commit()
    return budget_line_item


def validate_and_normalize_request_data(schema: Schema) -> dict[str, Any]:
    id = schema.context["id"]
    bli_stmt = select(BudgetLineItem).where(BudgetLineItem.id == id)
    existing_bli = current_app.db_session.scalar(bli_stmt)
    try:
        data = {
            key: value for key, value in existing_bli.to_dict().items() if key in request.json
        }  # only keep the attributes from the request body
    except AttributeError:
        data = {}
    change_data = schema.dump(schema.load(request.json, unknown=EXCLUDE))
    change_data = {
        key: value
        for key, value in change_data.items()
        if key not in {"status", "id"} and key in request.json and value != data.get(key, None)
    }  # only keep the attributes from the request body

    data |= change_data

    with suppress(AttributeError):
        try:
            status = BudgetLineItemStatus[request.json["status"]]
        except KeyError:
            status = existing_bli.status

        if len(change_data) > 0 and status == BudgetLineItemStatus.PLANNED:
            status = BudgetLineItemStatus.DRAFT
        data["status"] = status

    with suppress(KeyError):
        data["date_needed"] = date.fromisoformat(data["date_needed"])

    return data
