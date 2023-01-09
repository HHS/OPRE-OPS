"""User models."""
from ops.models.base import BaseModel
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import (
    relationship,
    column_property,
)


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
