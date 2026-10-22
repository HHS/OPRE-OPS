"""Schemas for "Edits That Require a Contract Modification" (Award & Modifications tab)."""

from marshmallow import Schema, fields

from models import ModificationEditType
from ops_api.ops.schemas.procurement_actions import AgreementModSchema


class RequestedBySchema(Schema):
    id = fields.Integer(required=True)
    full_name = fields.String(allow_none=True)


class ContractModificationEditSchema(Schema):
    """One approved edit on an Awarded agreement that requires a contract modification."""

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    modification_type = fields.Enum(ModificationEditType, required=True)
    budget_line_item_id = fields.Integer(allow_none=True)
    # The edited field ("amount", "can_id", "date_needed", "delete") -- the card's "Change To".
    field = fields.String(required=True)
    old_value = fields.Raw(allow_none=True)
    new_value = fields.Raw(allow_none=True)
    requested_by = fields.Nested(RequestedBySchema, allow_none=True)
    requested_on = fields.DateTime(allow_none=True)
    change_request_id = fields.Integer(allow_none=True)
    agreement_mod_id = fields.Integer(allow_none=True)


class StartContractModificationResponseSchema(Schema):
    agreement_mod = fields.Nested(AgreementModSchema, required=True)
    edits = fields.List(fields.Nested(ContractModificationEditSchema), required=True)
