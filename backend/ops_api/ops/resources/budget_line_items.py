from typing import List

from flask import Response, jsonify, request
from models.base import BaseModel
from models.cans import BudgetLineItem
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class BudgetLineItemsItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)


class BudgetLineItemsListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    def _get_items(self, can_id: int = None) -> List[BudgetLineItem]:
        budget_line_items_query = self.model.query

        if can_id:
            budget_line_items_query = budget_line_items_query.filter_by(can_id=can_id)

        return budget_line_items_query.all()

    @override
    def get(self) -> Response:
        can_id = request.args.get("can_id")
        budget_line_items = self._get_items(can_id)
        response = jsonify([bli.to_dict() for bli in budget_line_items])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
