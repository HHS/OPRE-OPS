from enum import Enum

import sqlalchemy as sa
import sqlalchemy.dialects.postgresql as pg
from models.base import BaseModel
from sqlalchemy import Column, Date, ForeignKey, Identity, Integer, String, Table, Text
from sqlalchemy.orm import relationship
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


research_project_cans = Table(
    "research_project_cans",
    BaseModel.metadata,
    Column("research_project_id", ForeignKey("research_project.id"), primary_key=True),
    Column("can_id", ForeignKey("can.id"), primary_key=True),
)

research_project_team_leaders = Table(
    "research_project_team_leaders",
    BaseModel.metadata,
    Column("research_project_id", ForeignKey("research_project.id"), primary_key=True),
    Column("team_lead_id", ForeignKey("users.id"), primary_key=True),
)


class ResearchProject(BaseModel):
    __tablename__ = "research_project"
    id = Column(Integer, Identity(), primary_key=True)
    title = Column(String, nullable=False)
    short_title = Column(String)
    description = Column(Text)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"))
    portfolio = relationship("Portfolio", back_populates="research_project")
    url = Column(String)
    origination_date = Column(Date)
    methodologies = Column(pg.ARRAY(sa.Enum(MethodologyType)))
    populations = Column(pg.ARRAY(sa.Enum(PopulationType)))
    cans = relationship("CAN", back_populates="managing_research_project")
    team_leaders = relationship(
        "User",
        back_populates="research_projects",
        secondary=research_project_team_leaders,
    )

    @override
    def to_dict(self):
        d = super().to_dict()

        d.update(
            origination_date=self.origination_date.isoformat()
            if self.origination_date
            else None,
            cans=[can.to_dict() for can in self.cans],
            methodologies=[methodologies.name for methodologies in self.methodologies],
            populations=[populations.name for populations in self.populations],
            team_leaders=[tl.to_dict() for tl in self.team_leaders],
        )

        return d
