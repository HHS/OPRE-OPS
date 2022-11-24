from typing import Optional, TypedDict

from ops.can.models import CAN
from ops.portfolio.models import Portfolio
from ops.portfolio.utils import portfolio_dumper


class CANDict(TypedDict):
    id: int
    number: str
    description: Optional[str]
    purpose: Optional[str]
    nickname: Optional[str]
    arrangement_type: str
    funding_sources: list[str]
    authorizer: str
    managing_portfolio: Portfolio
    shared_portfolio: list[Portfolio]


def can_dumper(can: CAN) -> CANDict:
    return {
        "id": can.id,
        "number": can.number,
        "description": can.description,
        "purpose": can.purpose,
        "nickname": can.nickname,
        "arrangement_type": can.arrangement_type.name,
        "funding_sources": [fs.name for fs in can.funding_sources],
        "authorizer": can.authorizer.name,
        "managing_portfolio": portfolio_dumper(can.managing_portfolio),
        "shared_portfolio": [portfolio_dumper(p) for p in can.shared_portfolios],
    }
