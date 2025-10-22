from dataclasses import dataclass

from flask import current_app
from marshmallow import Schema, fields, validate
from models import Portfolio

from ops_api.ops.utils.portfolios import get_total_funding


@dataclass
class ResearchProjectFundingSummary:
    total_funding: float


class ResearchProjectFundingSummarySchema(Schema):
    total_funding = fields.Float(required=True)


class GetResearchProjectFundingSummaryQueryParams(Schema):
    portfolioId = fields.Int(required=True, validate=validate.Range(min=1))
    fiscalYear = fields.Int(required=True, validate=validate.Range(min=1900))


class ResearchProjectHelper:
    @staticmethod
    def get_funding_summary(
        portfolio_id: int, fiscal_year: int
    ) -> ResearchProjectFundingSummary:
        portfolio = current_app.db_session.get(Portfolio, portfolio_id)

        if not portfolio:
            return ResearchProjectFundingSummary(total_funding=0)

        total_funding = get_total_funding(portfolio, fiscal_year)

        return ResearchProjectFundingSummary(
            total_funding=total_funding.get("total_funding").get("amount")
        )
