from marshmallow import Schema, fields


class PatchDocumentRequestSchema(Schema):
    agreement_id: int = fields.Int(required=True)
    status: str = fields.String(required=True)


class PostDocumentRequestSchema(Schema):
    agreement_id: int = fields.Int(required=True)
    document_type: str = fields.String(required=True)
    file_name: str = fields.String(required=True)


class DocumentResponseSchema(Schema):
    url: str = fields.String(required=True)
    uuid: str = fields.String(required=True)


class DocumentSchema(Schema):
    document_id = fields.UUID(required=True)
    document_type = fields.String(required=True)
    file_name = fields.String(required=True)
    status = fields.String()
    created_by = fields.Integer(allow_none=True)
    updated_by = fields.Integer(allow_none=True)
    created_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)
    updated_on = fields.DateTime(format="%Y-%m-%dT%H:%M:%S.%fZ", allow_none=True)


class DocumentsResponseSchema(Schema):
    url: str = fields.String(required=True)
    documents: list = fields.List(fields.Nested(DocumentSchema), required=True)
