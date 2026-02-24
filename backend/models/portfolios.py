"""Portfolio models."""

from enum import Enum

from sqlalchemy import Column, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class PortfolioStatus(Enum):
    IN_PROCESS = 1
    NOT_STARTED = 2
    SANDBOX = 3


class Division(BaseModel):
    """Portfolio Division sub model."""

    __tablename__ = "division"

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(String(100), unique=True)
    abbreviation: Mapped[str] = mapped_column(String(10), unique=True)

    division_director_id = Column(Integer, ForeignKey("ops_user.id"))
    deputy_division_director_id = Column(Integer, ForeignKey("ops_user.id"))
    division_director = relationship("User", foreign_keys=[division_director_id], viewonly=True)

    __table_args__ = (
        Index("ix_division_division_director_id", "division_director_id"),
        Index("ix_division_deputy_division_director_id", "deputy_division_director_id"),
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name

    @property
    def division_director_full_name(self):

        return self.division_director.full_name if self.division_director else None



class PortfolioUrl(BaseModel):
    """Portfolio URL sub model.

    Used to list the URL/links associated with the Portfolio.
    """

    __tablename__ = "portfolio_url"
    id: Mapped[int] = BaseModel.get_pk_column()
    portfolio_id: Mapped[int] = mapped_column(Integer, ForeignKey("portfolio.id"))
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="urls")
    url: Mapped[str]

    __table_args__ = (Index("ix_portfolio_url_portfolio_id", "portfolio_id"),)


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
    team_lead_id: Mapped[int] = mapped_column(
        ForeignKey("ops_user.id"), primary_key=True
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"portfolio_id={self.portfolio_id};team_lead_id={self.team_lead_id}"


class Portfolio(BaseModel):
    """Main Portfolio model."""

    __tablename__ = "portfolio"
    id = BaseModel.get_pk_column()
    name = Column(String, nullable=False)
    abbreviation = Column(String)
    status = Column(ENUM(PortfolioStatus))
    cans = relationship(
        "CAN",
        back_populates="portfolio",
    )

    division_id = Column(Integer, ForeignKey("division.id"), nullable=False)
    division = relationship("Division", foreign_keys=[division_id])
    urls = relationship("PortfolioUrl")
    description = Column(Text)
    team_leaders = relationship(
        "User",
        back_populates="portfolios",
        secondary="portfolio_team_leaders",
        primaryjoin="Portfolio.id == PortfolioTeamLeaders.portfolio_id",
        secondaryjoin="User.id == PortfolioTeamLeaders.team_lead_id",
    )

    __table_args__ = (Index("ix_portfolio_division_id", "division_id"),)

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name
