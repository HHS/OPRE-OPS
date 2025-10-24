from marshmallow import EXCLUDE, Schema, fields
from marshmallow.validate import Range


class PaginationSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # Exclude unknown fields

    limit = fields.List(
        fields.Integer(
            validate=Range(min=1, max=50, error="Limit must be between 1 and 50"),
        ),
        load_default=[10],
        dump_default=[10],
        required=False,
    )
    offset = fields.List(
        fields.Integer(
            validate=Range(min=0, error="Offset must be greater than or equal to 0"),
        ),
        load_default=[0],
        dump_default=[0],
        required=False,
    )
