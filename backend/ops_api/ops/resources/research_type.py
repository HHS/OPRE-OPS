from flask import Response
from typing_extensions import override

from models.projects import ResearchType
from ops_api.ops.auth.auth_enum import Permission, PermissionType
from ops_api.ops.auth.authorization import is_authorized
from ops_api.ops.base_views import EnumListAPI, handle_api_error


class ResearchTypeListAPI(EnumListAPI, enum=ResearchType):  # type: ignore [call-arg]
    @override
    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    @handle_api_error
    def get(self) -> Response:
        return super().get()
