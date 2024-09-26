from dataclasses import dataclass

import desert
import marshmallow
from flask import current_app

from models import Portfolio
from ops_api.ops.utils.portfolios import get_total_funding


@dataclass
class ResearchProjectFundingSummary:
    total_funding: float


@dataclass
class GetResearchProjectFundingSummaryQueryParams:
    portfolio_id: int = desert.field(marshmallow.fields.Int(validate=marshmallow.validate.Range(min=1)))
    fiscal_year: int = desert.field(marshmallow.fields.Int(validate=marshmallow.validate.Range(min=1900)))


class ResearchProjectHelper:
    @staticmethod
    def get_funding_summary(portfolio_id: int, fiscal_year: int) -> ResearchProjectFundingSummary:
        portfolio = current_app.db_session.get(Portfolio, portfolio_id)

        if not portfolio:
            return ResearchProjectFundingSummary(total_funding=0)

        total_funding = get_total_funding(portfolio, fiscal_year)

        return ResearchProjectFundingSummary(total_funding=total_funding.get("total_funding").get("amount"))
