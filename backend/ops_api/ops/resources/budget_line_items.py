from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from marshmallow import ValidationError, validates_schema
from marshmallow_enum import EnumField
from models import AgreementReason, BudgetLineItemStatus, OpsEventType
from models.base import BaseModel
from models.cans import BudgetLineItem
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy import select
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from typing_extensions import Any, override

ENDPOINT_STRING = "/budget-line-items"


def is_changing_status(data: dict) -> bool:
    # status defaults to EnumField so the isinstance is checking for if status has been set
    status = data.get("status") if not isinstance(data.get("status"), EnumField) else None
    return status and status != BudgetLineItemStatus.DRAFT


def is_invalid_full(bli_data, request_data) -> bool:
    if isinstance(request_data, str):
        return is_invalid_partial(bli_data, request_data) or (request_data and len(request_data.strip()) == 0)
    else:
        return is_invalid_partial(bli_data, request_data) or not request_data


def is_invalid_partial(bli_data, request_data) -> bool:
    if isinstance(bli_data, str):
        return (
            (not request_data and not bli_data)
            or (bli_data and len(bli_data.strip()) == 0 and request_data and len(request_data.strip()) == 0)
            or (not request_data and bli_data and len(bli_data.strip()) == 0)
        )
    else:
        return not request_data and not bli_data


