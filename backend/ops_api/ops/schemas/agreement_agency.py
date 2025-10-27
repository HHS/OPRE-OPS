from marshmallow import Schema, fields

from ops_api.ops.schemas.pagination import PaginationSchema


class AgreementAgencySchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbreviation = fields.String()
    requesting = fields.Boolean(required=True)
    servicing = fields.Boolean(required=True)


class AgreementAgencyRequestSchema(PaginationSchema):
    requesting = fields.Boolean(required=False, load_default=False)
    servicing = fields.Boolean(required=False, load_default=False)
