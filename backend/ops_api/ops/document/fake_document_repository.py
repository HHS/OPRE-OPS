from flask import Config

from ops_api.ops.document.document_repository import DocumentRepository


class FakeDocumentRepository(DocumentRepository):
    def __init__(self, provider_name: str, config: Config) -> None:
        self.provider_name = provider_name
        self.config = config
        self.documents = {}

    def add_document(self, document_id, document_content):
        self.documents[document_id] = document_content

    def get_document(self, document_id):
        return self.documents.get(document_id, None)

    def delete_document(self, document_id):
        if document_id in self.documents:
            del self.documents[document_id]
        else:
            raise ValueError("Document not found")
