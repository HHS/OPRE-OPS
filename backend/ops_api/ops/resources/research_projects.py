from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

import desert
from flask import Response, current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from marshmallow import fields
from models import CAN, Agreement, BudgetLineItem, MethodologyType, OpsEventType, PopulationType, User
from models.base import BaseModel
from models.cans import CANFiscalYear
from models.research_projects import ResearchProject
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.auth import is_authorized
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from sqlalchemy.future import select
from typing_extensions import override

ENDPOINT_STRING = "/research-projects"


@dataclass
class TeamLeaders:
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None


@dataclass
class RequestBody:
    title: str
    short_title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    origination_date: Optional[date] = fields.Date(
        format="%Y-%m-%d",
        default=None,
    )
    methodologies: Optional[list[MethodologyType]] = fields.List(
        fields.Enum(MethodologyType),
        default=[],
    )
    populations: Optional[list[PopulationType]] = fields.List(
        fields.Enum(PopulationType),
        default=[],
    )
    team_leaders: Optional[list[TeamLeaders]] = fields.List(
        fields.Nested(TeamLeaders),
        default=[],
    )


@dataclass
class ResearchProjectResponse:
    id: int
    title: str
    created_by: int
    short_title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    origination_date: Optional[date] = fields.Date(format="%Y-%m-%d", default=None)
    methodologies: Optional[list[MethodologyType]] = fields.List(fields.Enum(MethodologyType), default=[])
    populations: Optional[list[PopulationType]] = fields.List(fields.Enum(PopulationType), default=[])
    team_leaders: Optional[list[TeamLeaders]] = fields.List(fields.Nested(TeamLeaders), default=[])
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%f")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%f")


class ResearchProjectItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @override
    @jwt_required()
    @is_authorized("GET_RESEARCH_PROJECTS")
    def get(self, id: int) -> Response:
        response = self._get_item_with_try(id)
        return response


class ResearchProjectListAPI(BaseListAPI):
    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)
        self._post_schema = desert.schema(RequestBody)
        self._response_schema = desert.schema(ResearchProjectResponse)

    @staticmethod
    def _get_query(fiscal_year=None, portfolio_id=None, search=None):
        stmt = (
            select(ResearchProject)
            .distinct(ResearchProject.id)
            .join(Agreement, isouter=True)
            .join(BudgetLineItem, isouter=True)
            .join(CAN, isouter=True)
            .join(CANFiscalYear, isouter=True)
        )

        query_helper = QueryHelper(stmt)

        if portfolio_id:
            query_helper.add_column_equals(CAN.managing_portfolio_id, portfolio_id)

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
            response = make_response_with_headers([i.to_dict() for item in result for i in item])
        else:
            response = make_response_with_headers([], 401)

        return response

    @override
    @jwt_required()
    def post(self) -> Response:
        try:
            with OpsEventHandler(OpsEventType.CREATE_RESEARCH_PROJECT) as meta:
                errors = self._post_schema.validate(request.json)

                if errors:
                    current_app.logger.error(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")
                    raise RuntimeError(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")

                data = self._post_schema.load(request.json)

                # save to tmp var as a workaround for the issue of the SQLAlchemy constructor
                # not taking the list[TeamLeaders] correctly for team_leaders
                tmp_team_leaders = data.team_leaders if data.team_leaders else []

                data.team_leaders = []
                new_rp = ResearchProject(**data.__dict__)

                new_rp.team_leaders.extend([current_app.db_session.get(User, tl_id.id) for tl_id in tmp_team_leaders])

                token = verify_jwt_in_request()
                user = get_user_from_token(token[1])
                new_rp.created_by = user.id

                current_app.db_session.add(new_rp)
                current_app.db_session.commit()

                new_rp_dict = self._response_schema.dump(new_rp)
                meta.metadata.update({"New RP": new_rp_dict})
                current_app.logger.info(f"POST to {ENDPOINT_STRING}: New ResearchProject created: {new_rp_dict}")

                return make_response_with_headers(new_rp_dict, 201)
        except (RuntimeError, PendingRollbackError) as re:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: {re}")
            return make_response_with_headers({}, 400)
        except SQLAlchemyError as se:
            current_app.logger.error(f"POST to {ENDPOINT_STRING}: {se}")
            return make_response_with_headers({}, 500)
