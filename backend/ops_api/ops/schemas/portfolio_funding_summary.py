from marshmallow import Schema, fields


class RequestSchema(Schema):
    fiscal_year = fields.Integer(allow_none=True)
