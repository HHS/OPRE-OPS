from flask import Blueprint, Response, current_app, request

from ops_api.ops.document.document_gateway import DocumentGateway
from ops_api.ops.document.exceptions import ValidationError
from ops_api.ops.document.schema import DocumentRequestSchema, DocumentResponseSchema, GetDocumentRequestSchema
from ops_api.ops.document.service import DocumentService
from ops_api.ops.utils.response import make_response_with_headers

# Create Blueprint object
documents_bp = Blueprint("documents", __name__)


@documents_bp.route("/documents/", methods=["GET"])
def get_documents_by_agreement_id():

    # Validate request data
    request_schema = GetDocumentRequestSchema()
    try:
        request_data = request_schema.dump(request_schema.load(request.args))
        request_schema.validate(request_data)
    except ValidationError as e:
        return make_response_with_headers({"message": "Validation Error", "errors": e}, 400)

    # Get agreement_id from request
    agreement_id = request.args.get("agreement_id")

    if not agreement_id:
        return make_response_with_headers({"message": "agreement_id parameter is required"}, 400)

    # Call document service to get documents by agreement_id
    document_service = DocumentService(DocumentGateway(current_app.config))
    documents = document_service.get_documents_by_agreement_id(agreement_id)

    # Prepare response
    response_schema = DocumentResponseSchema(many=True)
    response_data = response_schema.dump({"documents": documents})
    return make_response_with_headers(data=response_data, status_code=200)


@documents_bp.route("/documents/", methods=["POST"])
def create_document() -> Response:
    # Validate request data
    request_data = request.get_json()
    request_schema = DocumentRequestSchema()

    try:
        validated_data = request_schema.load(request_data)
    except ValidationError as e:
        return make_response_with_headers({"message": "Validation Error", "errors": e}, 400)

    # Call document service to add the document
    document_service = DocumentService(DocumentGateway(current_app.config))
    document = document_service.create_document(validated_data)

    # Prepare response
    response_schema = DocumentResponseSchema()
    response_data = response_schema.dump(document)

    return make_response_with_headers(response_data, 201)
