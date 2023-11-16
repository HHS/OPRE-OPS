"""Portfolio models."""
from enum import Enum
from typing import Any, List, cast

import sqlalchemy as sa
from models.base import BaseModel
from sqlalchemy import Column, ForeignKey, Identity, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, object_session, relationship
from typing_extensions import override


class PortfolioStatus(Enum):
    IN_PROCESS = 1
    NOT_STARTED = 2
    SANDBOX = 3


class Division(BaseModel):
    """Portfolio Division sub model."""

    __versioned__ = {}
    __tablename__ = "division"

    id: Mapped[int] = mapped_column(Integer, Identity(start=10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    abbreviation: Mapped[str] = mapped_column(String(10), unique=True)

    division_director_id = Column(Integer, ForeignKey("user.id"))
    deputy_division_director_id = Column(Integer, ForeignKey("user.id"))

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class PortfolioUrl(BaseModel):
    """Portfolio URL sub model.

    Used to list the URL/links associated with the Portfolio.
    """

    __tablename__ = "portfolio_url"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    portfolio = relationship("Portfolio", back_populates="urls")
    url = Column(String)


class SharedPortfolioCANs(BaseModel):
    __versioned__ = {}
    __tablename__ = "shared_portfolio_cans"

    portfolio_id: Mapped[int] = mapped_column(
        ForeignKey("portfolio.id"), primary_key=True
    )
    can_id: Mapped[int] = mapped_column(ForeignKey("can.id"), primary_key=True)

    shared_portfolio: Mapped["Portfolio"] = relationship(
        back_populates="associated_shared_cans"
    )
    shared_can: Mapped["CAN"] = relationship(
        back_populates="associated_shared_portfolios"
    )


portfolio_team_leaders = Table(
    "portfolio_team_leaders",
    BaseModel.metadata,
    Column("portfolio_id", ForeignKey("portfolio.id"), primary_key=True),
    Column("team_lead_id", ForeignKey("user.id"), primary_key=True),
)


class Portfolio(BaseModel):
    """Main Portfolio model."""

    __tablename__ = "portfolio"
    id = Column(Integer, Identity(), primary_key=True)
    name = Column(String, nullable=False)
    abbreviation = Column(String)
    status = Column(sa.Enum(PortfolioStatus))
    cans = relationship(
        "CAN",
        back_populates="managing_portfolio",
    )

    shared_cans: Mapped[List["CAN"]] = relationship(
        secondary="shared_portfolio_cans", back_populates="shared_portfolios"
    )

    associated_shared_cans: Mapped[List["SharedPortfolioCANs"]] = relationship(
        back_populates="shared_portfolio"
    )

    division_id = Column(Integer, ForeignKey("division.id"), nullable=False)
    urls = relationship("PortfolioUrl")
    description = Column(Text)
    team_leaders = relationship(
        "User",
        back_populates="portfolios",
        secondary=portfolio_team_leaders,
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name

    @property
    def division(self):
        return object_session(self).get(Division, self.division_id)

    @override
    def to_dict(self) -> dict[str, Any]:
        d = super().to_dict()

        d.update(
            {
                "description": self.description,
                "urls": [url.to_dict() for url in self.urls],
                "cans": [can.to_dict() for can in self.cans],
                "division": self.division.to_dict() if self.division else None,
                "status": self.status.name if self.status else None,
                "team_leaders": [
                    team_lead.to_dict() for team_lead in self.team_leaders
                ],
            }
        )

        return cast(dict[str, Any], d)
