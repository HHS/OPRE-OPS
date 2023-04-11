from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, cast

import desert
from flask import Response, current_app, request
from flask_jwt_extended import jwt_required, verify_jwt_in_request
from models import BudgetLineItemStatus, OpsEventType
from models.base import BaseModel
from models.cans import BudgetLineItem
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from typing_extensions import override


@dataclass
class PostBudgetLineItemRequest:
    line_description: str
    agreement_id: int
    can_id: int
    amount: float
    status: str
    date_needed: str
    comments: Optional[str] = None
    psc_fee_amount: Optional[float] = None


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)


class BudgetLineItemsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._post_input_schema = desert.schema(PostBudgetLineItemRequest)

    def _get_items(
        self,
        can_id: Optional[int] = None,
        year: Optional[int] = None,
    ) -> list[BudgetLineItem]:
        budget_line_items_query = self.model.query

        if can_id:
            budget_line_items_query = budget_line_items_query.filter_by(can_id=can_id)

        if year:
            budget_line_items_query = budget_line_items_query.filter_by(fiscal_year=year)

        return cast(list[BudgetLineItem], budget_line_items_query.all())

    @override
    @jwt_required()
    def get(self) -> Response:
        can_id = request.args.get("can_id")
        budget_line_items = self._get_items(can_id)
        return make_response_with_headers([bli.to_dict() for bli in budget_line_items])

    @override
    @jwt_required()
    def post(self) -> Response:
        try:
            with OpsEventHandler(OpsEventType.CREATE_NEW_BLI) as meta:
                errors = self._post_input_schema.validate(request.json)

                if errors:
                    current_app.logger.error(f"POST to /budget-line-items: Params failed validation: {errors}")
                    return make_response_with_headers(errors, 400)

                data = self._post_input_schema.load(request.json)
                data.status = BudgetLineItemStatus[data.status]  # convert str param to enum
                # convert str param to date
                data.date_needed = datetime.fromisoformat(data.date_needed)
                new_bli = BudgetLineItem(**data.__dict__)

                token = verify_jwt_in_request()
                user = get_user_from_token(token[1])
                new_bli.created_by = user.id

                current_app.db_session.add(new_bli)
                current_app.db_session.commit()

                new_bli_dict = new_bli.to_dict()
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
