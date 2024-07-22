from flask_jwt_extended import current_user

from models import OpsEventType
from ops_api.ops.auth.exceptions import AuthenticationError
from ops_api.ops.document.document_gateway import DocumentGateway
from ops_api.ops.document.utils import is_user_linked_to_agreement
from ops_api.ops.utils.events import OpsEventHandler


class DocumentService:
    def __init__(self, document_gateway: DocumentGateway, current_user_id=None, is_admin=False) -> None:
        self.gateway = document_gateway
        self.repository = self.gateway.create_repository()
        self.current_user_id = current_user_id if current_user_id else current_user.id
        self.is_admin_user = is_admin or ("admin" in current_user.roles if current_user else False)

    def can_access_docs(self, agreement_id):
        """
        Check if the current user can access documents for a specific agreement.
        """
        is_agreement_user = is_user_linked_to_agreement(self.current_user_id, agreement_id)
        return is_agreement_user or self.is_admin_user

    def get_documents_by_agreement_id(self, agreement_id):
        """
        Get all documents associated with a specific agreement ID.
        """
        if not self.can_access_docs(agreement_id):
            raise AuthenticationError(
                f"User {self.current_user_id} cannot access documents for agreement {agreement_id}"
            )

        return self.repository.get_documents_by_agreement_id(agreement_id)

    def create_document(self, document_data):
        """
        Create a new document.
        """
        with OpsEventHandler(OpsEventType.CREATE_DOCUMENT) as meta:
            agreement_id = document_data["agreement_id"]
            if not self.can_access_docs(agreement_id):
                raise AuthenticationError(
                    f"User {self.current_user_id} does not have access to create documents for agreement {agreement_id}"
                )

            response = self.repository.add_document(document_data)
            meta.metadata.update({"new_document": response, "agreement_id": agreement_id})

            return response

    def update_document_status(self, request):
        with OpsEventHandler(OpsEventType.UPDATE_DOCUMENT) as meta:
            agreement_id = request["agreement_id"]
            document_id = request["document_id"]
            status = request["status"]

            if not self.can_access_docs(agreement_id):
                raise AuthenticationError(
                    f"User {self.current_user_id} does not have access to PATCH documents for agreement {agreement_id}"
                )

            self.repository.update_document_status(document_id, status)

            meta.metadata.update(
                {"document_status_updated": status, "agreement_id": agreement_id, "document_id": document_id}
            )

            return {"message": f"Document {document_id} in agreement {agreement_id} status updated to {status}"}
