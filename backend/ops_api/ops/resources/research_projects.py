from flask import Response, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models.base import BaseModel
from models.cans import CANFiscalYear
from models.research_projects import ResearchProject
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.query_helpers import QueryHelper
from sqlalchemy.future import select
from typing_extensions import override


class ResearchProjectItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @override
    @jwt_required()
    def get(self, id: int) -> Response:
        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["GET_RESEARCH_PROJECTS"])

        if is_authorized:
            response = self._get_item_with_try(id)
        else:
            response = jsonify({}), 401
            response[0].headers.add("Access-Control-Allow-Origin", "*")

        return response


class ResearchProjectListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @staticmethod
    def _get_query(fiscal_year=None, portfolio_id=None, search=None):
        stmt = (
            select(ResearchProject)
            .distinct(ResearchProject.id)
            .join(ResearchProject.cans, isouter=True)
            .join(CANFiscalYear, isouter=True)
        )

        query_helper = QueryHelper(stmt)

        if portfolio_id:
            query_helper.add_column_equals(ResearchProject.portfolio_id, portfolio_id)

        if fiscal_year:
            query_helper.add_column_equals(CANFiscalYear.fiscal_year, fiscal_year)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(ResearchProject.title, search)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @override
    @jwt_required()
    def get(self) -> Response:
        identity = get_jwt_identity()
        is_authorized = self.auth_gateway.is_authorized(identity, ["GET_RESEARCH_PROJECTS"])

        if is_authorized:
            fiscal_year = request.args.get("fiscal_year")
            portfolio_id = request.args.get("portfolio_id")
            search = request.args.get("search")

            stmt = self._get_query(fiscal_year, portfolio_id, search)

            result = current_app.db_session.execute(stmt).all()
            response = jsonify([i.to_dict() for item in result for i in item])
        else:
            response = jsonify([]), 401

        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
