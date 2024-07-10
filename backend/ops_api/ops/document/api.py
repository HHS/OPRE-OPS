from flask import Blueprint, Response, current_app, request

from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.document.document_gateway import DocumentGateway
from ops_api.ops.document.schema import DocumentRequestSchema, DocumentResponseSchema, GetDocumentRequestSchema
from ops_api.ops.document.service import DocumentService
from ops_api.ops.utils.response import make_response_with_headers

# Create Blueprint object
documents_bp = Blueprint("documents", __name__)


@documents_bp.route("/documents/", methods=["GET"])
@is_authorized(PermissionType.GET, Permission.UPLOAD_DOCUMENT)
def get_documents_by_agreement_id():

    # Use schema to validate request data and get agreement_id
    request_schema = GetDocumentRequestSchema()
    request_data = request_schema.dump(request_schema.load(request.args))

    # Call document service to get documents by agreement_id
    document_service = DocumentService(DocumentGateway(current_app.config))
    results = document_service.get_documents_by_agreement_id(request_data["agreement_id"])

    # Prepare response
    response_schema = DocumentResponseSchema(many=True)
    response_data = response_schema.dump([row[0] for row in results])
    return make_response_with_headers(data=response_data)


@documents_bp.route("/documents/", methods=["POST"])
@is_authorized(PermissionType.POST, Permission.UPLOAD_DOCUMENT)
def create_document() -> Response:
    # Use schema to validate request data and get document data
    request_data = request.get_json()
    request_schema = DocumentRequestSchema()
    document_data = request_schema.dump(request_schema.load(request_data))

    # Call document service to add the document
    document_service = DocumentService(DocumentGateway(current_app.config))
    result = document_service.create_document(document_data)

    # Prepare response
    response_schema = DocumentResponseSchema()
    response_data = response_schema.dump(result)
    return make_response_with_headers(data=response_data, status_code=201)
