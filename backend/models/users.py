"""User models."""
from typing import Any, List, cast

from models import BaseModel
from sqlalchemy import Column, DateTime, ForeignKey, Identity, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from typing_extensions import override


class UserRole(BaseModel):
    __versioned__ = {}
    __tablename__ = "user_role"

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("role.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"User Role: user_id={self.user_id}; role_id={self.role_id}"


class UserGroup(BaseModel):
    __versioned__ = {}
    __tablename__ = "user_group"

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("group.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"User Group: user_id={self.user_id}; group_id={self.group_id}"


class User(BaseModel):
    """Main User model."""

    __versioned__ = {}
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(Integer, Identity(), primary_key=True)
    oidc_id = Column(UUID(as_uuid=True), unique=True, index=True)
    hhs_id = Column(String)
    email = Column(String, index=True, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    full_name = column_property(first_name + " " + last_name)
    date_joined = Column(DateTime, server_default=func.now())
    updated = Column(DateTime, onupdate=func.now())

    division = Column(Integer, ForeignKey("division.id", name="fk_user_division"))

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

    portfolios = relationship(
        "Portfolio",
        back_populates="team_leaders",
        secondary="portfolio_team_leaders",
        viewonly=True,
    )

    research_projects = relationship(
        "ResearchProject",
        back_populates="team_leaders",
        secondary="research_project_team_leaders",
        viewonly=True,
    )

    agreements: Mapped[List["Agreement"]] = relationship(
        "Agreement",
        secondary="agreement_team_members",
        back_populates="team_members",
        primaryjoin="User.id == AgreementTeamMembers.user_id",
        secondaryjoin="Agreement.id == AgreementTeamMembers.agreement_id",
    )

    contracts = relationship(
        "ContractAgreement",
        back_populates="support_contacts",
        secondary="contract_support_contacts",
        viewonly=True,
    )

    notifications = relationship(
        "Notification",
        foreign_keys="Notification.recipient_id",
    )

    def get_user_id(self):
        return self.id

    @BaseModel.display_name.getter
    def display_name(self):
        return self.full_name if self.full_name else self.email

    @override
    def to_dict(self) -> dict[str, Any]:
        d = super().to_dict()

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

    __versioned__ = {}
    __tablename__ = "role"
    id = Column(Integer, Identity(), primary_key=True)
    name = Column(String, index=True, nullable=False)
    permissions = Column(String, nullable=False)

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
    id = Column(Integer, Identity(), primary_key=True)
    name = Column(String, index=True, nullable=False)

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
