"""User models."""
from datetime import datetime
from typing import List

from models import BaseModel
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship


class UserRole(BaseModel):
    __tablename__ = "user_role"

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("role.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"User Role: user_id={self.user_id}; role_id={self.role_id}"


class UserGroup(BaseModel):
    __tablename__ = "user_group"

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("group.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"User Group: user_id={self.user_id}; group_id={self.group_id}"


class User(BaseModel):
    """Main User mod."""

    __tablename__ = "user"

    id: Mapped[int] = BaseModel.get_pk_column()
    oidc_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), unique=True, index=True)
    hhs_id: Mapped[str]
    email: Mapped[str] = mapped_column(index=True, nullable=False)
    first_name: Mapped[str]
    last_name: Mapped[str]
    date_joined: Mapped[datetime] = mapped_column(server_default=func.now())
    updated: Mapped[datetime] = mapped_column(onupdate=func.now())

    division: Mapped[int] = mapped_column(
        ForeignKey("division.id", name="fk_user_division")
    )

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary="user_role",
        back_populates="users",
        primaryjoin="User.id == UserRole.user_id",
        secondaryjoin="Role.id == UserRole.role_id",
    )

    groups: Mapped[List["Group"]] = relationship(
        "Group",
        secondary="user_group",
        back_populates="users",
        primaryjoin="User.id == UserGroup.user_id",
        secondaryjoin="Group.id == UserGroup.group_id",
    )

    portfolios: Mapped[List["Portfolio"]] = relationship(
        "Portfolio",
        back_populates="team_leaders",
        secondary="portfolio_team_leaders",
        primaryjoin="User.id == PortfolioTeamLeaders.team_lead_id",
        secondaryjoin="Portfolio.id == PortfolioTeamLeaders.portfolio_id",
        viewonly=True,
    )

    projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="team_leaders",
        secondary="project_team_leaders",
        primaryjoin="User.id == ProjectTeamLeaders.team_lead_id",
        secondaryjoin="Project.id == ProjectTeamLeaders.project_id",
        viewonly=True,
    )

    agreements: Mapped[List["Agreement"]] = relationship(
        "Agreement",
        secondary="agreement_team_members",
        back_populates="team_members",
        primaryjoin="User.id == AgreementTeamMembers.user_id",
        secondaryjoin="Agreement.id == AgreementTeamMembers.agreement_id",
    )

    contracts: Mapped[List["ContractAgreement"]] = relationship(
        "ContractAgreement",
        back_populates="support_contacts",
        secondary="contract_support_contacts",
        viewonly=True,
    )

    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        foreign_keys="Notification.recipient_id",
    )

    def get_user_id(self):
        return self.id

    @BaseModel.display_name.getter
    def display_name(self):
        return self.full_name if self.full_name else self.email


class Role(BaseModel):
    """Main Role model."""

    __tablename__ = "role"
    id: Mapped[int] = BaseModel.get_pk_column()

    name: Mapped[str] = mapped_column(index=True, nullable=False)
    permissions: Mapped[str] = mapped_column(nullable=False)

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary="user_role",
        back_populates="roles",
        primaryjoin="Role.id == UserRole.role_id",
        secondaryjoin="User.id == UserRole.user_id",
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class Group(BaseModel):
    """Main Group model."""

    __tablename__ = "group"
    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(index=True, nullable=False)

    users: Mapped[List["User"]] = relationship(
        "User",
        secondary="user_group",
        back_populates="groups",
        primaryjoin="Group.id == UserGroup.group_id",
        secondaryjoin="User.id == UserGroup.user_id",
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name
