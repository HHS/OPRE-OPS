from typing import Type

from flask import Response, current_app

from models import Agreement
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.agreement_spending import AgreementSpendingMetadataSchema
from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.utils.response import make_response_with_headers


class AgreementSpendingItemAPI(BaseItemAPI):
    """API endpoint for retrieving per-agreement fiscal-year spending totals."""

    def __init__(self, model: Type[BaseModel] = Agreement):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        """
        GET /agreements/<int:id>/spending/

        Returns per-agreement fiscal-year spending totals. Includes BLIs that
        are OBE or non-DRAFT and have a fiscal_year assigned. Values are the
        sum of BLI amount and fees for that fiscal year.

        Args:
            id: Agreement ID

        Returns:
            JSON response shaped as:
                {"fy_total": {"2043": "1234567.00", ...}}

        Raises:
            ResourceNotFoundError: If the agreement doesn't exist (returns 404)
        """
        agreement = current_app.db_session.get(Agreement, id)
        if not agreement:
            raise ResourceNotFoundError("Agreement", id)

        payload = {"fy_total": agreement.spending_by_fiscal_year}
        return make_response_with_headers(AgreementSpendingMetadataSchema().dump(payload))
