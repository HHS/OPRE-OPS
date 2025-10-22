from flask import Response, current_app, request

from models import AgreementHistory
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.schemas.agreement_history import AgreementHistoryItemSchema
from ops_api.ops.services.agreement_history import AgreementHistoryService
from ops_api.ops.services.ops_service import OpsService
from ops_api.ops.utils.response import make_response_with_headers


class AgreementHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self, id: int) -> Response:
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        service: OpsService[AgreementHistory] = AgreementHistoryService(
            current_app.db_session
        )
        results = service.get(id, limit=limit, offset=offset)
        agreement_history_schema = AgreementHistoryItemSchema(many=True)
        if results:
            response = make_response_with_headers(
                agreement_history_schema.dump(results)
            )
        else:
            response = make_response_with_headers({}, 404)
        return response
