from marshmallow import Schema, fields


class GrantNumberSchema(Schema):
    """Schema for grant number resources.
    The natural key for grant numbers is a composite of (agreement_id, number).
    """

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    number = fields.Integer(required=True)
    description = fields.String(allow_none=True)
    display_title = fields.String(dump_only=True)
    display_name = fields.String(dump_only=True)
    period_start = fields.Date(allow_none=True)
    period_end = fields.Date(allow_none=True)
    created_by = fields.Integer(dump_only=True)
    created_on = fields.DateTime(dump_only=True)
    updated_by = fields.Integer(dump_only=True)
    updated_on = fields.DateTime(dump_only=True)


class GrantNumberItemResponse(GrantNumberSchema):
    """Schema for single grant number response."""

    # Extends the base schema to add additional fields for responses if needed
    # Currently identical to base schema


class GrantNumberListResponse(Schema):
    """Schema for listing multiple grant numbers."""

    items = fields.List(fields.Nested(GrantNumberSchema))


class GrantNumberCreateSchema(Schema):
    """Schema for creating a grant number."""

    agreement_id = fields.Integer(required=True)
    number = fields.Integer(required=True)
    description = fields.String(allow_none=True)
    period_start = fields.Date(allow_none=True)
    period_end = fields.Date(allow_none=True)


class GrantNumberUpdateSchema(Schema):
    """Schema for updating a grant number."""

    agreement_id = fields.Integer()
    number = fields.Integer()
    description = fields.String(allow_none=True)
    period_start = fields.Date(allow_none=True)
    period_end = fields.Date(allow_none=True)


class NestedGrantNumberRequestSchema(Schema):
    """
    Schema for grant numbers nested in agreement creation requests.

    This schema is used when creating grant numbers as part of an atomic
    agreement creation (POST /agreements with nested grant_numbers array).

    Key differences from GrantNumberCreateSchema:
    - agreement_id is EXCLUDED (will be set programmatically by service layer)
    - ref is ADDED as a temporary reference identifier

    The 'ref' field mirrors NestedServicesComponentRequestSchema's convention so a future
    grant budget-line-item feature can reference a grant number being created in the same
    request, the same way budget line items reference services components today. Not
    consumed anywhere yet, but keeps the nested-create machinery symmetric with SC.
    """

    ref = fields.Str(
        allow_none=True,
        load_default=None,
        metadata={
            "description": "Temporary reference identifier for this grant number. "
            "If not provided, the array index (as a string) will be used as the reference."
        },
    )

    number = fields.Integer(
        required=True,
        metadata={"description": "The sequence number of the grant number"},
    )

    description = fields.String(
        allow_none=True,
        metadata={"description": "Description of the grant number"},
    )
    period_start = fields.Date(allow_none=True, metadata={"description": "Period of performance start date"})
    period_end = fields.Date(allow_none=True, metadata={"description": "Period of performance end date"})
