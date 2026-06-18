"""Vendor schemas."""

from marshmallow import Schema, fields, post_dump


class VendorResponseSchema(Schema):
    """Schema for vendor response."""

    id = fields.Int(required=True)
    name = fields.Str(required=True)
    duns = fields.Str(allow_none=True)
    vendor_type = fields.Str(allow_none=True)
    active = fields.Bool()

    @post_dump
    def serialize_vendor_type(self, data, **kwargs):
        """Extract enum name from vendor_type if it's an enum."""
        if data.get("vendor_type"):
            # If it's an enum object, get just the name (e.g., SMALL_BUSINESS)
            vendor_type = data["vendor_type"]
            if hasattr(vendor_type, "name"):
                data["vendor_type"] = vendor_type.name
        return data
