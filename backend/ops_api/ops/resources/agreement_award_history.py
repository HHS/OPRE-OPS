"""API resource for the Award & Modification History tab."""

from typing import Type

from flask import Response, current_app

from models import Agreement
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.agreement_award_history import AgreementAwardHistoryRecordSchema
from ops_api.ops.services.agreement_award_history import AgreementAwardHistoryService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


class AgreementAwardHistoryItemAPI(BaseItemAPI):
    """API endpoint for a Contract/AA agreement's award & modification history."""

    def __init__(self, model: Type[BaseModel] = Agreement):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        """
        GET /agreements/<int:id>/award-history/

        Returns one flat record per completed procurement action (initial award plus
        each completed modification) for a Contract or AA agreement.

        Args:
            id: Agreement ID

        Returns:
            JSON response shaped as ``{"data": [ {record}, ... ]}``.

        Raises:
            ResourceNotFoundError: The agreement doesn't exist (404).
            ValidationError: The agreement is not a Contract or AA agreement (400).
        """
        service = AgreementAwardHistoryService(current_app.db_session)
        records = service.get_award_history(id)

        schema = AgreementAwardHistoryRecordSchema(many=True)
        serialized_data = schema.dump(records)

        return make_response_with_headers({"data": serialized_data})
