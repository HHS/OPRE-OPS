from enum import Enum
from typing import List

import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg
from models.base import BaseModel
from sqlalchemy import Column, Date, ForeignKey, Identity, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing_extensions import override


# These are example methodologies derived from:
# https://openstax.org/books/introduction-sociology-3e/pages/2-2-research-methods
class MethodologyType(Enum):
    SURVEY = 1
    FIELD_RESEARCH = 2
    PARTICIPANT_OBSERVATION = 3
    ETHNOGRAPHY = 4
    EXPERIMENT = 5
    SECONDARY_DATA_ANALYSIS = 6
    CASE_STUDY = 7


class PopulationType(Enum):
    POPULATION_1 = 1
    POPULATION_2 = 2
    POPULATION_3 = 3


class ResearchType(Enum):
    APPLIED_RESEARCH = 1
    EVALUATIVE_RESEARCH = 2
    PROGRAM_SUPPORT = 3


class ProjectCANs(BaseModel):
    __tablename__ = "project_cans"

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), primary_key=True)
    can_id: Mapped[int] = mapped_column(ForeignKey("can.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"project_id={self.project_id};can_id={self.can_id}"


class ProjectTeamLeaders(BaseModel):
    __tablename__ = "project_team_leaders"

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), primary_key=True)
    team_lead_id: Mapped[int] = mapped_column(ForeignKey("user.id"), primary_key=True)

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

    id = Column(Integer, Identity(), primary_key=True)
    project_type = mapped_column(ENUM(ProjectType), nullable=False)
    title = Column(String, nullable=False)
    short_title = Column(String)
    description = Column(Text)
    url = Column(String)
    agreements = relationship("Agreement", back_populates="project")
    team_leaders = relationship(
        "User",
        back_populates="projects",
        secondary="project_team_leaders",
        primaryjoin="Project.id == ProjectTeamLeaders.project_id",
        secondaryjoin="User.id == ProjectTeamLeaders.team_lead_id",
    )

    cans: Mapped[List["CAN"]] = relationship(
        "CAN", secondary="project_cans", back_populates="projects"
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.title


class ResearchProject(Project):
    __tablename__ = "research_project"
    __mapper_args__ = {
        "polymorphic_identity": ProjectType.RESEARCH,
    }
    id: Mapped[int] = mapped_column(ForeignKey("project.id"), primary_key=True)
    origination_date = Column(Date)
    methodologies = Column(
        pg.ARRAY(sa.Enum(MethodologyType)), server_default="{}", default=[]
    )
    populations = Column(
        pg.ARRAY(sa.Enum(PopulationType)), server_default="{}", default=[]
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.title
