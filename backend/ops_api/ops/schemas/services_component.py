from marshmallow import Schema, fields


class ServicesComponentSchema(Schema):
    """Schema for services component resources."""

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    number = fields.Integer(required=True)
    optional = fields.Boolean(required=True)
    description = fields.String(allow_none=True)
    display_title = fields.String(dump_only=True)
    display_name = fields.String(dump_only=True)
    period_start = fields.Date(allow_none=True)
    period_end = fields.Date(allow_none=True)
    created_by = fields.Integer(dump_only=True)
    created_on = fields.DateTime(dump_only=True)
    updated_by = fields.Integer(dump_only=True)
    updated_on = fields.DateTime(dump_only=True)


class ServicesComponentItemResponse(ServicesComponentSchema):
    """Schema for single services component response."""

    # Extends the base schema to add additional fields for responses if needed
    # Currently identical to base schema


class ServicesComponentListResponse(Schema):
    """Schema for listing multiple services components."""

    items = fields.List(fields.Nested(ServicesComponentSchema))


class ServicesComponentCreateSchema(Schema):
    """Schema for creating a services component."""

    agreement_id = fields.Integer(required=True)
    number = fields.Integer(required=True)
    optional = fields.Boolean(required=True)
    description = fields.String(allow_none=True)
    period_start = fields.Date(allow_none=True)
    period_end = fields.Date(allow_none=True)


class ServicesComponentUpdateSchema(Schema):
    """Schema for updating a services component."""

    agreement_id = fields.Integer()
    number = fields.Integer()
    optional = fields.Boolean()
    description = fields.String(allow_none=True)
    period_start = fields.Date(allow_none=True)
    period_end = fields.Date(allow_none=True)
