import desert
from flask import Response, jsonify, request
from models.base import BaseModel
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.utils.research_project_helper import (
    GetResearchProjectFundingSummaryQueryParams,
    ResearchProjectFundingSummary,
    ResearchProjectHelper,
)
from typing_extensions import override


class ResearchProjectFundingSummaryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self.get_input_schema = desert.schema(GetResearchProjectFundingSummaryQueryParams)

    @override
    def get(self) -> Response:
        portfolio_id = request.args.get("portfolioId")
        fiscal_year = request.args.get("fiscalYear")

        errors = self.get_input_schema.validate({"portfolio_id": portfolio_id, "fiscal_year": fiscal_year})

        if errors:
            response = jsonify(errors)
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response, 400

        funding_summary = ResearchProjectHelper.get_funding_summary(portfolio_id, fiscal_year)
        schema = desert.schema(ResearchProjectFundingSummary)
        response = jsonify(schema.dump(funding_summary))
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
