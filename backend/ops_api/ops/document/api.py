from flask import Response, current_app, request

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.document.document_gateway import DocumentGateway
from ops_api.ops.document.schema import (
    DocumentResponseSchema,
    DocumentsResponseSchema,
    PatchDocumentRequestSchema,
    PostDocumentRequestSchema,
)
from ops_api.ops.document.service import DocumentService
from ops_api.ops.utils.response import make_response_with_headers


class DocumentAPI(BaseItemAPI):
    # TODO: Add limit and offset
    @is_authorized(PermissionType.GET, Permission.UPLOAD_DOCUMENT)
    def get(self, agreement_id: int) -> Response:
        # Call document service to get documents by agreement_id
        document_service = DocumentService(DocumentGateway(current_app.config))
        results = document_service.get_documents_by_agreement_id(agreement_id)

        # Prepare response
        response_schema = DocumentsResponseSchema()
        response_data = response_schema.dump(results)
        return make_response_with_headers(data=response_data, status_code=200)

    @is_authorized(PermissionType.POST, Permission.UPLOAD_DOCUMENT)
    def post(self) -> Response:
        # Use schema to validate request data and get document data
        request_data = request.get_json()
        request_schema = PostDocumentRequestSchema()
        document_data = request_schema.dump(request_schema.load(request_data))

        # Call document service to add the document
        document_service = DocumentService(DocumentGateway(current_app.config))
        result = document_service.create_document(document_data)

        # Prepare response
        response_schema = DocumentResponseSchema()
        response_data = response_schema.dump(result)
        return make_response_with_headers(data=response_data, status_code=201)

    @is_authorized(PermissionType.PATCH, Permission.UPLOAD_DOCUMENT)
    def patch(self, document_id: int) -> Response:
        # Use schema to validate request data and get status
        request_data = request.get_json()
        request_schema = PatchDocumentRequestSchema()
        document_data = request_schema.dump(request_schema.load(request_data))

        # Call document service to update the document status
        document_service = DocumentService(DocumentGateway(current_app.config))
        result = document_service.update_document_status(document_id, document_data)

        return make_response_with_headers(data=result, status_code=200)
