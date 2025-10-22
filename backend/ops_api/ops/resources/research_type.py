from flask import Response

from models.projects import ResearchType
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import EnumListAPI


class ResearchTypeListAPI(EnumListAPI, enum=ResearchType):  # type: ignore [call-arg]
    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        return super().get()
