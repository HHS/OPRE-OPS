from flask import Response, request

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.utils.research_project_helper import (
    GetResearchProjectFundingSummaryQueryParams,
    ResearchProjectFundingSummarySchema,
    ResearchProjectHelper,
)
from ops_api.ops.utils.response import make_response_with_headers


class ResearchProjectFundingSummaryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self.get_input_schema = GetResearchProjectFundingSummaryQueryParams()

    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        args = self.get_input_schema.load(request.args)
        portfolio_id = args.get("portfolioId")
        fiscal_year = args.get("fiscalYear")

        funding_summary = ResearchProjectHelper.get_funding_summary(
            portfolio_id, fiscal_year
        )
        schema = ResearchProjectFundingSummarySchema()
        return make_response_with_headers(schema.dump(funding_summary))
