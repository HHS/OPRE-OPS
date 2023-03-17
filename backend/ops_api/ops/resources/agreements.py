from flask import Response, current_app, jsonify, request
from models.base import BaseModel
from models.cans import Agreement
from ops_api.ops import db
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.query_helpers import QueryHelper
from sqlalchemy.future import select
from typing_extensions import override


class AgreementItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @override
    def _get_item(self, id: int) -> Agreement:
        agreement = self.model.query.filter_by(id=id).first_or_404()
        return agreement

    @override
    def get(self, id: int) -> Response:
        agreement = self._get_item(id)
        response = jsonify(agreement.to_dict())
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response


class AgreementListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)

    @staticmethod
    def _get_query(search=None, research_project_id=None):
        stmt = select(Agreement).order_by(Agreement.id)
        query_helper = QueryHelper(stmt)

        if search:
            query_helper.add_search(Agreement.name, search)

        if research_project_id:
            query_helper.add_column_equals(Agreement.research_project_id, research_project_id)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    def get(self) -> Response:
        search = request.args.get("search")
        research_project_id = request.args.get("research_project_id")

        stmt = self._get_query(search, research_project_id)

        result = db.session.execute(stmt).all()

        return jsonify([i.to_dict() for item in result for i in item])
