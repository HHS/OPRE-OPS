from datetime import date, datetime
from typing import List, Optional, override

from flask import Response, current_app, request
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError

from marshmallow import Schema, fields
from models import (
    CAN,
    Agreement,
    BaseModel,
    BudgetLineItem,
    CANFundingBudget,
    CANFundingDetails,
    MethodologyType,
    OpsEventType,
    PopulationType,
    ProjectType,
    ResearchProject,
    User,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.query_helpers import QueryHelper
from ops_api.ops.utils.response import make_response_with_headers

ENDPOINT_STRING = "/research-projects"


class TeamLeaders(Schema):
    id: int = fields.Int()
    full_name: Optional[str] = fields.String()
    email: Optional[str] = fields.String()


class RequestBody(Schema):
    project_type: ProjectType = fields.Enum(ProjectType)
    title: str = fields.String(required=True)
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    origination_date: Optional[date] = fields.Date(format="%Y-%m-%d", load_default=None, dump_default=None)

    methodologies: Optional[list[MethodologyType]] = fields.List(
        fields.Enum(MethodologyType),
        load_default=[],
        dump_default=[],
    )
    populations: Optional[list[PopulationType]] = fields.List(
        fields.Enum(PopulationType),
        load_default=[],
        dump_default=[],
    )
    team_leaders: Optional[list[TeamLeaders]] = fields.List(
        fields.Nested(TeamLeaders),
        load_default=[],
        dump_default=[],
    )


class ResearchProjectResponse(Schema):
    id: int = fields.Int()
    title: str = fields.String()
    created_by: int = fields.Int()
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    origination_date: Optional[date] = fields.Date(format="%Y-%m-%d", load_default=None, dump_default=None)
    methodologies: Optional[list[MethodologyType]] = fields.List(
        fields.Enum(MethodologyType), load_default=[], dump_default=[]
    )
    populations: Optional[list[PopulationType]] = fields.List(
        fields.Enum(PopulationType), load_default=[], dump_default=[]
    )
    team_leaders: Optional[list[TeamLeaders]] = fields.List(
        fields.Nested(TeamLeaders), load_default=[], dump_default=[]
    )
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    project_type: ProjectType = fields.Enum(ProjectType)


class ResearchProjectItemAPI(BaseItemAPI):
    _response_schema = ResearchProjectResponse()

    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self, id: int) -> Response:
        item = self._get_item(id)
        if item:
            return make_response_with_headers(ResearchProjectItemAPI._response_schema.dump(item))
        else:
            return make_response_with_headers({}, 404)


class ResearchProjectListAPI(BaseListAPI):
    _post_schema = RequestBody()
    _response_schema = ResearchProjectResponse()

    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @override
    @staticmethod
    def _get_query(fiscal_year=None, portfolio_id=None, search=None):
        stmt = (
            select(ResearchProject)
            .distinct(ResearchProject.id)
            .join(Agreement, isouter=True)
            .join(BudgetLineItem, isouter=True)
            .join(CAN, isouter=True)
            .join(CANFundingDetails, isouter=True)
            .join(CANFundingBudget, isouter=True)
        )

        query_helper = QueryHelper(stmt)

        if portfolio_id:
            query_helper.add_column_equals(CAN.portfolio_id, portfolio_id)

        if fiscal_year:
            query_helper.add_column_equals(CANFundingBudget.fiscal_year, fiscal_year)
            # Also ensure that the CANFundingDetails.obligate_by is in or after the fiscal year
            # i.e. the funds are still valid to be used in that fiscal year (not expired)
            query_helper.add_column_greater_than_or_equal(CANFundingDetails.obligate_by, fiscal_year)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(ResearchProject.title, search)

        stmt = query_helper.get_stmt()
        logger.debug(f"SQL: {stmt}")

        return stmt

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        portfolio_id = request.args.get("portfolio_id")
        search = request.args.get("search")

        stmt = ResearchProjectListAPI._get_query(fiscal_year, portfolio_id, search)

        result = current_app.db_session.execute(stmt).all()

        project_response: List[dict] = []
        for item in result:
            for project in item:
                project_response.append(ResearchProjectListAPI._response_schema.dump(project))

        return make_response_with_headers(project_response)

    @is_authorized(PermissionType.POST, Permission.RESEARCH_PROJECT)
    def post(self) -> Response:
        try:
            with OpsEventHandler(OpsEventType.CREATE_PROJECT) as meta:
                errors = ResearchProjectListAPI._post_schema.validate(request.json)

                if errors:
                    logger.error(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")
                    raise RuntimeError(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")

                data = ResearchProjectListAPI._post_schema.load(request.json)
                new_rp = ResearchProject(**data)

                tl_users = []
                for tl_id in data.get("team_leaders", []):
                    team_leader = current_app.db_session.get(User, tl_id["id"])
                    if team_leader is None:
                        logger.error(f"POST to {ENDPOINT_STRING}: Provided invalid Team Leader {tl_id['id']}")
                        return make_response_with_headers({}, 400)
                    else:
                        tl_users.append(team_leader)
                # convert team leaders from key value pair to user object on ResearchProject
                new_rp.team_leaders = tl_users

                current_app.db_session.add(new_rp)
                current_app.db_session.commit()

                new_rp_dict = ResearchProjectListAPI._response_schema.dump(new_rp)
                meta.metadata.update({"New RP": new_rp_dict})
                logger.info(f"POST to {ENDPOINT_STRING}: New ResearchProject created: {new_rp_dict}")

                return make_response_with_headers(new_rp_dict, 201)
        except (RuntimeError, PendingRollbackError) as re:
            # This is most likely the user's fault, e.g. a bad CAN or Agreement ID
            logger.error(f"POST to {ENDPOINT_STRING}: {re}")
            return make_response_with_headers({}, 400)
        except SQLAlchemyError as se:
            logger.error(f"POST to {ENDPOINT_STRING}: {se}")
            return make_response_with_headers({}, 500)
