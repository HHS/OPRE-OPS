from marshmallow import Schema, fields


class AgreementSpendingMetadataSchema(Schema):
    """Schema for per-agreement fiscal-year spending totals."""

    fy_total = fields.Dict(
        keys=fields.Integer(),
        values=fields.Decimal(as_string=True),
        required=True,
    )
