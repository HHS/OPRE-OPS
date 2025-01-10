from flask import Response, request
from flask_jwt_extended import jwt_required

from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.schemas.can_history import CANHistoryItemSchema, GetHistoryListQueryParametersSchema
from ops_api.ops.services.can_history import CANHistoryService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


class CANHistoryListAPI(BaseListAPI):
    def __init__(self, model):
        super().__init__(model)
        self.service = CANHistoryService()
        self._get_schema = GetHistoryListQueryParametersSchema()

    @jwt_required()
    @error_simulator
    def get(self) -> Response:
        data = self._get_schema.dump(self._get_schema.load(request.args))
        result = self.service.get(data.get("can_id"), data.get("limit"), data.get("offset"))
        can_history_schema = CANHistoryItemSchema()
        return make_response_with_headers([can_history_schema.dump(funding_budget) for funding_budget in result])
