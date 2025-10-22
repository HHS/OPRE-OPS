from marshmallow import Schema, fields

from models import AgreementHistoryType


class AgreementHistoryItemSchema(Schema):
    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    agreement_id_record = fields.Integer(required=True)
    ops_event_id = fields.Integer(required=True)
    history_title = fields.String(required=True)
    history_message = fields.String(required=True)
    timestamp = fields.String(required=True)
    history_type = fields.Enum(AgreementHistoryType)
