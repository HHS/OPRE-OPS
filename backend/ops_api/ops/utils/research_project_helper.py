from dataclasses import dataclass
from typing import List, Optional

from models.portfolios import Portfolio
from models.research_projects import ResearchProject
from ops_api.ops.serializer import ma
from sqlalchemy import select


@dataclass
class ResearchProjectFundingSummary:
    total_funding: float


class ResearchProjectFundingSummarySchema(ma.Schema):
    class Meta:
        fields = ("total_funding",)


class ResearchProjectHelper:
    @staticmethod
    def get_list(portfolio: Portfolio, fiscal_year: int) -> Optional[List[ResearchProject]]:
        stmt = select(ResearchProject)

        return stmt

    @staticmethod
    def get_funding_summary(portfolio_id: id, fiscal_year: int) -> ResearchProjectFundingSummary:
        return ResearchProjectFundingSummary(total_funding=1)
