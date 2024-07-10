from marshmallow import Schema, fields


class GetDocumentRequestSchema(Schema):
    agreement_id: int = fields.Int(required=True)


class DocumentRequestSchema(Schema):
    file_name: str = fields.String(required=True)
    document_type: str = fields.String(required=True)
    agreement_id: int = fields.Int(required=True)


class DocumentResponseSchema(Schema):
    uuid: str = fields.String(required=True)
    url: str = fields.String(required=True)
