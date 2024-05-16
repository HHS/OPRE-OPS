from flask import Response

from models.projects import ResearchType
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import check_user_session, is_authorized
from ops_api.ops.base_views import EnumListAPI, handle_api_error


class ResearchTypeListAPI(EnumListAPI, enum=ResearchType):  # type: ignore [call-arg]
    @handle_api_error
    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    @check_user_session
    def get(self) -> Response:
        return super().get()
