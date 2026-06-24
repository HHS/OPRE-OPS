"""Vendor schemas."""

from marshmallow import Schema, fields


class VendorResponseSchema(Schema):
    """Schema for vendor response."""

    id = fields.Int(required=True)
    name = fields.Str(required=True)
    duns = fields.Str(allow_none=True)
    vendor_type = fields.Str(allow_none=True)
    active = fields.Bool()
