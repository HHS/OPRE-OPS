from models.research_projects import ResearchType
from ops_api.ops.base_views import EnumListAPI


class ResearchTypeListAPI(EnumListAPI, enum=ResearchType):  # type: ignore [call-arg]
    pass