from ops_api.ops.document.document_gateway import DocumentGateway


class DocumentService:
    def __init__(self, document_gateway: DocumentGateway) -> None:
        self.gateway = document_gateway
        self.repository = self.gateway.create_repository()

    def create_document(self, document_data):
        """
        Create a new document.
        """
        return self.repository.add_document(document_data)

    def get_documents_by_agreement_id(self, agreement_id):
        """
        Get all documents associated with a specific agreement ID.
        """
        return self.repository.get_documents_by_agreement_id(agreement_id)
