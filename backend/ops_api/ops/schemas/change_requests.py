from marshmallow import EXCLUDE, Schema, fields

from models import ChangeRequestStatus, ChangeRequestType
from ops_api.ops.schemas.users import SafeUserSchema


class ChangeRequestResponseSchema(Schema):
    id = fields.Int(required=True)
    change_request_type = fields.Enum(ChangeRequestType, required=True)
    display_name = fields.String(required=True)
    status = fields.Enum(ChangeRequestStatus, required=True)
    requested_change_data = fields.Dict(required=True)
    requested_change_diff = fields.Dict(required=True)
    requestor_notes = fields.String(default=None, allow_none=True)
    managing_division_id = fields.Int(required=True, default=None, allow_none=True)
    created_by = fields.Int(required=True)
    created_by_user = fields.Nested(SafeUserSchema(), default=None, allow_none=True)
    created_on = fields.DateTime(required=True)
    reviewed_by = fields.Integer(allow_none=True)
    reviewed_on = fields.DateTime(required=True)
    reviewer_notes = fields.String(default=None, allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    updated_on = fields.DateTime(required=True)


class AgreementChangeRequestResponseSchema(ChangeRequestResponseSchema):
    agreement_id = fields.Int(required=True)


class BudgetLineItemChangeRequestResponseSchema(AgreementChangeRequestResponseSchema):
    budget_line_item_id = fields.Int(required=True)
    has_budget_change = fields.Bool(required=True)
    has_status_change = fields.Bool(required=True)


# for now, there are only BudgetLineItemChangeRequests, but this sets up a way to expand the response for multiple types
# into a single, merged schema since having extra props from other types is inconsequential where this is used
class GenericChangeRequestResponseSchema(BudgetLineItemChangeRequestResponseSchema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields
