from datetime import datetime
from typing import Optional, override

from flask import Response, current_app, request
from loguru import logger
from marshmallow import Schema, fields
from sqlalchemy import select

from models import (
    CAN,
    AdministrativeAndSupportProject,
    Agreement,
    BaseModel,
    BudgetLineItem,
    CANFundingBudget,
    CANFundingDetails,
    OpsEventType,
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

ENDPOINT_STRING = "/administrative-and-support-projects"


class TeamLeaders(Schema):
    id: int = fields.Int()
    full_name: Optional[str] = fields.String()
    email: Optional[str] = fields.String()


class RequestBody(Schema):
    project_type: ProjectType = fields.Enum(ProjectType, required=True)
    title: str = fields.String(required=True)
    short_title: str = fields.String(required=True)
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    team_leaders: Optional[list[TeamLeaders]] = fields.List(
        fields.Nested(TeamLeaders), load_default=[], dump_default=[]
    )


class ProjectResponse(Schema):
    id: int = fields.Int()
    title: str = fields.String()
    created_by: int = fields.Int()
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    team_leaders: Optional[list[TeamLeaders]] = fields.List(
        fields.Nested(TeamLeaders), load_default=[], dump_default=[]
    )
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    project_type: ProjectType = fields.Enum(ProjectType)


class ProjectListResponse(Schema):
    """Lightweight schema for list endpoint with only fields used by frontend.

    Excludes expensive nested relationships (team_leaders) to eliminate N+1 query problems.
    """

    id: int = fields.Int()
    title: str = fields.String()
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    project_type: ProjectType = fields.Enum(ProjectType)


class AdministrativeAndSupportProjectItemAPI(BaseItemAPI):
    _response_schema = ProjectResponse()

    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self, id: int) -> Response:
        item = self._get_item(id)
        if item:
            return make_response_with_headers(AdministrativeAndSupportProjectItemAPI._response_schema.dump(item))
        else:
            return make_response_with_headers({}, 404)


class AdministrativeAndSupportProjectListAPI(BaseListAPI):
    _post_schema = RequestBody()
    _response_schema = ProjectResponse()
    _list_response_schema = ProjectListResponse()

    def __init__(self, model: BaseModel = ResearchProject):
        super().__init__(model)

    @override
    @staticmethod
    def _get_query(fiscal_year=None, portfolio_id=None, search=None):
        stmt = (
            select(AdministrativeAndSupportProject)
            .distinct(AdministrativeAndSupportProject.id)
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
            query_helper.add_column_in_range(
                CANFundingDetails.fiscal_year,
                CANFundingDetails.obligate_by,
                fiscal_year,
            )

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(AdministrativeAndSupportProject.title, search)

        stmt = query_helper.get_stmt()
        logger.debug(f"SQL: {stmt}")

        return stmt

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        portfolio_id = request.args.get("portfolio_id")
        search = request.args.get("search")

        stmt = AdministrativeAndSupportProjectListAPI._get_query(fiscal_year, portfolio_id, search)

        result = current_app.db_session.scalars(stmt).all()

        project_response = [
            AdministrativeAndSupportProjectListAPI._list_response_schema.dump(project) for project in result
        ]

        return make_response_with_headers(project_response)

    @is_authorized(PermissionType.POST, Permission.RESEARCH_PROJECT)
    def post(self) -> Response:
        with OpsEventHandler(OpsEventType.CREATE_PROJECT) as meta:
            errors = AdministrativeAndSupportProjectListAPI._post_schema.validate(request.json)

            if errors:
                logger.error(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")
                raise RuntimeError(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")

            data = AdministrativeAndSupportProjectListAPI._post_schema.load(request.json)
            new_rp = ResearchProject(**data)

            new_rp.team_leaders = [
                current_app.db_session.get(User, tl_id["id"]) for tl_id in data.get("team_leaders", [])
            ]

            current_app.db_session.add(new_rp)
            current_app.db_session.commit()

            new_rp_dict = AdministrativeAndSupportProjectListAPI._response_schema.dump(new_rp)
            meta.metadata.update({"New RP": new_rp_dict})
            logger.info(f"POST to {ENDPOINT_STRING}: New ResearchProject created: {new_rp_dict}")

            return make_response_with_headers(new_rp_dict, 201)
