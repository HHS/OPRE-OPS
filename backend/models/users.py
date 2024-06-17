"""User models."""

from enum import Enum, auto
from typing import List, Optional

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from models import BaseModel


class UserRole(BaseModel):
    __tablename__ = "user_role"

    user_id: Mapped[int] = mapped_column(ForeignKey("ops_user.id"), primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("role.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"User Role: user_id={self.user_id}; role_id={self.role_id}"


class UserGroup(BaseModel):
    __tablename__ = "user_group"

    user_id: Mapped[int] = mapped_column(ForeignKey("ops_user.id"), primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("group.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"User Group: user_id={self.user_id}; group_id={self.group_id}"


class UserStatus(Enum):
    ACTIVE = auto()
    INACTIVE = auto()
    LOCKED = auto()


class User(BaseModel):
    """Main User mod."""

    __tablename__ = "ops_user"

    id: Mapped[int] = BaseModel.get_pk_column()
    oidc_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True), unique=True, index=True
    )
    hhs_id: Mapped[Optional[str]]
    email: Mapped[str] = mapped_column(index=True, nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(nullable=True)
    full_name: Mapped[str] = column_property(first_name + " " + last_name)
    division: Mapped[Optional[int]] = mapped_column(
        ForeignKey("division.id", name="fk_user_division")
    )
    status: Mapped[UserStatus] = mapped_column(
        ENUM(UserStatus), nullable=False, server_default=UserStatus.INACTIVE.name
    )

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

    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        foreign_keys="UserSession.user_id",
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

    name: Mapped[str] = mapped_column(index=True)
    permissions: Mapped[str]

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
    name: Mapped[str] = mapped_column(index=True)

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
