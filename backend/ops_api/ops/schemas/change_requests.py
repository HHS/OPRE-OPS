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
    requested_change_info = fields.Dict(allow_none=True)
    requestor_notes = fields.String(load_default=None, dump_default=None, allow_none=True)
    managing_division_id = fields.Int(required=True, dump_default=None, allow_none=True)
    created_by = fields.Int(required=True)
    created_by_user = fields.Nested(SafeUserSchema(), load_default=None, dump_default=None, allow_none=True)
    created_on = fields.DateTime(required=True)
    reviewed_by = fields.Integer(allow_none=True)
    reviewed_on = fields.DateTime(required=True)
    reviewer_notes = fields.String(load_default=None, dump_default=None, allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    updated_on = fields.DateTime(required=True)
    agreement_id = fields.Int(required=True)


class GenericChangeRequestResponseSchema(ChangeRequestResponseSchema):
    budget_line_item_id = fields.Int(required=False, allow_none=True)
    has_budget_change = fields.Bool(load_default=False)
    has_status_change = fields.Bool(load_default=False)
    has_delete_change = fields.Bool(load_default=False)
    has_proc_shop_change = fields.Bool(load_default=False)
    requires_contract_modification = fields.Bool(load_default=False)
    services_component_id = fields.Int(required=False, allow_none=True)
    has_services_component_change = fields.Bool(load_default=False)
    is_services_component_create = fields.Bool(load_default=False)
    is_services_component_delete = fields.Bool(load_default=False)

    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields


class AgreementChangeRequestResponseSchema(ChangeRequestResponseSchema):
    has_proc_shop_change = fields.Bool(required=True)
    # Services Component add/delete requests (OPS-6440), for the "Changes In Review" banner. Budget
    # line requests in the same list don't have these attributes, so they serialize as before.
    services_component_id = fields.Int(allow_none=True)
    has_services_component_change = fields.Bool()
    is_services_component_create = fields.Bool()
    is_services_component_delete = fields.Bool()


class BudgetLineItemChangeRequestResponseSchema(ChangeRequestResponseSchema):
    budget_line_item_id = fields.Int(required=True)
    has_budget_change = fields.Bool(required=True)
    has_status_change = fields.Bool(required=True)
