from typing import Optional, cast

from flask import Response, jsonify, request
from models.base import BaseModel
from models.cans import BudgetLineItem
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class BudgetLineItemsItemAPI(BaseItemAPI):  # type: ignore [misc]
    def __init__(self, model: BaseModel):
        super().__init__(model)


class BudgetLineItemsListAPI(BaseListAPI):  # type: ignore [misc]
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_items(
        self,
        can_id: Optional[int] = None,
        year: Optional[int] = None,
    ) -> list[BudgetLineItem]:
        budget_line_items_query = self.model.query

        if can_id:
            budget_line_items_query = budget_line_items_query.filter_by(can_id=can_id)

        if year:
            budget_line_items_query = budget_line_items_query.filter_by(
                fiscal_year=year
            )

        return cast(list[BudgetLineItem], budget_line_items_query.all())

    @override
    def get(self) -> Response:
        can_id = request.args.get("can_id")
        budget_line_items = self._get_items(can_id)
        response = jsonify([bli.to_dict() for bli in budget_line_items])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return cast(Response, response)
