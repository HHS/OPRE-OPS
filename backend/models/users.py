"""User models."""
from typing import Any, cast

from models.base import BaseModel
from sqlalchemy import Column, DateTime, ForeignKey, Identity, Integer, String, Table, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import column_property, relationship
from typing_extensions import override

# Define a many-to-many relationship between Users and Roles
user_role_table = Table(
    "user_role",
    BaseModel.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
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

    agreements = relationship(
        "Agreement",
        back_populates="team_members",
        secondary="agreement_team_members",
    )

    contracts = relationship(
        "ContractAgreement",
        back_populates="support_contacts",
        secondary="contract_support_contacts",
    )

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore [override]
        d = super().to_dict()  # type: ignore [no-untyped-call]

        d.update(
            {
                "oidc_id": f"{self.oidc_id}" if self.oidc_id else None,
                "date_joined": self.date_joined.isoformat()
                if self.date_joined
                else None,
            }
        )

        return cast(dict[str, Any], d)


class Role(BaseModel):
    """Main Role model."""

    __tablename__ = "roles"
    id = Column(Integer, Identity(always=True, start=1, cycle=True), primary_key=True)
    name = Column(String, index=True, nullable=False)
    permissions = Column(String, nullable=False)
    users = relationship("User", secondary=user_role_table)
