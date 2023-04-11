from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

import desert
from flask import Response, current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from marshmallow import fields
from models import BudgetLineItemStatus, OpsEventType
from models.base import BaseModel
from models.cans import BudgetLineItem
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy import select
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from typing_extensions import override


@dataclass
class RequestBody:
    line_description: str
    agreement_id: int
    can_id: int
    amount: float
    date_needed: str
    status: Optional[BudgetLineItemStatus] = fields.Enum(BudgetLineItemStatus)
    comments: Optional[str] = None
    psc_fee_amount: Optional[float] = None


@dataclass
class QueryParameters:
    can_id: Optional[int] = None
    agreement_id: Optional[int] = None
    status: Optional[BudgetLineItemStatus] = fields.Enum(BudgetLineItemStatus, default=None)


@dataclass
class BudgetLineItemResponse:
    id: int
    agreement_id: int
    can_id: int
    amount: float
    created_by: int
    line_description: str
    status: BudgetLineItemStatus = fields.Enum(BudgetLineItemStatus)
    comments: Optional[str] = None
    psc_fee_amount: Optional[float] = None
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%f")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%f")
    date_needed: date = fields.Date(format="%Y-%m-%d")


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)


class BudgetLineItemsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._post_schema = desert.schema(RequestBody)
        self._get_schema = desert.schema(QueryParameters)
        self._response_schema = desert.schema(BudgetLineItemResponse)

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
        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["GET_BUDGET_LINE_ITEMS"])

        if is_authorized:
            errors = self._get_schema.validate(request.args)

            if errors:
                current_app.logger.error(f"GET /budget-line-items: Query Params failed validation: {errors}")
                return make_response_with_headers(errors, 400)

            data = self._get_schema.load(request.args)

            stmt = self._get_query(data.can_id, data.agreement_id, data.status)

            result = current_app.db_session.execute(stmt).all()

            response = make_response_with_headers([i.to_dict() for item in result for i in item])
        else:
            response = make_response_with_headers([], 401)

        return response

    @override
    @jwt_required()
    def post(self) -> Response:
        try:
            with OpsEventHandler(OpsEventType.CREATE_NEW_BLI) as meta:
                errors = self._post_schema.validate(request.json)

                if errors:
                    current_app.logger.error(f"POST to /budget-line-items: Params failed validation: {errors}")
                    return make_response_with_headers(errors, 400)

                data = self._post_schema.load(request.json)
                # convert str param to date
                data.date_needed = datetime.fromisoformat(data.date_needed)
                new_bli = BudgetLineItem(**data.__dict__)

                token = verify_jwt_in_request()
                user = get_user_from_token(token[1])
                new_bli.created_by = user.id

                current_app.db_session.add(new_bli)
                current_app.db_session.commit()

                new_bli_dict = self._response_schema.dump(new_bli)
                meta.metadata.update({"new_bli": new_bli_dict})
                current_app.logger.info(f"POST to /budget-line-items: New BLI created: {new_bli_dict}")

                return make_response_with_headers(new_bli_dict, 201)
        except KeyError as ve:
            # The status string is invalid
            current_app.logger.error(f"POST to /budget-line-items: {ve}")
            return make_response_with_headers({}, 400)
        except PendingRollbackError as pr:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"POST to /budget-line-items: {pr}")
            return make_response_with_headers({}, 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"POST to /budget-line-items: {se}")
            return make_response_with_headers({}, 500)
