from marshmallow import Schema, fields


class AgreementAgencySchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    abbreviation = fields.String()
    requesting = fields.Boolean(required=True)
    servicing = fields.Boolean(required=True)
