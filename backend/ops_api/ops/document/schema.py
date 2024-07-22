from marshmallow import Schema, fields


class GetDocumentRequestSchema(Schema):
    agreement_id: int = fields.Int(required=True)


class DocumentRequestSchema(Schema):
    agreement_id: int = fields.Int(required=True)
    document_type: str = fields.String(required=True)
    file_name: str = fields.String(required=True)


class DocumentResponseSchema(Schema):
    url: str = fields.String(required=True)
    uuid: str = fields.String(required=True)


class DocumentPatchRequestSchema(Schema):
    agreement_id: int = fields.Int(required=True)
    document_id: str = fields.String(required=True)
    status: str = fields.String(required=True)
