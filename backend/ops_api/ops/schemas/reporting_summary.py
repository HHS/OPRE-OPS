from marshmallow import Schema, fields


class RequestSchema(Schema):
    fiscal_year = fields.List(fields.Integer(), allow_none=True)
    portfolio_ids = fields.List(fields.Integer(), allow_none=True)


class AgreementTypeSpendingSchema(Schema):
    type = fields.String(required=True)
    label = fields.String(required=True)
    total = fields.Float(required=True)
    percent = fields.Integer(required=True)
    new = fields.Float(required=True)
    continuing = fields.Float(required=True)


class SpendingSchema(Schema):
    total_spending = fields.Float(required=True)
    agreement_types = fields.List(fields.Nested(AgreementTypeSpendingSchema))


class TypeCountSchema(Schema):
    type = fields.String(required=True)
    count = fields.Integer(required=True)


class CountGroupSchema(Schema):
    total = fields.Integer(required=True)
    types = fields.List(fields.Nested(TypeCountSchema))


class CountsSchema(Schema):
    projects = fields.Nested(CountGroupSchema)
    agreements = fields.Nested(CountGroupSchema)
    new_agreements = fields.Nested(CountGroupSchema)
    continuing_agreements = fields.Nested(CountGroupSchema)
    budget_lines = fields.Nested(CountGroupSchema)


class ResponseSchema(Schema):
    spending = fields.Nested(SpendingSchema)
    counts = fields.Nested(CountsSchema)
