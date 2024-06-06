from threading import Lock

from flask import Config

from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.exceptions import DocumentAlreadyExistsError, DocumentNotFoundError


class FakeDocumentRepository(DocumentRepository):
    def __init__(self) -> None:
        self.config = Config
        self.documents = {}
        self.lock = Lock()

    def add_document(self, document_id, document_content):
        with self.lock:
            if document_id in self.documents:
                raise DocumentAlreadyExistsError("Document already exists")
            else:
                self.documents[document_id] = document_content

    def get_document(self, document_id):
        with self.lock:
            return self.documents.get(document_id, None)

    def update_document(self, document_id, document_content):
        with self.lock:
            if document_id in self.documents:
                self.documents[document_id] = document_content
            else:
                raise DocumentNotFoundError("Document not found")

    def delete_document(self, document_id):
        with self.lock:
            if document_id in self.documents:
                del self.documents[document_id]
            else:
                raise DocumentNotFoundError("Document not found")
