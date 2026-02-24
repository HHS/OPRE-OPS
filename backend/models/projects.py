from enum import Enum
from typing import Optional

import sqlalchemy.dialects.postgresql as pg
from sqlalchemy import Column, Date, ForeignKey, Index, Sequence, String, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing_extensions import List

from models.base import BaseModel

class ResearchType(Enum):
    APPLIED_RESEARCH = 1
    EVALUATIVE_RESEARCH = 2
    PROGRAM_SUPPORT = 3


class ProjectTeamLeaders(BaseModel):
    __tablename__ = "project_team_leaders"

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), primary_key=True)
    team_lead_id: Mapped[int] = mapped_column(
        ForeignKey("ops_user.id"), primary_key=True
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"project_id={self.project_id};team_lead_id={self.team_lead_id}"


class ProjectType(Enum):
    RESEARCH = 1
    ADMINISTRATIVE_AND_SUPPORT = 2


class Project(BaseModel):
    __tablename__ = "project"
    __mapper_args__: dict[str, str | ProjectType] = {
        "polymorphic_identity": "project",
        "polymorphic_on": "project_type",
    }

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("project_id_seq", start=1000, increment=1)
    )
    project_type: Mapped[ProjectType] = mapped_column(ENUM(ProjectType), nullable=False)
    title: Mapped[str] = mapped_column(String(), nullable=False)
    short_title: Mapped[Optional[str]] = mapped_column(String(), nullable=True)
    description: Mapped[str] = mapped_column(Text(), nullable=False, default="")
    url: Mapped[Optional[str]] = mapped_column(Text(), nullable=True)

    agreements: Mapped[List["Agreement"]] = relationship(
        "Agreement", back_populates="project"
    )
    team_leaders: Mapped[List["User"]] = relationship(
        "User",
        back_populates="projects",
        secondary="project_team_leaders",
        primaryjoin="Project.id == ProjectTeamLeaders.project_id",
        secondaryjoin="User.id == ProjectTeamLeaders.team_lead_id",
    )

    __table_args__ = (Index("ix_project_title_pattern", "title", postgresql_ops={"title": "text_pattern_ops"}),)

    @BaseModel.display_name.getter
    def display_name(self):
        return self.title


class ResearchProject(Project):
    __tablename__ = "research_project"
    __mapper_args__ = {
        "polymorphic_identity": ProjectType.RESEARCH,
    }
    id: Mapped[int] = mapped_column(ForeignKey("project.id"), primary_key=True)
    origination_date: Mapped[Optional[Date]] = mapped_column(Date(), nullable=True)


class AdministrativeAndSupportProject(Project):
    __tablename__ = "administrative_and_support_project"
    __mapper_args__ = {
        "polymorphic_identity": ProjectType.ADMINISTRATIVE_AND_SUPPORT,
    }
    id: Mapped[int] = mapped_column(ForeignKey("project.id"), primary_key=True)
