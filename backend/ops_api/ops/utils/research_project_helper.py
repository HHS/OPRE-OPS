from dataclasses import dataclass

from marshmallow import fields
from marshmallow.validate import Range
from models.cans import CAN, CANFiscalYear
from models.research_projects import ResearchProject
from ops_api.ops import db, ma
from sqlalchemy import select
from sqlalchemy.sql.functions import sum


@dataclass
class ResearchProjectFundingSummary:
    total_funding: float


class ResearchProjectFundingSummarySchema(ma.Schema):
    class Meta:
        fields = ("total_funding",)


class GetResearchProjectFundingSummaryInputSchema(ma.Schema):
    portfolio_id = fields.Int(validate=Range(min=1))
    fiscal_year = fields.Int(validate=Range(min=1900))


class ResearchProjectHelper:
    @staticmethod
    def get_funding_summary(portfolio_id: int, fiscal_year: int) -> ResearchProjectFundingSummary:
        total_funding_stmt = (
            select(sum(CANFiscalYear.current_funding))
            .join(CAN, CAN.id == CANFiscalYear.can_id)
            .join(ResearchProject, ResearchProject.id == CAN.managing_research_project_id)
            .where(CANFiscalYear.fiscal_year == int(fiscal_year))
            .where(ResearchProject.portfolio_id == int(portfolio_id))
        )

        total_funding = db.session.execute(total_funding_stmt).all()

        return ResearchProjectFundingSummary(total_funding=float(total_funding[0][0]))
