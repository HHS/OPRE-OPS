from marshmallow import Schema, fields

from ops_api.ops.auth.auth_types import ProviderTypes


class LoginSchema(Schema):
    code: str = fields.String(required=True)
    provider: ProviderTypes = fields.Enum(ProviderTypes, required=True)
