from marshmallow import Schema, fields


class LoginSchema(Schema):
    code: str = fields.String(required=True)
    provider: str = fields.String(required=True)
