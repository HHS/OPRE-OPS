from flask import Response, current_app, request

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.schemas.agreement_history import AgreementHistoryItemSchema
from ops_api.ops.services.agreement_history import AgreementHistoryService
from ops_api.ops.utils.response import make_response_with_headers


class AgreementHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self, id: int) -> Response:
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        service = AgreementHistoryService(current_app.db_session)
        results, metadata = service.get(id, limit=limit, offset=offset)
        agreement_history_schema = AgreementHistoryItemSchema(many=True)
        response_data = {
            "data": agreement_history_schema.dump(results),
            "count": metadata["count"],
            "limit": metadata["limit"],
            "offset": metadata["offset"],
        }
        return make_response_with_headers(response_data)
