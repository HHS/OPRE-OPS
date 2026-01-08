"""Schemas for procurement action endpoints."""

from marshmallow import EXCLUDE, Schema, fields

from models.agreements import ModType
from models.procurement_action import AwardType, ProcurementActionStatus
from ops_api.ops.schemas.budget_line_items import BudgetLineItemResponseSchema
from ops_api.ops.schemas.pagination import PaginationListSchema
from ops_api.ops.schemas.procurement_shops import ProcurementShopSchema


class MinimalAgreementSchema(Schema):
    """Minimal agreement schema for nested serialization."""

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    display_name = fields.String(required=True)


class AgreementModSchema(Schema):
    """Schema for agreement modification."""

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    mod_type = fields.Enum(ModType, allow_none=True)
    number = fields.String(allow_none=True)
    mod_date = fields.Date(allow_none=True)


class RequisitionSchema(Schema):
    """Schema for requisition."""

    id = fields.Integer(required=True)
    procurement_action_id = fields.Integer(required=True)
    # Add other fields as needed


class ProcurementActionRequestSchema(PaginationListSchema):
    """Schema for GET /procurement-actions endpoint query parameters."""

    class Meta:
        unknown = EXCLUDE

    # Filtering parameters
    agreement_id = fields.List(fields.Integer(), required=False)
    budget_line_item_id = fields.List(fields.Integer(), required=False)
    status = fields.List(fields.String(), required=False)
    award_type = fields.List(fields.String(), required=False)
    procurement_shop_id = fields.List(fields.Integer(), required=False)


class ProcurementActionResponseSchema(Schema):
    """Schema for procurement action response (detail endpoint)."""

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)

    # Nested agreement - minimal fields
    agreement = fields.Nested(MinimalAgreementSchema, allow_none=True)

    agreement_mod_id = fields.Integer(allow_none=True)
    agreement_mod = fields.Nested(AgreementModSchema, allow_none=True)

    award_type = fields.Enum(AwardType, allow_none=True)
    mod_type = fields.Enum(ModType, allow_none=True)
    status = fields.Enum(ProcurementActionStatus, allow_none=True)

    procurement_shop_id = fields.Integer(allow_none=True)
    procurement_shop = fields.Nested(ProcurementShopSchema, allow_none=True)

    psc_action_number = fields.String(allow_none=True)
    need_by_date = fields.Date(allow_none=True)
    requisition_deadline = fields.Date(allow_none=True)
    date_awarded_obligated = fields.Date(allow_none=True)
    desired_days_on_street = fields.Integer(allow_none=True)

    action_description = fields.String(allow_none=True)
    comments = fields.String(allow_none=True)

    psc_fee_percentage = fields.Decimal(as_string=True, allow_none=True)
    award_total = fields.Decimal(places=2, as_string=True, allow_none=True)
    agreement_total = fields.Decimal(places=2, as_string=True, allow_none=True)

    # Computed properties
    display_name = fields.String(required=True)
    mod_number = fields.String(allow_none=True)
    is_modification = fields.Bool(required=True)
    budget_lines_total = fields.Decimal(places=2, as_string=True, required=True)
    totals_match = fields.Bool(required=True)

    # Budget line items (full details)
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema), allow_none=True)

    # Requisitions
    requisitions = fields.List(fields.Nested(RequisitionSchema), allow_none=True)

    # Audit fields
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)


class ProcurementActionListResponseSchema(Schema):
    """Lighter schema for list endpoint."""

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)

    # Nested agreement - minimal fields
    agreement = fields.Nested(MinimalAgreementSchema, allow_none=True)

    agreement_mod_id = fields.Integer(allow_none=True)
    agreement_mod = fields.Nested(AgreementModSchema, allow_none=True)

    award_type = fields.Enum(AwardType, allow_none=True)
    mod_type = fields.Enum(ModType, allow_none=True)
    status = fields.Enum(ProcurementActionStatus, allow_none=True)

    procurement_shop_id = fields.Integer(allow_none=True)
    procurement_shop = fields.Nested(ProcurementShopSchema, allow_none=True)

    psc_action_number = fields.String(allow_none=True)
    need_by_date = fields.Date(allow_none=True)
    date_awarded_obligated = fields.Date(allow_none=True)

    action_description = fields.String(allow_none=True)

    award_total = fields.Decimal(places=2, as_string=True, allow_none=True)

    # Computed properties
    display_name = fields.String(required=True)
    is_modification = fields.Bool(required=True)

    # Budget line items (IDs only for list)
    budget_line_items = fields.List(fields.Nested(BudgetLineItemResponseSchema, only=["id"]), allow_none=True)

    # Audit fields
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
