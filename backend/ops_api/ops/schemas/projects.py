from datetime import date, datetime
from typing import Optional

from marshmallow import Schema, fields

from models import ProjectType


class ProjectListGetRequestSchema(Schema):
    """Schema for validating ProjectListAPI GET request query parameters.

    All filter parameters accept lists to enable filtering by multiple values.
    """

    fiscal_year = fields.List(fields.Integer(), required=False, load_default=[])
    portfolio_id = fields.List(fields.Integer(), required=False, load_default=[])
    project_search = fields.List(fields.String(), required=False, load_default=[])
    agreement_search = fields.List(fields.String(), required=False, load_default=[])
    project_type = fields.List(fields.Enum(ProjectType), required=False, load_default=[])


class TeamLeaders(Schema):
    id: int = fields.Int(required=True)
    full_name: Optional[str] = fields.String()
    email: Optional[str] = fields.String()


class ProjectCreationRequestSchema(Schema):
    """Combined schema for creating both Research and Administrative/Support projects.

    Includes all unique fields from both project types:
    - Common fields: project_type, title, short_title, description, url, team_leaders
    - Research-specific: origination_date
    """

    project_type = fields.Enum(ProjectType, required=True)
    title = fields.String(required=True)
    short_title = fields.String(required=False, allow_none=True)
    description = fields.String(allow_none=True)
    url = fields.String(allow_none=True)
    origination_date = fields.Date(format="%Y-%m-%d", load_default=None, dump_default=None, allow_none=True)
    team_leaders = fields.List(
        fields.Nested(TeamLeaders),
        load_default=[],
        dump_default=[],
    )


class ProjectUpdateRequestSchema(Schema):
    """Schema for updating a project.

    Includes all fields that can be updated:
    - Common fields: title, short_title, description, url, team_leaders
    - Research-specific: origination_date
    """

    title = fields.String(allow_none=True)
    short_title = fields.String(allow_none=True)
    description = fields.String(allow_none=True)
    url = fields.String(allow_none=True)
    origination_date = fields.Date(format="%Y-%m-%d", dump_default=None, allow_none=True)
    team_leaders = fields.List(
        fields.Nested(TeamLeaders),
        dump_default=[],
    )


class ProjectSchema(Schema):
    id = fields.Integer(required=True)
    project_type = fields.Enum(ProjectType, required=True)
    title = fields.String(required=True)
    short_title = fields.String(required=True)
    description = fields.String(required=True)
    url = fields.String(allow_none=True)


class ProjectResponse(Schema):
    id: int = fields.Int()
    title: str = fields.String()
    created_by: int = fields.Int()
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    team_leaders: Optional[list[TeamLeaders]] = fields.List(fields.Nested(TeamLeaders), dump_default=[])
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    project_type: ProjectType = fields.Enum(ProjectType)


class ResearchProjectResponse(Schema):
    id: int = fields.Int()
    title: str = fields.String()
    created_by: int = fields.Int()
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    origination_date: Optional[date] = fields.Date(format="%Y-%m-%d", dump_default=None)
    team_leaders: Optional[list[TeamLeaders]] = fields.List(
        fields.Nested(TeamLeaders), load_default=[], dump_default=[]
    )
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    project_type: ProjectType = fields.Enum(ProjectType)


class ResearchProjectListResponse(Schema):
    """Lightweight schema for list endpoint with only fields used by frontend.

    Excludes expensive nested relationships (team_leaders) to eliminate N+1 query problems.
    """

    id: int = fields.Int()
    title: str = fields.String()
    short_title: str = fields.String()
    description: Optional[str] = fields.String(allow_none=True)
    url: Optional[str] = fields.String(allow_none=True)
    origination_date: Optional[date] = fields.Date(format="%Y-%m-%d", dump_default=None)
    created_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    updated_on: datetime = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ")
    project_type: ProjectType = fields.Enum(ProjectType)
    end_date: Optional[date] = fields.Date(format="%Y-%m-%d", dump_default=None)
    fiscal_year_total: Optional[int] = fields.Int(allow_none=True)
    project_total: Optional[int] = fields.Int(allow_none=True)


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


class ProjectListFilterOptionResponseSchema(Schema):
    """Schema for the response from the projects filter options endpoint."""

    fiscal_years = fields.List(fields.Int(), required=True)
    portfolios = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    project_titles = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    project_types = fields.List(fields.String(), required=True)
    agreement_names = fields.List(fields.String(), required=True)
