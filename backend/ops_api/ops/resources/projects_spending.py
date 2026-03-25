from flask import Response, current_app

from models import Project
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.project_spending import ProjectSpendingMetadataSchema
from ops_api.ops.services.ops_service import ResourceNotFoundError
from ops_api.ops.utils.response import make_response_with_headers


class ProjectSpendingItemAPI(BaseItemAPI):
    """API endpoint for retrieving project spending metadata by ID"""

    def __init__(self, model: BaseModel = Project):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self, id: int) -> Response:
        """
        GET /projects-spending/<int:id>

        Returns project spending metadata including:
        - Total spending across all agreements
        - Spending totals by fiscal year
        - Spending breakdown by type (contract, grant, partner, direct_obligation) per fiscal year
        - Agreements grouped by fiscal year

        Args:
            id: Project ID

        Returns:
            JSON response with project spending metadata

        Raises:
            ResourceNotFoundError: If the project doesn't exist (returns 404)
        """
        # Check if project exists
        project = current_app.db_session.get(Project, id)
        if not project:
            raise ResourceNotFoundError("Project", id)

        # Get the project_list_metadata
        metadata = project.project_list_metadata

        # Serialize and return
        schema = ProjectSpendingMetadataSchema()
        return make_response_with_headers(schema.dump(metadata))
