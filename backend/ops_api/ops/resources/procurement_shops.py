"""Module containing views for Procurement Shops."""
from typing import cast

from flask import Response, jsonify
from models.base import BaseModel
from models.procurement_shops import ProcurementShop
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from typing_extensions import override


class ProcurementShopsItemAPI(BaseItemAPI):  # type: ignore [misc]
    """View to get individual Procurement Shop item."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)


class ProcurementShopsListAPI(BaseListAPI):  # type: ignore [misc]
    """View to get list of Procurement Shop items."""

    def __init__(self, model: BaseModel):
        """Initialize the class."""
        super().__init__(model)

    @override
    def get(self) -> Response:
        procurement_shop_query = self.model.query

        procurement_shops = cast(list[ProcurementShop], procurement_shop_query.all())
        response = jsonify([ps.to_dict() for ps in procurement_shops])
        response.headers.add("Access-Control-Allow-Origin", "*")
        return cast(Response, response)
