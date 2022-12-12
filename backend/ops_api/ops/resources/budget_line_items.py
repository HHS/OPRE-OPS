from typing import List

from flask import jsonify
from flask import request
from flask import Response
from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from ops.models.cans import BudgetLineItem
from typing_extensions import override


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model):
        super().__init__(model)


class BudgetLineItemsListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)

    def _get_items(self, can_id=None, year=None) -> List[BudgetLineItem]:
        budget_line_items_query = self.model.query

        if can_id:
            budget_line_items_query = budget_line_items_query.filter_by(can_id=can_id)

        if year:
            budget_line_items_query = budget_line_items_query.filter_by(
                fiscal_year=year
            )

        return budget_line_items_query.all()

    @override
    def get(self) -> Response:
        can_id = request.args.get("can_id")
        year = request.args.get("year")
        budget_line_items = self._get_items(can_id, year)
        response = jsonify([bli.to_dict() for bli in budget_line_items])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
