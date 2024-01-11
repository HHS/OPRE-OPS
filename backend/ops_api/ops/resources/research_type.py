from flask import Response
from models.projects import ResearchType
from ops_api.ops.base_views import EnumListAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from typing_extensions import override


class ResearchTypeListAPI(EnumListAPI, enum=ResearchType):  # type: ignore [call-arg]
    @override
    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    @handle_api_error
    def get(self) -> Response:
        return super().get()
