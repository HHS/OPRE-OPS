from flask import jsonify
from flask import request
from flask import Response
from ops import db
from ops.base_views import BaseItemAPI
from ops.base_views import BaseListAPI
from ops.models.base import BaseModel
from ops.models.cans import CANFiscalYear
from ops.models.research_projects import ResearchProject
from sqlalchemy.future import select
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

    @staticmethod
    def get_query_for_fiscal_year(fiscal_year=None, portfolio_id=None):
        if portfolio_id and fiscal_year:
            stmt = (
                select(ResearchProject)
                .join(ResearchProject.cans)
                .join(CANFiscalYear)
                .where(CANFiscalYear.fiscal_year == fiscal_year)
                .where(ResearchProject.portfolio_id == portfolio_id)
            )
        elif fiscal_year:
            stmt = (
                select(ResearchProject)
                .join(ResearchProject.cans)
                .join(CANFiscalYear)
                .where(CANFiscalYear.fiscal_year == fiscal_year)
            )
        elif portfolio_id:
            stmt = (
                select(ResearchProject)
                .join(ResearchProject.cans)
                .join(CANFiscalYear)
                .where(ResearchProject.portfolio_id == portfolio_id)
            )
        else:
            stmt = select(ResearchProject)

        return stmt

    def get(self) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        portfolio_id = request.args.get("portfolio_id")

        stmt = ResearchProjectListAPI.get_query_for_fiscal_year(
            fiscal_year, portfolio_id
        )
        result = db.session.execute(stmt).all()

        return jsonify([i.to_dict() for item in result for i in item])
