from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Optional, Sequence

from loguru import logger
from sqlalchemy import distinct, or_, select
from sqlalchemy.orm import selectinload

from models import (
    CAN,
    AdministrativeAndSupportProject,
    Agreement,
    BudgetLineItem,
    BudgetLineItemStatus,
    Portfolio,
    Project,
    ProjectSortCondition,
    ProjectType,
    ResearchProject,
    User,
)
from ops_api.ops.services.ops_service import OpsService, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.query_helpers import QueryHelper


@dataclass
class ProjectFilters:
    """Data class to encapsulate all filter parameters for Projects."""

    fiscal_year: Optional[list[int]] = None
    portfolio_id: Optional[list[int]] = None
    project_search: Optional[list[str]] = None
    agreement_search: Optional[list[str]] = None
    project_type: Optional[list[ProjectType]] = None
    limit: Optional[list[int]] = None
    offset: Optional[list[int]] = None

    @classmethod
    def parse_filters(cls, data: dict) -> "ProjectFilters":
        """Parse filter parameters from request data."""
        return cls(
            fiscal_year=data.get("fiscal_year", []) if data else [],
            portfolio_id=data.get("portfolio_id", []) if data else [],
            project_search=data.get("project_search", []) if data else [],
            agreement_search=data.get("agreement_search", []) if data else [],
            project_type=data.get("project_type", []) if data else [],
            limit=data.get("limit", [10]) if data else [10],
            offset=data.get("offset", [0]) if data else [0],
        )


