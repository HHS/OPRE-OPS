import desert
from flask import Response, request
from typing_extensions import override

from models.base import BaseModel
from ops_api.ops.auth.auth import Permission, PermissionType, is_authorized
from ops_api.ops.base_views import BaseListAPI, handle_api_error
from ops_api.ops.utils.research_project_helper import (
    GetResearchProjectFundingSummaryQueryParams,
    ResearchProjectFundingSummary,
    ResearchProjectHelper,
)
from ops_api.ops.utils.response import make_response_with_headers


class ResearchProjectFundingSummaryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self.get_input_schema = desert.schema(GetResearchProjectFundingSummaryQueryParams)

    @override
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    @handle_api_error
    def get(self) -> Response:
        portfolio_id = request.args.get("portfolioId")
        fiscal_year = request.args.get("fiscalYear")

        errors = self.get_input_schema.validate({"portfolio_id": portfolio_id, "fiscal_year": fiscal_year})

        if errors:
            return make_response_with_headers(errors, 400)

        funding_summary = ResearchProjectHelper.get_funding_summary(portfolio_id, fiscal_year)
        schema = desert.schema(ResearchProjectFundingSummary)
        return make_response_with_headers(schema.dump(funding_summary))
