from enum import Enum
from typing import Optional
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Index, Sequence, String, Text
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
    team_lead_id: Mapped[int] = mapped_column(ForeignKey("ops_user.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"project_id={self.project_id};team_lead_id={self.team_lead_id}"


class ProjectType(Enum):
    RESEARCH = 1
    ADMINISTRATIVE_AND_SUPPORT = 2


class ProjectSortCondition(Enum):
    TITLE = "title"
    PROJECT_TYPE = "project_type"
    PROJECT_START = "project_start"
    PROJECT_END = "project_end"
    FY_TOTAL = "fy_total"
    PROJECT_TOTAL = "project_total"


class Project(BaseModel):
    __tablename__ = "project"
    __mapper_args__: dict[str, str | ProjectType] = {
        "polymorphic_identity": "project",
        "polymorphic_on": "project_type",
    }

    id: Mapped[int] = BaseModel.get_pk_column(sequence=Sequence("project_id_seq", start=1000, increment=1))
    project_type: Mapped[ProjectType] = mapped_column(ENUM(ProjectType), nullable=False)
    title: Mapped[str] = mapped_column(String(), nullable=False)
    short_title: Mapped[Optional[str]] = mapped_column(String(), nullable=True)
    description: Mapped[str] = mapped_column(Text(), nullable=False, default="")
    url: Mapped[Optional[str]] = mapped_column(Text(), nullable=True)

    agreements: Mapped[List["Agreement"]] = relationship("Agreement", back_populates="project")
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

    @property
    def project_metadata(self) -> dict:
        """
        Calculate a set of extra metadata about the project that is needed for various endpoints.

        Returns a dict with:
        - special_topics: Set of unique special topics across all agreements in the project
        - research_methodologies: Set of unique research methodologies across all agreements in the project
        - project_start: Earliest period_start across all services_components in all agreements
        - project_end: Latest period_end across all services_components in all agreements
        - team_members: List of unique team members across all agreements
        - division_directors: Set of unique division directors across all agreements
        """
        special_topics_set = set()
        research_methodologies_set = set()
        start_dates = []
        end_dates = []
        team_members_dict = {}
        division_directors_set = set()

        for agreement in self.agreements:
            for special_topic in agreement.special_topics:
                special_topics_set.add(special_topic.name)
            for research_methodology in agreement.research_methodologies:
                research_methodologies_set.add(research_methodology.name)

            # Collect unique team members
            for team_member in agreement.team_members:
                team_members_dict[team_member.id] = team_member

            # Collect division directors
            for director in agreement.division_directors:
                division_directors_set.add(director)

            # Collect all services_component dates
            for sc in agreement.services_components:
                if sc.period_start is not None:
                    start_dates.append(sc.period_start)
                if sc.period_end is not None:
                    end_dates.append(sc.period_end)
        return {
            "special_topics": sorted(list(special_topics_set)),
            "research_methodologies": sorted(list(research_methodologies_set)),
            "project_start": min(start_dates) if start_dates else None,
            "project_end": max(end_dates) if end_dates else None,
            "team_members": sorted(team_members_dict.values(), key=lambda x: x.full_name if x.full_name else x.email),
            "division_directors": sorted(list(division_directors_set)),
        }

    @property
    def project_list_metadata(self) -> dict:
        """
        Calculate a set of extra metadata that is needed for the project list endpoint to render

        Returns a dict with:
        - total: Total value of all agreements (sum of agreement_total for each)
        - by_fiscal_year: Dict mapping fiscal year to total BLI value for that year (non-DRAFT BLIs only)
        - project_start: Earliest period_start across all services_components in all agreements
        - project_end: Latest period_end across all services_components in all agreements
        - agreement_name_list: List of dicts with agreement id and name (nick_name if available, otherwise title)
        """
        from collections import defaultdict
        from models.budget_line_items import BudgetLineItemStatus

        total = Decimal("0")
        by_fiscal_year = defaultdict(lambda: Decimal("0"))
        start_dates = []
        end_dates = []
        agreement_name_list = []

        for agreement in self.agreements:
            # Add agreement total to overall total
            total += agreement.agreement_total
            if agreement.nick_name:
                agreement_name_list.append({"id": agreement.id, "name": agreement.nick_name})
            else:
                agreement_name_list.append({"id": agreement.id, "name": agreement.name})

            for bli in agreement.budget_line_items:
                # Include BLIs that are: (1) OBE items (regardless of status), OR (2) non-DRAFT items
                # AND must have a fiscal_year assigned
                if (bli.is_obe or bli.status != BudgetLineItemStatus.DRAFT) and bli.fiscal_year is not None:
                    # Include amount + fees for the BLI
                    bli_total = (bli.amount or Decimal("0")) + (bli.fees or Decimal("0"))
                    by_fiscal_year[bli.fiscal_year] += bli_total

            # Collect all services_component dates
            for sc in agreement.services_components:
                if sc.period_start is not None:
                    start_dates.append(sc.period_start)
                if sc.period_end is not None:
                    end_dates.append(sc.period_end)

        return {
            "total": total,
            "by_fiscal_year": dict(by_fiscal_year),
            "project_start": min(start_dates) if start_dates else None,
            "project_end": max(end_dates) if end_dates else None,
            "agreement_name_list": agreement_name_list,
        }


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