@dataclass(kw_only=True)
class RequestBody:
    status: Optional[BudgetLineItemStatus] = EnumField(BudgetLineItemStatus)
    line_description: Optional[str] = None
    can_id: Optional[int] = None
    amount: Optional[float] = None
    date_needed: Optional[date] = field(default=None, metadata={"format": "%Y-%m-%d"})
    comments: Optional[str] = None
    psc_fee_amount: Optional[float] = None

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_id(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and not bli.agreement_id and not data.get("agreement_id"):
                raise ValidationError("BLI must have an Agreement when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_research_project_id(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.research_project_id:
                raise ValidationError("BLI's Agreement must have a ResearchProject when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_type(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.agreement_type:
                raise ValidationError("BLI's Agreement must have an AgreementType when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_description(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.description:
                raise ValidationError("BLI's Agreement must have a Description when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_product_service_code(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.product_service_code_id:
                raise ValidationError("BLI's Agreement must have a ProductServiceCode when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_procurement_shop(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.procurement_shop_id:
                raise ValidationError("BLI's Agreement must have a ProcurementShop when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_reason(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.agreement_reason:
                raise ValidationError("BLI's Agreement must have an AgreementReason when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_reason_must_not_have_incumbent(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if (
                bli
                and bli.agreement_id
                and bli.agreement.agreement_reason == AgreementReason.NEW_REQ
                and bli.agreement.incumbent
            ):
                raise ValidationError(
                    "BLI's Agreement cannot have an Incumbent if it has an Agreement Reason of NEW_REQ"
                )

    @validates_schema(skip_on_field_errors=False)
    def validate_agreement_reason_must_have_incumbent(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if (
                bli
                and bli.agreement_id
                and (
                    bli.agreement.agreement_reason == AgreementReason.RECOMPETE
                    or bli.agreement.agreement_reason == AgreementReason.LOGICAL_FOLLOW_ON
                )
                and not bli.agreement.incumbent
            ):
                raise ValidationError(
                    "BLI's Agreement must have an Incumbent if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON"
                )

    @validates_schema(skip_on_field_errors=False)
    def validate_project_officer(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.project_officer:
                raise ValidationError("BLI's Agreement must have a ProjectOfficer when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_team_members(self, data, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            if bli and bli.agreement_id and not bli.agreement.team_members:
                raise ValidationError("BLI's Agreement must have at least one Team Member when status is not DRAFT")

    @validates_schema(skip_on_field_errors=False)
    def validate_description(self, data: dict, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            bli_description = bli.line_description if bli else None
            data_description = data.get("line_description")
            msg = "BLI must valid a valid Description when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_description, data_description):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_description, data_description):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_need_by_date(self, data: dict, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            bli_date_needed = bli.date_needed if bli else None
            data_date_needed = data.get("date_needed")
            msg = "BLI must valid a valid Need By Date when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_date_needed, data_date_needed):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_date_needed, data_date_needed):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_need_by_date_in_the_future(self, data: dict, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            bli_date_needed = bli.date_needed if bli else None
            data_date_needed = data.get("date_needed")
            today = date.today()
            msg = "BLI must valid a Need By Date in the future when status is not DRAFT"
            if (data_date_needed and data_date_needed <= today) or (bli_date_needed and bli_date_needed <= today):
                raise ValidationError(msg)

    @validates_schema(skip_on_field_errors=False)
    def validate_can(self, data: dict, **kwargs):
        if is_changing_status(data):
            bli = current_app.db_session.get(BudgetLineItem, self.context.get("id"))
            bli_can_id = bli.can_id if bli else None
            data_can_id = data.get("can_id")
            msg = "BLI must valid a valid CAN when status is not DRAFT"
            if self.context.get("method") in ["POST", "PUT"] and is_invalid_full(bli_can_id, data_can_id):
                raise ValidationError(msg)
            if self.context.get("method") in ["PATCH"] and is_invalid_partial(bli_can_id, data_can_id):
                raise ValidationError(msg)


@dataclass(kw_only=True)
class POSTRequestBody(RequestBody):
    agreement_id: int  # agreement_id is required for POST


@dataclass(kw_only=True)
class PATCHRequestBody(RequestBody):
    agreement_id: Optional[int] = None  # agreement_id (and all params) are optional for PATCH


@dataclass
class QueryParameters:
    can_id: Optional[int] = None
    agreement_id: Optional[int] = None
    status: Optional[BudgetLineItemStatus] = EnumField(BudgetLineItemStatus)


@dataclass
class BudgetLineItemResponse:
    id: int
    agreement_id: int
    can_id: int
    amount: float
    created_by: int
    line_description: str
    status: BudgetLineItemStatus = EnumField(BudgetLineItemStatus)
    comments: Optional[str] = None
    psc_fee_amount: Optional[float] = None
    created_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%f"})
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%f"})
    date_needed: date = field(default=None, metadata={"format": "%Y-%m-%d"})


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
    @jwt_required()
    def get(self, id: int) -> Response:
        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["GET_BUDGET_LINE_ITEM"])

        if is_authorized:
            response = self._get_item_with_try(id)
        else:
            response = make_response_with_headers({}, 401)

        return response

    @override
    @jwt_required()
    def put(self, id: int) -> Response:
        message_prefix = f"PUT to {ENDPOINT_STRING}"
        try:
            with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
                self._put_schema.context["id"] = id
                self._put_schema.context["method"] = "PUT"

                data = self._put_schema.dump(self._put_schema.load(request.json))
                data["status"] = BudgetLineItemStatus[data["status"]] if data.get("status") else None
                data["date_needed"] = date.fromisoformat(data["date_needed"]) if data.get("date_needed") else None

                budget_line_item = update_budget_line_item(data, id)

                bli_dict = self._response_schema.dump(budget_line_item)
                meta.metadata.update({"updated_bli": bli_dict})
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
    @jwt_required()
    def patch(self, id: int) -> Response:
        message_prefix = f"PATCH to {ENDPOINT_STRING}"
        try:
            with OpsEventHandler(OpsEventType.UPDATE_BLI) as meta:
                self._patch_schema.context["id"] = id
                self._patch_schema.context["method"] = "PATCH"

                data = self._patch_schema.dump(self._patch_schema.load(request.json))
                data = {
                    k: v for (k, v) in data.items() if k in request.json
                }  # only keep the attributes from the request body
                if "status" in data:
                    data["status"] = BudgetLineItemStatus[data["status"]]
                if "date_needed" in data:
                    data["date_needed"] = date.fromisoformat(data["date_needed"])

                budget_line_item = update_budget_line_item(data, id)

                current_app.db_session.add(budget_line_item)
                current_app.db_session.commit()

                bli_dict = self._response_schema.dump(budget_line_item)
                meta.metadata.update({"updated_bli": bli_dict})
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
    @jwt_required()
    def get(self) -> Response:
        message_prefix = f"GET to {ENDPOINT_STRING}"
        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["GET_BUDGET_LINE_ITEMS"])

        if is_authorized:
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
        else:
            response = make_response_with_headers([], 401)

        return response

    @override
    @jwt_required()
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
