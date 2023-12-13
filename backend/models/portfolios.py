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
    __tablename__ = "shared_portfolio_cans"

    portfolio_id: Mapped[int] = mapped_column(
        ForeignKey("portfolio.id"), primary_key=True
    )
    can_id: Mapped[int] = mapped_column(ForeignKey("can.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"portfolio_id={self.portfolio_id}:can_id={self.can_id}"


class PortfolioTeamLeaders(BaseModel):
    __tablename__ = "portfolio_team_leaders"

    portfolio_id: Mapped[int] = mapped_column(
        ForeignKey("portfolio.id"), primary_key=True
    )
    team_lead_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"portfolio_id={self.portfolio_id};team_lead_id={self.team_lead_id}"


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

    division_id = Column(Integer, ForeignKey("division.id"), nullable=False)
    urls = relationship("PortfolioUrl")
    description = Column(Text)
    team_leaders = relationship(
        "User",
        back_populates="portfolios",
        secondary="portfolio_team_leaders",
        primaryjoin="Portfolio.id == PortfolioTeamLeaders.portfolio_id",
        secondaryjoin="User.id == PortfolioTeamLeaders.team_lead_id",
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name

    @property
    def division(self):
        return object_session(self).get(Division, self.division_id)
