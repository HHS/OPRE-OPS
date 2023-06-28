from flask import Response
from models.research_projects import ResearchType
from ops_api.ops.base_views import EnumListAPI
from ops_api.ops.utils.auth import is_authorized
from typing_extensions import override


class ResearchTypeListAPI(EnumListAPI, enum=ResearchType):  # type: ignore [call-arg]
    @override
    @is_authorized("GET_RESEARCH_PORJECT", "GET_RESEARCH_PROJECTS")
    def get(self) -> Response:
        return super().get()
