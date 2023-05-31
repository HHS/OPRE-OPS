"""Portfolio models."""
from enum import Enum
from typing import Any, cast

import sqlalchemy as sa
from models.base import BaseModel
from sqlalchemy import Column, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship
from typing_extensions import override


class PortfolioStatus(Enum):
    IN_PROCESS = 1
    NOT_STARTED = 2
    SANDBOX = 3


class Division(BaseModel):
    """Portfolio Division sub model."""

    __tablename__ = "division"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)
    abbreviation = Column(String(10), unique=True)
    portfolio = relationship("Portfolio", back_populates="division")


class PortfolioUrl(BaseModel):
    """Portfolio URL sub model.

    Used to list the URL/links associated with the Portfolio.
    """

    __tablename__ = "portfolio_url"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    portfolio = relationship("Portfolio", back_populates="urls")
    url = Column(String)


shared_portfolio_cans = Table(
    "shared_portfolio_cans",
    BaseModel.metadata,
    Column("portfolio_id", ForeignKey("portfolio.id"), primary_key=True),
    Column("can_id", ForeignKey("can.id"), primary_key=True),
)

portfolio_team_leaders = Table(
    "portfolio_team_leaders",
    BaseModel.metadata,
    Column("portfolio_id", ForeignKey("portfolio.id"), primary_key=True),
    Column("team_lead_id", ForeignKey("users.id"), primary_key=True),
)


class Portfolio(BaseModel):
    """Main Portfolio model."""

    __tablename__ = "portfolio"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    status = Column(sa.Enum(PortfolioStatus))
    cans = relationship(
        "CAN",
        back_populates="managing_portfolio",
    )
    shared_cans = relationship("CAN", back_populates="shared_portfolios", secondary=shared_portfolio_cans)
    division_id = Column(Integer, ForeignKey("division.id"))
    division = relationship("Division", back_populates="portfolio")
    urls = relationship("PortfolioUrl")
    description = Column(Text)
    team_leaders = relationship(
        "User",
        back_populates="portfolios",
        secondary=portfolio_team_leaders,
    )

    @override
    def to_dict(self) -> dict[str, Any]:
        d = super().to_dict()

        d.update(
            {
                "description": self.description,
                "urls": [url.to_dict() for url in self.urls],
                "division": self.division.to_dict() if self.division else None,
                "cans": [can.to_dict() for can in self.cans],
                "status": self.status.name if self.status else None,
                "team_leaders": [team_lead.to_dict() for team_lead in self.team_leaders],
            }
        )

        return cast(dict[str, Any], d)
