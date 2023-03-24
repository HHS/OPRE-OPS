from dataclasses import dataclass

import desert
import marshmallow
from models.cans import CAN, CANFiscalYear
from models.research_projects import ResearchProject
from ops_api.ops import db
from sqlalchemy import select
from sqlalchemy.sql.functions import sum


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
        total_funding_stmt = (
            select(sum(CANFiscalYear.received_funding))
            .join(CAN, CAN.id == CANFiscalYear.can_id)
            .join(ResearchProject, ResearchProject.id == CAN.managing_research_project_id)
            .where(CANFiscalYear.fiscal_year == int(fiscal_year))
            .where(ResearchProject.portfolio_id == int(portfolio_id))
        )

        total_funding = db.session.execute(total_funding_stmt).all()

        total_funding_amount = float(total_funding[0][0]) if total_funding != [(None,)] else 0

        return ResearchProjectFundingSummary(total_funding=total_funding_amount)
