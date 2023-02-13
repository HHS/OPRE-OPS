"""User models."""
from models.base import BaseModel
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import column_property, relationship


class User(BaseModel):
    """Main User model."""

    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    oidc_id = Column(String(128), unique=True, index=True)
    email = Column(String, index=True, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    full_name = column_property(f"{first_name} {last_name}")
    date_joined = Column(DateTime, server_default=func.now())
    updated = Column(DateTime, onupdate=func.now())
    role = Column(String(255), index=True)
    division = Column(Integer, ForeignKey("division.id"))

    portfolios = relationship(
        "Portfolio",
        back_populates="team_leaders",
        secondary="portfolio_team_leaders",
    )

    research_projects = relationship(
        "ResearchProject",
        back_populates="team_leaders",
        secondary="research_project_team_leaders",
    )
