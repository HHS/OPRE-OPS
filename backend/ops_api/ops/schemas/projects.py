from marshmallow import Schema, fields

from models.projects import ProjectType


class Project(Schema):
    id = fields.Integer(required=True)
    project_type = fields.Enum(ProjectType, required=True)
    title = fields.String(required=True)
    short_title = fields.String(required=True)
    description = fields.String(required=True)
    url = fields.String(allow_none=True)
