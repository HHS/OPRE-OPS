"""User models."""
from typing import List

from models.base import BaseModel
from sqlalchemy import Column, DateTime, ForeignKey, Identity, Integer, String, Table, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, column_property, relationship

# Define a many-to-many relationship between Users and Roles
user_role_table = Table(
    "user_role",
    BaseModel.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("role_id", Integer, ForeignKey("roles.id")),
)


class User(BaseModel):
    """Main User model."""

    __tablename__ = "users"
    id = Column(Integer, Identity(always=True, start=1, cycle=True), primary_key=True)
    oidc_id = Column(UUID(as_uuid=True), unique=True, index=True)
    email = Column(String, index=True, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    full_name = column_property(f"{first_name} {last_name}")
    date_joined = Column(DateTime, server_default=func.now())
    updated = Column(DateTime, onupdate=func.now())

    division = Column(Integer, ForeignKey("division.id", name="fk_user_division"))
    roles = relationship("Role", secondary=user_role_table)

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


class Role(BaseModel):
    """Main Role model."""

    __tablename__ = "roles"
    id = Column(Integer, Identity(always=True, start=1, cycle=True), primary_key=True)
    name = Column(String, index=True, nullable=False)
    permissions = Column(String, nullable=False)
    users = relationship("User", secondary=user_role_table)
