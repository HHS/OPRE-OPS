from flask import Response, current_app, request

from models.base import BaseModel
from models.utils.fiscal_year import get_current_fiscal_year
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.resources.portfolio_funding_summary import _extract_first_or_default
from ops_api.ops.schemas.agreement_spending_summary import RequestSchema, ResponseSchema
from ops_api.ops.utils.agreement_spending import get_agreement_spending_by_type
from ops_api.ops.utils.response import make_response_with_headers


class AgreementSpendingSummaryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        schema = RequestSchema()
        data = schema.load(request.args.to_dict(flat=False))
        fiscal_year = _extract_first_or_default(data.get("fiscal_year"), get_current_fiscal_year())
        result = get_agreement_spending_by_type(current_app.db_session, fiscal_year)
        response_schema = ResponseSchema()
        return make_response_with_headers(response_schema.dump(result))
