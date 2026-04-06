from marshmallow import EXCLUDE, Schema, fields


class PortfolioCansRequestSchema(Schema):
    year = fields.Integer(required=False)
    budgetFiscalYear = fields.Integer(required=False)
    includeInactive = fields.Boolean(required=False)


class PortfolioListRequestSchema(Schema):
    class Meta:
        unknown = EXCLUDE

    project_id = fields.Integer(required=False)
