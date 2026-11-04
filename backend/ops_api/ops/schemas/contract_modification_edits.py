"""Schemas for "Edits That Require a Contract Modification" (Award & Modifications tab)."""

from marshmallow import Schema, fields, validate

from models import ContractModificationRequestStatus, ModificationEditType


class RequestedBySchema(Schema):
    id = fields.Integer(required=True)
    full_name = fields.String(allow_none=True)


class ContractModificationEditSchema(Schema):
    """One approved edit on an Awarded agreement that requires a contract modification."""

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    modification_type = fields.Enum(ModificationEditType, required=True)
    budget_line_item_id = fields.Integer(allow_none=True)
    services_component_id = fields.Integer(allow_none=True)
    # The edited field ("amount", "can_id", "date_needed", "delete") -- the card's "Change To".
    field = fields.String(required=True)
    old_value = fields.Raw(allow_none=True)
    new_value = fields.Raw(allow_none=True)
    requested_by = fields.Nested(RequestedBySchema, allow_none=True)
    requested_on = fields.DateTime(allow_none=True)
    change_request_id = fields.Integer(allow_none=True)
    agreement_mod_id = fields.Integer(allow_none=True)
    # True when the edit is part of the contract modification that is in review.
    in_review = fields.Boolean(dump_default=False)


class SubmitContractModificationRequestSchema(Schema):
    budget_line_item_ids = fields.List(fields.Integer(), load_default=list)
    requestor_notes = fields.String(allow_none=True, load_default=None, validate=validate.Length(max=150))


class ReviewContractModificationRequestSchema(Schema):
    action = fields.String(required=True, validate=validate.OneOf(["APPROVE", "DECLINE"]))
    reviewer_notes = fields.String(allow_none=True, load_default=None)


class ContractModificationBudgetLineSummarySchema(Schema):
    """Enough to show the Division Director which budget line they're approving for execution
    (amount, CAN, fiscal year) without the full BudgetLineItemResponseSchema, which carries
    procurement-shop fees and other fields that aren't relevant to this review."""

    id = fields.Integer(required=True)
    line_description = fields.String(allow_none=True)
    amount = fields.Decimal(as_string=True, allow_none=True)
    fiscal_year = fields.Integer(allow_none=True)
    can_display_name = fields.Method("_can_display_name")

    @staticmethod
    def _can_display_name(budget_line_item):
        return budget_line_item.can.display_name if budget_line_item.can else None


class ContractModificationRequestSchema(Schema):
    """A contract modification sent to the Division Director (#3268)."""

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    status = fields.Enum(ContractModificationRequestStatus, required=True)
    requestor_notes = fields.String(allow_none=True)
    reviewer_notes = fields.String(allow_none=True)
    reviewed_by_id = fields.Integer(allow_none=True)
    reviewed_on = fields.DateTime(allow_none=True)
    agreement_mod_id = fields.Integer(allow_none=True)
    created_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(allow_none=True)
    edits = fields.List(fields.Nested(ContractModificationEditSchema), required=True)
    budget_line_item_ids = fields.Method("_budget_line_item_ids")
    # Same budget lines as budget_line_item_ids, with enough detail (amount, CAN, fiscal year)
    # for the Division Director to review what they're approving for execution.
    budget_line_items = fields.Method("_budget_line_items")
    # True when the current user may approve/decline this request (it's in review, and they're
    # a superuser or a Division Director/deputy for the agreement).
    can_review = fields.Boolean(dump_default=False)

    @staticmethod
    def _budget_line_item_ids(request):
        return sorted(bli.id for bli in request.budget_line_items)

    @staticmethod
    def _budget_line_items(request):
        sorted_blis = sorted(request.budget_line_items, key=lambda bli: bli.id)
        return ContractModificationBudgetLineSummarySchema(many=True).dump(sorted_blis)
