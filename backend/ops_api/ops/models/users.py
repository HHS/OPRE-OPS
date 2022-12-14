"""User models."""
from ops.utils import BaseModel
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    func,
)
from sqlalchemy.orm import relationship


class User(BaseModel):
    """Main User model."""
    __tablename__ = "user"
    id = Column(Integer, primary_key=True)
    oidc_id = Column(String(128), unique=True, index=True)
    email = Column(String, index=True, nullable=False)
    first_name = Column(String)
    date_joined = Column(DateTime, server_default=func.now())
    updated = Column(DateTime, onupdate=func.now())
    role = Column(String(255), index=True)
    division = Column(Integer, ForeignKey("division.id"))

    portfolios = relationship(
        "Portfolio",
        back_populates="team_leaders",
        secondary="portfolio_team_leaders",
    )
