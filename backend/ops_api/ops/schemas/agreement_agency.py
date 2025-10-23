from marshmallow import Schema, fields
from marshmallow.validate import Range


class AgreementAgencySchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbreviation = fields.String()
    requesting = fields.Boolean(required=True)
    servicing = fields.Boolean(required=True)


class AgreementAgencyRequestSchema(Schema):
    requesting = fields.Boolean(required=False, load_default=False)
    servicing = fields.Boolean(required=False, load_default=False)
    limit = fields.Integer(
        load_default=10,
        dump_default=10,
        validate=Range(min=1, error="Limit must be greater than 0"),
        allow_none=True,
    )
    offset = fields.Integer(
        load_default=0,
        dump_default=0,
        validate=Range(min=0, error="Offset must be greater than 0"),
        allow_none=True,
    )
