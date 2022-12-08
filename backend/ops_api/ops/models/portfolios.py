"""Portfolio Models."""
from typing import Any
from ops.utils import BaseModel
from sqlalchemy import (
    Column,
    ForeignKey,
    Table,
    Text,
    Integer,
    String,
    event,
)
from sqlalchemy.engine import Connection
from typing_extensions import override
from sqlalchemy.orm import relationship
from typing_extensions import override


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


class PortfolioStatus(BaseModel):
    """Portfolio Status sub model.

    This is automatically populated with the initial options on table creation.
    """
    __tablename__ = "portfolio_status"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)

    @staticmethod
    def initial_data(
        target: Table,
        connection: Connection,
        **kwargs: dict[str, Any],
    ) -> None:
        """Static method to initialize the table with default data."""
        connection.execute(
            target.insert(),
            {"id": 1, "name": "In-Process"},
            {"id": 2, "name": "Not-Started"},
            {"id": 3, "name": "Sandbox"},
        )


event.listen(
    PortfolioStatus.__table__,
    "after_create",
    PortfolioStatus.initial_data,
)


portfolio_cans = Table(
    "portfolio_cans",
    BaseModel.metadata,
    Column("portfolio_id", ForeignKey("portfolio.id"), primary_key=True),
    Column("can_id", ForeignKey("can.id"), primary_key=True),
)


class PortfolioDescriptionText(BaseModel):
    """Portfolio Description sub model."""
    __tablename__ = "portfolio_description_text"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    paragraph_number = Column(Integer)
    text = Column(Text)
    portfolio = relationship("Portfolio", back_populates="description")


portfolio_team_leaders = Table(
    "portfolio_team_leaders",
    BaseModel.metadata,
    Column("portfolio_id", ForeignKey("portfolio.id"), primary_key=True),
    Column("team_lead_id", ForeignKey("user.id"), primary_key=True),
)


class Portfolio(BaseModel):
    """Main Portfolio model."""
    __tablename__ = "portfolio"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    status_id = Column(Integer, ForeignKey("portfolio_status.id"))
    status = relationship("PortfolioStatus")
    cans = relationship(
        "CAN", back_populates="shared_portfolios", secondary=portfolio_cans
    )
    team_leaders = relationship(
        "User",
        back_populates="portfolios",
        secondary=portfolio_team_leaders,
    )
    division_id = Column(Integer, ForeignKey("division.id"))
    division = relationship("Division", back_populates="portfolio")
    urls = relationship("PortfolioUrl")
    description = relationship(
        "PortfolioDescriptionText", back_populates="portfolio"
    )

    @override
    def to_dict(self):
        d = super().to_dict()
        
        d.update(
            {
                "description": [
                    description.to_dict() for description in self.description
                ],
                "urls": [url.to_dict() for url in self.urls],
                "division": self.division.to_dict() if self.division else None,
                "cans": [can.to_dict() for can in self.cans],
                "status": self.status.name,
            }
        )

        return d


class PortfolioDescriptionText(Model):
    __tablename__ = "portfolio_description_text"
    id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    paragraph_number = Column(Integer)
    text = Column(Text)
    portfolio = relationship("Portfolio", back_populates="description")
