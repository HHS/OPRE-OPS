from marshmallow import Schema, fields

from budget_line_items import BudgetLineItemCANSchema
from users import SafeUserSchema


class FundingBudgetVersionSchema(Schema):
    budget: fields.Float()
    can: fields.Integer()
    can_id: fields.Integer()
    display_name: fields.String()
    fiscal_year: fields.Integer()
    id: fields.Integer()
    notes: fields.String()
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema)
    updated_by_user = fields.Nested(SafeUserSchema)
    transaction_id = fields.Integer()
    end_transaction_id = fields.Integer()
    operation_type = fields.Integer()


class FundingBudgetSchema(Schema):
    budget: fields.Float()
    can: fields.Integer()
    can_id: fields.Integer()
    display_name: fields.String()
    fiscal_year: fields.Integer()
    id: fields.Integer()
    notes: fields.String()
    versions = fields.List(fields.Nested(FundingBudgetVersionSchema), default=[])
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_by_user = fields.Nested(SafeUserSchema)
    updated_by_user = fields.Nested(SafeUserSchema)


class FundingDetailsSchema(Schema):
    id: fields.Integer()


class CANSchema(Schema):
    active_period = fields.Integer()
    budget_line_items = fields.List(fields.Nested(BudgetLineItemCANSchema), default=[])
    display_name = fields.String()
    funding_budgets = fields.List(fields.Nested(FundingBudgetSchema), default=[])
    funding_details = fields.List(fields.Nested(FundingDetailsSchema), default=[])
