from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, cast

import desert
from flask import Response, current_app, jsonify, make_response, request
from flask_jwt_extended import jwt_required
from models import BudgetLineItemStatus, OpsEventType
from models.base import BaseModel
from models.cans import BudgetLineItem
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.events import OpsEventHandler
from sqlalchemy.exc import SQLAlchemyError
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
        response = jsonify([bli.to_dict() for bli in budget_line_items])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return cast(Response, response)

    @override
    @jwt_required()
    def post(self) -> Response:
        try:
            with OpsEventHandler(OpsEventType.CREATE_NEW_BLI) as meta:
                errors = self._post_input_schema.validate(request.json)

                if errors:
                    current_app.logger.error(f"POST to /budget-line-items: Params failed validation: {errors}")
                    response = make_response(errors, 400)
                    response.headers.add("Access-Control-Allow-Origin", "*")
                    return response

                data = self._post_input_schema.load(request.json)
                data.status = BudgetLineItemStatus[data.status]  # convert str param to enum
                # convert str param to date
                data.date_needed = datetime.fromisoformat(data.date_needed)
                new_bli = BudgetLineItem(**data.__dict__)
                current_app.db_session.add(new_bli)
                current_app.db_session.commit()

                new_bli_dict = new_bli.to_dict()
                meta.metadata.update({"new_bli": new_bli_dict})
                current_app.logger.info(f"POST to /budget-line-items: New BLI created: {new_bli_dict}")
                response = make_response(new_bli_dict, 201)
                response.headers.add("Access-Control-Allow-Origin", "*")
                return response
        except KeyError as ve:
            current_app.logger.error(f"POST to /budget-line-items: {ve}")
            response = make_response({}, 400)
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
        except SQLAlchemyError as se:
            current_app.logger.error(f"POST to /budget-line-items: {se}")
            response = make_response({}, 500)
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
