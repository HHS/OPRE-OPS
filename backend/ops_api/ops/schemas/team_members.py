from marshmallow import Schema, fields


class TeamMembers(Schema):
    id = fields.Integer(required=True)
    full_name = fields.String()
    email = fields.String()
