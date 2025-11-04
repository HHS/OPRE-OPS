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


class NestedServicesComponentRequestSchema(Schema):
    """
    Schema for services components nested in agreement creation requests.

    This schema is used when creating services components as part of an atomic
    agreement creation (POST /agreements with nested services_components array).

    Key differences from ServicesComponentCreateSchema:
    - agreement_id is EXCLUDED (will be set programmatically by service layer)
    - ref is ADDED as a temporary reference identifier

    The 'ref' field allows budget line items to reference services components
    being created in the same request via the 'services_component_ref' field.
    If not provided, the array index will be used as the default reference.
    """

    # Temporary reference identifier for budget line items to reference
    ref = fields.Str(
        allow_none=True,
        load_default=None,
        metadata={
            "description": "Temporary reference identifier for this services component. "
            "Budget line items can reference this SC using 'services_component_ref'. "
            "If not provided, the array index (as a string) will be used as the reference."
        },
    )

    # Required fields from ServicesComponentCreateSchema (minus agreement_id)
    number = fields.Integer(
        required=True,
        metadata={"description": "The sequence number of the services component"},
    )
    optional = fields.Boolean(
        required=True,
        metadata={"description": "Whether this is an optional services component (option period)"},
    )

    # Optional fields
    description = fields.String(
        allow_none=True, metadata={"description": "Description of the services component"}
    )
    period_start = fields.Date(
        allow_none=True, metadata={"description": "Start date of the period"}
    )
    period_end = fields.Date(
        allow_none=True, metadata={"description": "End date of the period"}
    )
