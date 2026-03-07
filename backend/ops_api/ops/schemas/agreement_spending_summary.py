from marshmallow import Schema, fields


class RequestSchema(Schema):
    fiscal_year = fields.List(fields.Integer(), allow_none=True)


class AgreementTypeSpendingSchema(Schema):
    type = fields.String(required=True)
    label = fields.String(required=True)
    total = fields.Float(required=True)
    percent = fields.String(required=True)
    new = fields.Float(required=True)
    continuing = fields.Float(required=True)


class ResponseSchema(Schema):
    total_spending = fields.Float(required=True)
    agreement_types = fields.List(fields.Nested(AgreementTypeSpendingSchema))
