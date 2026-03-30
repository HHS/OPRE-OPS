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
        project_officer_dict = {}
        alternate_project_officer_dict = {}
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
            for director in agreement.division_director_user_list:
                division_directors_set.add(director)

            # Collect all services_component dates
            for sc in agreement.services_components:
                if sc.period_start is not None:
                    start_dates.append(sc.period_start)
                if sc.period_end is not None:
                    end_dates.append(sc.period_end)
            # Collect all project officers
            if agreement.project_officer is not None:
                project_officer_dict[agreement.project_officer.id] = (
                    agreement.project_officer.full_name
                    if agreement.project_officer.full_name
                    else agreement.project_officer.email
                )
            # Collect all alternate project officers
            if agreement.alternate_project_officer is not None:
                alternate_project_officer_dict[agreement.alternate_project_officer.id] = (
                    agreement.alternate_project_officer.full_name
                    if agreement.alternate_project_officer.full_name
                    else agreement.alternate_project_officer.email
                )
        return {
            "special_topics": sorted(list(special_topics_set)),
            "research_methodologies": sorted(list(research_methodologies_set)),
            "project_start": min(start_dates) if start_dates else None,
            "project_end": max(end_dates) if end_dates else None,
            "team_members": sorted(team_members_dict.values(), key=lambda x: x.full_name if x.full_name else x.email),
            "division_directors": sorted(
                [{"id": d.id, "name": d.full_name if d.full_name else d.email} for d in division_directors_set],
                key=lambda x: x["name"],
            ),
            "project_officers": sorted(
                [{"id": user_id, "name": name} for user_id, name in project_officer_dict.items()], key=lambda x: x["name"]
            ),
            "alternate_project_officers": sorted(
                [{"id": user_id, "name": name} for user_id, name in alternate_project_officer_dict.items()],
                key=lambda x: x["name"],
            ),
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

    def get_project_funding(self, fiscal_year: int) -> dict:
        """
        Calculate project funding summary based on CANFundingBudget records.

        Collects unique CANs associated with this project (via agreements → BLIs → CAN),
        then aggregates their funding budgets.

        Args:
            fiscal_year: The fiscal year to scope carry-forward/new classification and FY-specific funding.

        Returns a dict with:
        - funding_by_portfolio: CANFundingBudget totals grouped by CAN portfolio for the given FY
        - funding_by_can: Carry-forward vs new funding breakdown for the given FY
        - funding_by_fiscal_year: CANFundingBudget totals grouped by fiscal year (all years)
        - cans: Per-CAN detail with FY funding and lifetime funding
        """
        from collections import defaultdict

        # Step 0: Collect unique CANs across all project agreements
        unique_cans: set = set()
        for agreement in self.agreements:
            for bli in agreement.budget_line_items:
                if bli.can:
                    unique_cans.add(bli.can)

        # --- funding_by_portfolio ---
        portfolio_totals: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
        portfolio_names: dict[int, str] = {}
        for can in unique_cans:
            if can.portfolio:
                for fb in can.funding_budgets:
                    if fb.fiscal_year == fiscal_year:
                        portfolio_totals[can.portfolio_id] += fb.budget or Decimal("0")
                        portfolio_names[can.portfolio_id] = can.portfolio.name

        funding_by_portfolio = [
            {"portfolio_id": pid, "portfolio": portfolio_names[pid], "amount": float(amt)}
            for pid, amt in portfolio_totals.items()
        ]

        # --- funding_by_can (carry-forward vs new classification) ---
        new_funding = Decimal("0")
        carry_forward_funding = Decimal("0")
        for can in unique_cans:
            can_new, can_cf = can.classify_funding(fiscal_year)
            new_funding += can_new
            carry_forward_funding += can_cf

        total_funding = carry_forward_funding + new_funding
        funding_by_can = {
            "total": float(total_funding),
            "carry_forward_funding": float(carry_forward_funding),
            "new_funding": float(new_funding),
        }

        # --- funding_by_fiscal_year (all years, not filtered by parameter) ---
        fy_totals: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
        for can in unique_cans:
            for fb in can.funding_budgets:
                fy_totals[fb.fiscal_year] += fb.budget or Decimal("0")

        funding_by_fiscal_year = [{"fiscal_year": fy, "amount": float(amt)} for fy, amt in sorted(fy_totals.items())]

        # --- cans ---
        cans_list = []
        for can in sorted(unique_cans, key=lambda c: c.id):
            fy_funding = sum((fb.budget or Decimal("0")) for fb in can.funding_budgets if fb.fiscal_year == fiscal_year)
            lifetime_funding = sum((fb.budget or Decimal("0")) for fb in can.funding_budgets)
            cans_list.append(
                {
                    "id": can.id,
                    "number": can.number,
                    "portfolio_id": can.portfolio_id,
                    "portfolio": can.portfolio.name if can.portfolio else None,
                    "active_period": can.active_period,
                    "fy_funding": float(fy_funding),
                    "lifetime_funding": float(lifetime_funding),
                }
            )

        return {
            "funding_by_portfolio": funding_by_portfolio,
            "funding_by_can": funding_by_can,
            "funding_by_fiscal_year": funding_by_fiscal_year,
            "cans": cans_list,
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
