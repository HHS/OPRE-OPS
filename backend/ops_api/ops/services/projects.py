from typing import Any, Sequence

from loguru import logger
from sqlalchemy import select

from models import (
    CAN,
    AdministrativeAndSupportProject,
    Agreement,
    BudgetLineItem,
    CANFundingBudget,
    CANFundingDetails,
    Project,
    ProjectType,
    ResearchProject,
    User,
)
from ops_api.ops.services.ops_service import OpsService, ResourceNotFoundError, ValidationError
from ops_api.ops.utils.query_helpers import QueryHelper


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
        if "id" in updated_fields and id != updated_fields.get("id"):
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
                        "team_leader": f"Team leader provided with id {tl_id['id']} does not exist. All team leaders must be valid users."
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
        project_type = data.get("project_type", None)
        if project_type == ProjectType.RESEARCH:
            new_project = ResearchProject(**data)
        elif project_type == ProjectType.ADMINISTRATIVE_AND_SUPPORT:
            # remove origination_date if it's present since it's not a field on AdministrativeAndSupportProject
            data.pop("origination_date", None)
            new_project = AdministrativeAndSupportProject(**data)
        else:
            raise ValidationError({"project_type": "Invalid project type."})

        tl_users = []
        for tl_id in data.get("team_leaders", []):
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
        # convert team leaders from key value pair to user object on ResearchProject
        new_project.team_leaders = tl_users

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
            raise ValidationError(
                {"agreements": ["Cannot delete a project that has associated agreements."]}
            )

        self.db_session.delete(project)
        self.db_session.commit()

    @staticmethod
    def _get_research_projects_query(fiscal_year=None, portfolio_id=None, search=None):
        stmt = (
            select(ResearchProject)
            .distinct(ResearchProject.id)
            .join(Agreement, isouter=True)
            .join(BudgetLineItem, isouter=True)
            .join(CAN, isouter=True)
            .join(CANFundingDetails, isouter=True)
            .join(CANFundingBudget, isouter=True)
        )

        query_helper = QueryHelper(stmt)

        if portfolio_id:
            query_helper.add_column_equals(CAN.portfolio_id, portfolio_id)

        if fiscal_year:
            query_helper.add_column_equals(CANFundingBudget.fiscal_year, fiscal_year)
            # Also ensure that the CANFundingDetails.obligate_by is in or after the fiscal year
            # i.e. the funds are still valid to be used in that fiscal year (not expired)
            query_helper.add_column_in_range(
                CANFundingDetails.fiscal_year,
                CANFundingDetails.obligate_by,
                fiscal_year,
            )

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(ResearchProject.title, search)

        stmt = query_helper.get_stmt()
        logger.debug(f"SQL: {stmt}")

        return stmt

    @staticmethod
    def _get_administrative_and_support_projects_query(fiscal_year=None, portfolio_id=None, search=None):
        stmt = (
            select(AdministrativeAndSupportProject)
            .distinct(AdministrativeAndSupportProject.id)
            .join(Agreement, isouter=True)
            .join(BudgetLineItem, isouter=True)
            .join(CAN, isouter=True)
            .join(CANFundingDetails, isouter=True)
            .join(CANFundingBudget, isouter=True)
        )

        query_helper = QueryHelper(stmt)

        if portfolio_id:
            query_helper.add_column_equals(CAN.portfolio_id, portfolio_id)

        if fiscal_year:
            query_helper.add_column_equals(CANFundingBudget.fiscal_year, fiscal_year)
            # Also ensure that the CANFundingDetails.obligate_by is in or after the fiscal year
            # i.e. the funds are still valid to be used in that fiscal year (not expired)
            query_helper.add_column_in_range(
                CANFundingDetails.fiscal_year,
                CANFundingDetails.obligate_by,
                fiscal_year,
            )

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(AdministrativeAndSupportProject.title, search)

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

    def get_list(
        self, data: dict[str, Any] | None = None
    ) -> tuple[Sequence[ResearchProject], Sequence[AdministrativeAndSupportProject]]:
        """
        Get list of projects with optional filtering and pagination.

        Args:
            data: Dictionary containing filter parameters

        Returns:
            Tuple of (research_projects, administrative_and_support_projects), where each is a list of their respective project types.
        """
        fiscal_year = data.get("fiscal_year", None)
        portfolio_id = data.get("portfolio_id", None)
        search = data.get("search", None)
        project_type = data.get("project_type", None)

        research_project = []
        administrative_and_support_project = []
        if project_type is None or project_type == ProjectType.RESEARCH:
            research_stmt = ProjectsService._get_research_projects_query(fiscal_year, portfolio_id, search)
            research_project = self.db_session.scalars(research_stmt).all()

        if project_type is None or project_type == ProjectType.ADMINISTRATIVE_AND_SUPPORT:
            administrative_and_support_stmt = ProjectsService._get_administrative_and_support_projects_query(
                fiscal_year, portfolio_id, search
            )
            administrative_and_support_project = self.db_session.scalars(administrative_and_support_stmt).all()

        return research_project, administrative_and_support_project
