from datetime import date, datetime
from typing import Optional

from marshmallow import Schema, fields, pre_dump

from models import ProjectType
from ops_api.ops.schemas.pagination import PaginationListSchema


class ProjectListGetRequestSchema(PaginationListSchema):
    """Schema for validating ProjectListAPI GET request query parameters.

    All filter parameters accept lists to enable filtering by multiple values.
    Inherits pagination parameters (limit, offset) from PaginationListSchema.
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


class AgreementNameListItem(Schema):
    id: int = fields.Int(required=True)
    name: str = fields.String(required=True)


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
    start_date: Optional[date] = fields.Date(format="%Y-%m-%d", dump_default=None)
    end_date: Optional[date] = fields.Date(format="%Y-%m-%d", dump_default=None)
    fiscal_year_totals: Optional[dict] = fields.Dict(
        keys=fields.Int(), values=fields.Decimal(as_string=True), allow_none=True
    )
    project_total: Optional[int] = fields.Int(allow_none=True)
    agreement_name_list: Optional[list[dict]] = fields.List(
        fields.Nested(AgreementNameListItem), dump_default=[], allow_none=True
    )

    @pre_dump
    def extract_metadata(self, data, **kwargs):
        """Extract fields from project_list_metadata property and map to schema fields."""
        if hasattr(data, "project_list_metadata"):
            metadata = data.project_list_metadata

            # Map total to project_total (convert Decimal to int)
            data.project_total = metadata["total"] if metadata["total"] is not None else None

            # Map date ranges
            data.start_date = metadata["project_start"]
            data.end_date = metadata["project_end"]

            # Map fiscal year breakdown
            data.fiscal_year_totals = metadata["by_fiscal_year"]
            data.agreement_name_list = metadata.get("agreement_name_list", [])

        return data


class ResearchProjectListResponse(ProjectListResponse):
    """Lightweight schema for list endpoint with only fields used by frontend.

    Excludes expensive nested relationships (team_leaders) to eliminate N+1 query problems.
    """

    origination_date: Optional[date] = fields.Date(format="%Y-%m-%d", dump_default=None)


class ProjectListFilterOptionResponseSchema(Schema):
    """Schema for the response from the projects filter options endpoint."""

    fiscal_years = fields.List(fields.Int(), required=True)
    portfolios = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    project_titles = fields.List(fields.Dict(keys=fields.String(), values=fields.Raw()), required=True)
    project_types = fields.List(fields.String(), required=True)
    agreement_names = fields.List(fields.String(), required=True)
