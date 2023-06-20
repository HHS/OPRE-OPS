from dataclasses import dataclass

import desert
import marshmallow
from flask import current_app
from models import CAN, BudgetLineItem
from models.cans import CANFiscalYear
from sqlalchemy import distinct, select
from sqlalchemy.sql.functions import coalesce, sum


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
        inner_stmt = (
            select(distinct(BudgetLineItem.can_id))
            .join(CAN, CAN.id == BudgetLineItem.can_id)
            .where(CAN.managing_portfolio_id == int(portfolio_id))
        )

        subq = inner_stmt.subquery()

        total_funding_stmt = (
            select(sum(coalesce(CANFiscalYear.received_funding, 0) + coalesce(CANFiscalYear.expected_funding, 0)))
            .join(subq, subq.c[0] == CANFiscalYear.can_id)
            .where(CANFiscalYear.fiscal_year == int(fiscal_year))
        )

        total_funding = current_app.db_session.execute(total_funding_stmt).all()

        total_funding_amount = float(total_funding[0][0]) if total_funding != [(None,)] else 0

        return ResearchProjectFundingSummary(total_funding=total_funding_amount)