class ProjectsService(OpsService[Project]):
    def __init__(self, db_session):
        self.db_session = db_session

    def _update_fields(self, old_project: Project, project_update) -> bool:
        """
        Update fields on the Project based on the fields passed in project_update.
        Returns true if any fields were updated.
        """
        is_changed = False
        for attr, value in project_update.items():
            if getattr(old_project, attr) != value:
                setattr(old_project, attr, value)
                is_changed = True

        return is_changed

    def _check_immutable_fields(self, project, updated_fields) -> None:
        """
        Validate that the immutable fields are not changed on the project.
        Raises ValidationError if any fields are invalid.
        """
        # Validate that immutable fields aren't being changed
        if "id" in updated_fields and project.id != updated_fields.get("id"):
            raise ValidationError({"id": ["ID cannot be changed"]})

        if "project_type" in updated_fields and project.project_type != updated_fields.get("project_type"):
            raise ValidationError({"project_type": ["Project type cannot be changed"]})

    def _validate_and_convert_team_leaders(self, team_leaders_data) -> list[User]:
        """
        Validate that the team leaders provided are valid users and convert them to User objects.
        Raises ValidationError if any team leader IDs are invalid.
        """
        tl_users = []
        for tl_id in team_leaders_data:
            team_leader = self.db_session.get(User, tl_id["id"])
            if team_leader is None:
                logger.error(f"Provided invalid Team Leader {tl_id['id']}")
                raise ValidationError(
                    {
                        "team_leaders": f"Team leader provided with id {tl_id['id']} does not exist. All team leaders must be valid users."
                    }
                )
            else:
                tl_users.append(team_leader)
        return tl_users

    def create(self, data: dict[str, Any]) -> Project:
        """
        Create a new project.

        Args:
            create_request: Dictionary containing project data

        Returns:
            Tuple containing:
                - project: The created Project instance
                - metadata: Dictionary with creation metadata
        """

        tl_users = []
        # Pop team_leaders from data and convert from list of dicts with id to list of User objects, validating that each team leader exists
        for tl_id in data.pop("team_leaders", []):
            team_leader = self.db_session.get(User, tl_id["id"])
            if team_leader is None:
                logger.error(f"POST to Provided invalid Team Leader {tl_id['id']}")
                raise ValidationError(
                    {
                        "team_leader": f"Team leader provided with id {tl_id['id']} does not exist. All team leaders must be valid users."
                    }
                )
            else:
                tl_users.append(team_leader)

        sorted_tl_users = sorted(tl_users, key=lambda x: x.id)

        project_type = data.get("project_type", None)
        if project_type == ProjectType.RESEARCH:
            new_project = ResearchProject(**data)
        elif project_type == ProjectType.ADMINISTRATIVE_AND_SUPPORT:
            # remove origination_date if it's present since it's not a field on AdministrativeAndSupportProject
            data.pop("origination_date", None)
            new_project = AdministrativeAndSupportProject(**data)
        else:
            raise ValidationError({"project_type": "Invalid project type."})

        # convert team leaders from key value pair to user object on ResearchProject
        new_project.team_leaders = sorted_tl_users

        self.db_session.add(new_project)
        self.db_session.commit()

        return new_project

    def update(self, id: int, updated_fields: dict[str, Any]) -> tuple[Project, int]:
        """
        Update an existing project.

        Args:
            id: Project ID
            updated_fields: Dictionary containing fields to update

        Returns:
            Tuple containing:
                - project: The updated Project instance
                - status_code: HTTP status code (200)

        Raises:
            ResourceNotFoundError: If the project doesn't exist
            ValidationError: If trying to change immutable fields or invalid data
        """
        # Get the existing project
        project = self.db_session.get(Project, id)
        if not project:
            raise ResourceNotFoundError("Project", id)

        self._check_immutable_fields(project, updated_fields)

        # Remove origination_date if updating an admin project (not a valid field for that type)
        if project.project_type == ProjectType.ADMINISTRATIVE_AND_SUPPORT:
            updated_fields.pop("origination_date", None)

        # Handle team_leaders if provided
        tl_users = None
        if "team_leaders" in updated_fields:
            tl_users = self._validate_and_convert_team_leaders(updated_fields["team_leaders"])

            # Remove team_leaders dict from updated_fields as we'll set it directly
            updated_fields.pop("team_leaders")
            project.team_leaders = tl_users

        self._update_fields(project, updated_fields)

        try:
            self.db_session.merge(project)
            self.db_session.commit()
            return project, 200
        except Exception as e:
            self.db_session.rollback()
            logger.error(f"Failed to update project id={id}: {e}")
            raise

    def delete(self, id: int) -> None:
        """
        Delete a project.

        Args:
            id: Project ID

        Raises:
            ResourceNotFoundError: If the project doesn't exist
            ValidationError: If the project has associated agreements
        """
        project = self.db_session.get(Project, id)

        if not project:
            raise ResourceNotFoundError("Project", id)

        # Prevent deletion if project has associated agreements
        if project.agreements:
            raise ValidationError({"agreements": ["Cannot delete a project that has associated agreements."]})

        self.db_session.delete(project)
        self.db_session.commit()

    @staticmethod
    def _get_research_projects_query(filters: ProjectFilters):
        """Build query for research projects with filtering.

        Args:
            filters: ProjectFilters object containing filter parameters

        Returns:
            SQLAlchemy select statement
        """
        stmt = (
            select(ResearchProject)
            .distinct(ResearchProject.id)
            .join(Agreement, isouter=True)
            .join(BudgetLineItem, isouter=True)
            .join(CAN, isouter=True)
            .options(
                selectinload(ResearchProject.agreements).selectinload(Agreement.services_components),
                selectinload(ResearchProject.agreements)
                .selectinload(Agreement.budget_line_items)
                .selectinload(BudgetLineItem.can),
                selectinload(ResearchProject.agreements).selectinload(Agreement.special_topics),
                selectinload(ResearchProject.agreements).selectinload(Agreement.research_methodologies),
                selectinload(ResearchProject.agreements).selectinload(Agreement.team_members),
            )
        )

        query_helper = QueryHelper(stmt)

        # Apply portfolio filter (OR logic - match any portfolio)
        if filters.portfolio_id:
            query_helper.add_column_in_list(CAN.portfolio_id, filters.portfolio_id)

        # Apply fiscal year filter (OR logic - match any fiscal year)
        if filters.fiscal_year:
            if len(filters.fiscal_year) == 1:
                fiscal_year = filters.fiscal_year[0]
                query_helper.add_column_equals(BudgetLineItem.fiscal_year, fiscal_year)
            else:
                # Multiple fiscal years - use IN clause
                query_helper.add_column_in_list(BudgetLineItem.fiscal_year, filters.fiscal_year)

        # Apply project search filter on project title (OR logic, exact match on title/short title)
        if filters.project_search:
            query_helper.where_clauses.append(
                or_(Project.title.in_(filters.project_search), Project.short_title.in_(filters.project_search))
            )

        # Apply agreement search filter on agreement name and nick_name (exact match - OR logic)
        # Projects are returned if any agreement has name OR nick_name matching any search term
        if filters.agreement_search:
            query_helper.where_clauses.append(
                or_(Agreement.name.in_(filters.agreement_search), Agreement.nick_name.in_(filters.agreement_search))
            )

        stmt = query_helper.get_stmt()
        logger.debug(f"SQL: {stmt}")

        return stmt

    @staticmethod
    def _get_administrative_and_support_projects_query(filters: ProjectFilters):
        """Build query for administrative and support projects with filtering.

        Args:
            filters: ProjectFilters object containing filter parameters

        Returns:
            SQLAlchemy select statement
        """
        stmt = (
            select(AdministrativeAndSupportProject)
            .distinct(AdministrativeAndSupportProject.id)
            .join(Agreement, isouter=True)
            .join(BudgetLineItem, isouter=True)
            .join(CAN, isouter=True)
            .options(
                selectinload(ResearchProject.agreements).selectinload(Agreement.services_components),
                selectinload(ResearchProject.agreements)
                .selectinload(Agreement.budget_line_items)
                .selectinload(BudgetLineItem.can),
                selectinload(ResearchProject.agreements).selectinload(Agreement.special_topics),
                selectinload(ResearchProject.agreements).selectinload(Agreement.research_methodologies),
                selectinload(ResearchProject.agreements).selectinload(Agreement.team_members),
            )
        )

        query_helper = QueryHelper(stmt)

        # Apply portfolio filter (OR logic - match any portfolio)
        if filters.portfolio_id:
            query_helper.add_column_in_list(CAN.portfolio_id, filters.portfolio_id)

        # Apply fiscal year filter (OR logic - match any fiscal year)
        if filters.fiscal_year:
            if len(filters.fiscal_year) == 1:
                fiscal_year = filters.fiscal_year[0]
                query_helper.add_column_equals(BudgetLineItem.fiscal_year, fiscal_year)
            else:
                # Multiple fiscal years - use IN clause
                query_helper.add_column_in_list(BudgetLineItem.fiscal_year, filters.fiscal_year)

        # Apply project search filter on project title (AND logic - must match all search terms)
        if filters.project_search:
            query_helper.where_clauses.append(
                or_(
                    Project.title.in_(filters.project_search),
                    Project.short_title.in_(filters.project_search),
                )
            )

        # Apply agreement search filter on agreement name and nick_name (exact match - OR logic)
        # Projects are returned if any agreement has name OR nick_name matching any search term
        if filters.agreement_search:
            query_helper.where_clauses.append(
                or_(Agreement.name.in_(filters.agreement_search), Agreement.nick_name.in_(filters.agreement_search))
            )

        stmt = query_helper.get_stmt()
        logger.debug(f"SQL: {stmt}")

        return stmt

    def get(self, id: int) -> Project:
        """
        Get a project by ID.

        Args:
            id: Project ID

        Returns:
            The Project instance
        """

        project = self.db_session.get(Project, id)
        if not project:
            raise ResourceNotFoundError("Project", id)
        return project

    def get_project_funding(self, id: int, fiscal_year: int) -> dict:
        """
        Get funding summary for a project, with relationships eager-loaded to prevent N+1 queries.

        Args:
            id: Project ID
            fiscal_year: Fiscal year to scope carry-forward/new classification and FY-specific funding.

        Returns:
            Dict with funding_by_portfolio, funding_by_can, funding_by_fiscal_year, and cans.

        Raises:
            ResourceNotFoundError: If the project doesn't exist.
        """
        stmt = (
            select(Project)
            .where(Project.id == id)
            .options(
                selectinload(Project.agreements)
                .selectinload(Agreement.budget_line_items)
                .selectinload(BudgetLineItem.can)
                .options(
                    selectinload(CAN.funding_budgets),
                    selectinload(CAN.funding_details),
                    selectinload(CAN.portfolio),
                )
            )
        )
        project = self.db_session.scalar(stmt)
        if not project:
            raise ResourceNotFoundError("Project", id)

        return project.get_project_funding(fiscal_year)

    @staticmethod
    def _get_project_sort_key(
        project: Project,
        sort_field: str | None,
        sort_fiscal_year: int | None,
        metadata_cache: dict,
        sort_descending: bool = False,
    ) -> Any:
        """
        Generate a sort key for a project based on the sort field.

        Args:
            project: The project to generate a sort key for
            sort_field: The field to sort by (must match ProjectSortCondition enum values)
            sort_fiscal_year: The fiscal year to use when sorting by FY_TOTAL
            metadata_cache: Dictionary mapping project IDs to their project_list_metadata results
            sort_descending: Whether the sort is descending (affects None handling for date fields)

        Returns:
            A sortable key value
        """
        if not sort_field:
            return project.id

        try:
            sort_condition = ProjectSortCondition(sort_field)
        except ValueError:
            # Invalid sort_field, default to id
            return project.id

        if sort_condition == ProjectSortCondition.TITLE:
            return (project.title or "").lower()
        elif sort_condition == ProjectSortCondition.PROJECT_TYPE:
            return project.project_type.value if project.project_type else ""
        elif sort_condition == ProjectSortCondition.PROJECT_START:
            metadata = metadata_cache[project.id]
            # Handle None values by sorting them last
            # When descending, invert the boolean so None still comes last after reversal
            is_none = metadata["project_start"] is None
            return (is_none if not sort_descending else not is_none, metadata["project_start"])
        elif sort_condition == ProjectSortCondition.PROJECT_END:
            metadata = metadata_cache[project.id]
            # Handle None values by sorting them last
            # When descending, invert the boolean so None still comes last after reversal
            is_none = metadata["project_end"] is None
            return (is_none if not sort_descending else not is_none, metadata["project_end"])
        elif sort_condition == ProjectSortCondition.FY_TOTAL:
            metadata = metadata_cache[project.id]
            # Get fiscal year total, defaulting to 0 if not present
            fy_total = metadata["by_fiscal_year"].get(sort_fiscal_year, 0) if sort_fiscal_year else 0
            return fy_total
        elif sort_condition == ProjectSortCondition.PROJECT_TOTAL:
            metadata = metadata_cache[project.id]
            return metadata["total"]
        else:
            return project.id

    @staticmethod
    def _compute_scoped_amount(project: Project, portfolio_ids: set[int], fiscal_years: set[int] | None) -> Decimal:
        """Compute the total BLI amount for a project scoped to the given portfolio(s) and optional fiscal years."""
        total = Decimal("0")
        for agreement in project.agreements:
            for bli in agreement.budget_line_items:
                if (bli.is_obe or bli.status != BudgetLineItemStatus.DRAFT) and bli.fiscal_year is not None:
                    if bli.can and bli.can.portfolio_id in portfolio_ids:
                        if fiscal_years is None or bli.fiscal_year in fiscal_years:
                            total += (bli.amount or Decimal("0")) + (bli.fees or Decimal("0"))
        return total

    def get_list(self, data: dict[str, Any] | None = None) -> tuple[Sequence[Project], dict[str, Any]]:
        """
        Get list of projects with optional filtering and pagination.

        Args:
            data: Dictionary containing filter parameters (all as lists) including limit and offset

        Returns:
            Tuple of (research_projects, administrative_and_support_projects, metadata)
            where metadata includes count, limit, and offset
        """
        filters = ProjectFilters.parse_filters(data)

        # Extract first value from sort parameter lists (only first value is used)
        sort_field_list = data.get("sort_field", [])
        sort_field = sort_field_list[0] if sort_field_list else None

        sort_descending_list = data.get("sort_descending", [])
        sort_descending = sort_descending_list[0] if sort_descending_list else False

        sort_fiscal_year_list = data.get("sort_fiscal_year", [])
        sort_fiscal_year = sort_fiscal_year_list[0] if sort_fiscal_year_list else None

        research_projects = []
        administrative_and_support_projects = []

        # If no project types specified, query both types
        # If project types specified, only query the specified types
        should_query_research = not filters.project_type or ProjectType.RESEARCH in filters.project_type
        should_query_admin = not filters.project_type or ProjectType.ADMINISTRATIVE_AND_SUPPORT in filters.project_type

        if should_query_research:
            research_stmt = ProjectsService._get_research_projects_query(filters)
            value = research_stmt.compile(compile_kwargs={"literal_binds": True})
            logger.debug(f"Compiled SQL for research projects: {value}")
            research_projects = list(self.db_session.scalars(research_stmt).all())

        if should_query_admin:
            administrative_and_support_stmt = ProjectsService._get_administrative_and_support_projects_query(filters)
            administrative_and_support_projects = list(self.db_session.scalars(administrative_and_support_stmt).all())

        # Combine results for pagination
        all_projects = research_projects + administrative_and_support_projects

        # Memoize project_list_metadata to prevent repeat calculations
        metadata_cache = {}
        for project in all_projects:
            metadata_cache[project.id] = project.project_list_metadata

        # Sort projects using the extracted sort key function
        sorted_projects = sorted(
            all_projects,
            key=lambda p: self._get_project_sort_key(p, sort_field, sort_fiscal_year, metadata_cache, sort_descending),
            reverse=sort_descending,
        )

        # Calculate total count before pagination
        total_count = len(sorted_projects)

        # Compute summary over full filtered set
        selected_fiscal_years = set(filters.fiscal_year) if filters.fiscal_year else None
        portfolio_id_set = set(filters.portfolio_id) if filters.portfolio_id else None

        projects_by_type = {t.name: 0 for t in ProjectType}
        amounts_by_type = {t.name: Decimal("0") for t in ProjectType}

        for project in all_projects:
            type_name = project.project_type.name
            projects_by_type[type_name] += 1

            if portfolio_id_set:
                # Scope amounts to only BLIs whose CAN belongs to the filtered portfolio(s)
                amounts_by_type[type_name] += self._compute_scoped_amount(
                    project, portfolio_id_set, selected_fiscal_years
                )
            else:
                pm = metadata_cache[project.id]
                if selected_fiscal_years:
                    for fy in selected_fiscal_years:
                        if fy in pm["by_fiscal_year"]:
                            amounts_by_type[type_name] += pm["by_fiscal_year"][fy]
                else:
                    amounts_by_type[type_name] += pm["total"]

        total_amount = sum(amounts_by_type.values())
        summary = {
            "total_projects": total_count,
            "projects_by_type": dict(projects_by_type),
            "amounts_by_type": {
                k: {
                    "amount": float(v),
                    "percent": round(float(v / total_amount * 100), 1) if total_amount else 0.0,
                }
                for k, v in amounts_by_type.items()
            },
        }

        # Apply pagination
        limit_value = filters.limit[0] if filters.limit else 10
        offset_value = filters.offset[0] if filters.offset else 0

        paginated_projects = sorted_projects[offset_value : offset_value + limit_value]

        metadata = {
            "count": total_count,
            "limit": limit_value,
            "offset": offset_value,
            "summary": summary,
        }

        return paginated_projects, metadata

    def get_filter_options(self) -> dict[str, Any]:
        """
        Get filter options for the Project list using optimized database queries.

        PERFORMANCE: Uses database-level aggregation with DISTINCT queries instead of
        loading all agreements into memory. This approach is efficient even with
        thousands of agreements and budget line items.

        Respects the only_my parameter to filter by user association.
        """

        logger.debug("Beginning projects filter queries")

        # Step 1: Build base project IDs subquery with optional user filtering
        base_project_query = select(Project.id)

        project_ids_subquery = base_project_query.subquery()

        # Step 2: Fiscal years - Query BLI fiscal_year - JOIN through Project → Agreement → BLI and get distinct fiscal years
        fiscal_years_query = (
            select(distinct(BudgetLineItem.fiscal_year))
            .join(Agreement, BudgetLineItem.agreement_id == Agreement.id)
            .join(Project, Agreement.project_id == Project.id)
            .where(Project.id.in_(project_ids_subquery))
            .where(BudgetLineItem.fiscal_year.isnot(None))
        )
        fiscal_years = sorted([fy for fy in self.db_session.scalars(fiscal_years_query).all()], reverse=True)

        # Step 3: Portfolios - JOIN through Project → Agreement → BLI → CAN to get distinct portfolio IDs and names associated with projects
        portfolios_query = (
            select(distinct(Portfolio.id), Portfolio.name)
            .join(CAN, Portfolio.id == CAN.portfolio_id)
            .join(BudgetLineItem, CAN.id == BudgetLineItem.can_id)
            .join(Agreement, BudgetLineItem.agreement_id == Agreement.id)
            .join(Project, Agreement.project_id == Project.id)
            .where(Project.id.in_(project_ids_subquery))
        )
        portfolios = [{"id": p_id, "name": p_name} for p_id, p_name in self.db_session.execute(portfolios_query).all()]
        portfolios = sorted(portfolios, key=lambda x: x["name"] if x["name"] else "")

        # Step 4: Project titles
        projects_query = select(distinct(Project.id), Project.title).where(Project.title.isnot(None))
        project_titles = [
            {"id": p_id, "name": p_title} for p_id, p_title in self.db_session.execute(projects_query).all()
        ]
        project_titles = sorted(project_titles, key=lambda x: x["name"])

        # Step 5: Project types - Direct query on project_type column
        project_types_query = (
            select(distinct(Project.project_type))
            .where(Project.id.in_(project_ids_subquery))
            .where(Project.project_type.isnot(None))
        )
        project_types = sorted([pt.name for pt in self.db_session.scalars(project_types_query).all()])

        # Step 6: Agreement names and nick_names - Query both and create a sorted list
        agreement_names_query = (
            select(Agreement.id, Agreement.name, Agreement.nick_name)
            .join(Project, Agreement.project_id == Project.id)
            .where(Project.id.in_(project_ids_subquery))
            .where(Agreement.name.isnot(None))
        )

        # Collect all names and nick_names into a single sorted list
        # Don't need ids because the match query matches directly on name and nick_name.
        agreement_values = set()  # Use set to avoid duplicates
        for _, a_name, a_nick_name in self.db_session.execute(agreement_names_query).all():
            if a_name:
                agreement_values.add(a_name)
            if a_nick_name:
                agreement_values.add(a_nick_name)

        agreement_names = sorted(list(agreement_values))

        # Build response
        filters = {
            "fiscal_years": fiscal_years,
            "portfolios": portfolios,
            "project_titles": project_titles,
            "project_types": project_types,
            "agreement_names": agreement_names,
        }

        return filters
