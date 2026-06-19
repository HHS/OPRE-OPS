"""CLIN (Contract Line Item Number) schemas."""

from marshmallow import Schema, fields


class CLINSchema(Schema):
    """Schema for CLIN (Contract Line Item Number) resources."""

    id = fields.Integer(required=True)
    number = fields.Integer(allow_none=True)
    name = fields.String(allow_none=True)
    pop_start_date = fields.Date(allow_none=True)
    pop_end_date = fields.Date(allow_none=True)
    agreement_id = fields.Integer(required=True)
