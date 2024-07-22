import uuid
from threading import Lock

from flask import Config

from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.exceptions import DocumentAlreadyExistsError, DocumentNotFoundError


class FakeDocumentRepository(DocumentRepository):
    def __init__(self) -> None:
        self.config = Config
        self.documents = {}
        self.lock = Lock()

    def add_document(self, document_content):
        agreement_id = document_content.get("agreement_id")
        document_type = document_content.get("document_type")

        # Check if document already exists by agreement_id and document_type
        for doc in self.documents.values():
            if doc.get("agreement_id") == agreement_id and doc.get("document_type") == document_type:
                raise DocumentAlreadyExistsError("Document already exists")

        with self.lock:
            document_id = str(uuid.uuid4())
            self.documents[document_id] = document_content

        return {"uuid": document_id, "url": f"FakeDocumentRepository/{document_id}"}

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

    def get_documents_by_agreement_id(self, agreement_id):
        with self.lock:
            return [doc for doc in self.documents.values() if doc.get("agreement_id") == agreement_id]

    def update_document_status(self, document_id, status):
        with self.lock:
            if document_id in self.documents:
                self.documents[document_id]["status"] = status
            else:
                raise DocumentNotFoundError("Document not found")
