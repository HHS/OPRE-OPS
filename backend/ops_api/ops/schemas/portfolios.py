from marshmallow import Schema, fields


class PortfolioCansRequestSchema(Schema):
    year = fields.Integer(required=False)
    budgetFiscalYear = fields.Integer(required=False)
    includeInactive = fields.Boolean(required=False)
