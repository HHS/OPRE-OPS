from decimal import Decimal
from typing import Optional, TypedDict

from ops.portfolio.models import Portfolio


class PortfolioDict(TypedDict):
    name: str
    description: Optional[str]
    status: Optional[str]
    current_fiscal_year_funding: Decimal


def portfolio_dumper(portfolio: Portfolio) -> PortfolioDict:
    return {
        "name": portfolio.name,
        "description": portfolio.description,
        "status": portfolio.status.name,
        "current_fiscal_year_funding": portfolio.current_fiscal_year_funding,
    }
