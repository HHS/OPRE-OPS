from models.base import BaseModel
from sqlalchemy import Column, Date, ForeignKey, Identity, Integer, String, Table, Text, event
from sqlalchemy.engine import Connection
from sqlalchemy.orm import relationship
from typing_extensions import override

research_project_cans = Table(
    "research_project_cans",
    BaseModel.metadata,
    Column("research_project_id", ForeignKey("research_project.id"), primary_key=True),
    Column("can_id", ForeignKey("can.id"), primary_key=True),
)

research_project_methodologies = Table(
    "research_project_methodologies",
    BaseModel.metadata,
    Column("research_project_id", ForeignKey("research_project.id"), primary_key=True),
    Column("methodology_type_id", ForeignKey("methodology_type.id"), primary_key=True),
)

research_project_populations = Table(
    "research_project_populations",
    BaseModel.metadata,
    Column("research_project_id", ForeignKey("research_project.id"), primary_key=True),
    Column("population_type_id", ForeignKey("population_type.id"), primary_key=True),
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
    methodologies = relationship(
        "MethodologyType", secondary=research_project_methodologies
    )
    populations = relationship("PopulationType", secondary=research_project_populations)
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
            methodologies=[
                methodologies.to_dict() for methodologies in self.methodologies
            ],
            populations=[populations.to_dict() for populations in self.populations],
            team_leaders=[tl.to_dict() for tl in self.team_leaders],
        )

        return d


class MethodologyType(BaseModel):
    __tablename__ = "methodology_type"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)


class PopulationType(BaseModel):
    __tablename__ = "population_type"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)


@event.listens_for(BaseModel.metadata.tables["methodology_type"], "after_create")
def initial_data_methodology_type(
    target: Table,
    connection: Connection,
    **kwargs: dict,
) -> None:
    # These are example methodologies derived from:
    # https://openstax.org/books/introduction-sociology-3e/pages/2-2-research-methods
    connection.execute(
        target.insert(),
        (
            {"id": 1, "name": "Survey"},
            {"id": 2, "name": "Field Research"},
            {"id": 3, "name": "Participant Observation"},
            {"id": 4, "name": "Ethnography"},
            {"id": 5, "name": "Experiment"},
            {"id": 6, "name": "Secondary Data Analysis"},
            {"id": 7, "name": "Case Study"},
        ),
    )


@event.listens_for(BaseModel.metadata.tables["population_type"], "after_create")
def initial_data_population_type(
    target: Table,
    connection: Connection,
    **kwargs: dict,
) -> None:
    # These are example methodologies derived from:
    # https://openstax.org/books/introduction-sociology-3e/pages/2-2-research-methods
    connection.execute(
        target.insert(),
        (
            {"id": 1, "name": "Population #1"},
            {"id": 2, "name": "Population #2"},
            {"id": 3, "name": "Population #3"},
        ),
    )
