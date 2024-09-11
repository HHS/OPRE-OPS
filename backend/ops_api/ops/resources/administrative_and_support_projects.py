from datetime import datetime
from typing import List, Optional, override

from flask import Response, current_app, request
from marshmallow import Schema, fields
from marshmallow_enum import EnumField
from sqlalchemy import select

from models import (
    CAN,
    AdministrativeAndSupportProject,
    Agreement,
    BaseModel,
    BudgetLineItem,
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
    project_type: ProjectType = EnumField(ProjectType)
    title: str = fields.String()
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    team_leaders: Optional[list[TeamLeaders]] = fields.List(
        fields.Nested(TeamLeaders),
        default=[],
    )


class ProjectResponse(Schema):
    id: int = fields.Int()
    title: str = fields.String()
    created_by: int = fields.Int()
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    team_leaders: Optional[list[TeamLeaders]] = fields.List(fields.Nested(TeamLeaders), default=[])
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")


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
        )

        query_helper = QueryHelper(stmt)

        if portfolio_id:
            query_helper.add_column_equals(CAN.portfolio_id, portfolio_id)

        if fiscal_year:
            query_helper.add_column_equals(CANFundingDetails.fiscal_year, fiscal_year)

        if search is not None and len(search) == 0:
            query_helper.return_none()
        elif search:
            query_helper.add_search(AdministrativeAndSupportProject.title, search)

        stmt = query_helper.get_stmt()
        current_app.logger.debug(f"SQL: {stmt}")

        return stmt

    @is_authorized(PermissionType.GET, Permission.RESEARCH_PROJECT)
    def get(self) -> Response:
        fiscal_year = request.args.get("fiscal_year")
        portfolio_id = request.args.get("portfolio_id")
        search = request.args.get("search")

        stmt = AdministrativeAndSupportProjectListAPI._get_query(fiscal_year, portfolio_id, search)

        result = current_app.db_session.execute(stmt).all()

        project_response: List[dict] = []
        for item in result:
            for project in item:
                project_response.append(AdministrativeAndSupportProjectListAPI._response_schema.dump(project))

        return make_response_with_headers(project_response)

    @is_authorized(PermissionType.POST, Permission.RESEARCH_PROJECT)
    def post(self) -> Response:
        with OpsEventHandler(OpsEventType.CREATE_PROJECT) as meta:
            errors = AdministrativeAndSupportProjectListAPI._post_schema.validate(request.json)

            if errors:
                current_app.logger.error(f"POST to {ENDPOINT_STRING}: Params failed validation: {errors}")
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
            current_app.logger.info(f"POST to {ENDPOINT_STRING}: New ResearchProject created: {new_rp_dict}")

            return make_response_with_headers(new_rp_dict, 201)
