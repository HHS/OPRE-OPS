from flask import jsonify
from flask import Response
from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from ops.models.base import BaseModel
from ops.models.research_projects import ResearchProject
from typing_extensions import override


class ResearchProjectItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> ResearchProject:
        research_project = self.model.query.filter_by(id=id).first_or_404()
        return research_project

    @override
    def get(self, id: int) -> Response:
        research_project = self._get_item(id)
        response = jsonify(research_project.to_dict())
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response


class ResearchProjectListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
