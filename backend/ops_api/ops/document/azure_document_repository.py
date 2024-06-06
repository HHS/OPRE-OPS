from flask import Config

from ops_api.ops.document.document_repository import DocumentRepository


class AzureDocumentRepository(DocumentRepository):
    def __init__(self) -> None:
        self.config = Config

    def add_document(self, document_id, document_content):
        pass

    def get_document(self, document_id):
        pass

    def update_document(self, document_id, document_content):
        pass

    def delete_document(self, document_id):
        pass
