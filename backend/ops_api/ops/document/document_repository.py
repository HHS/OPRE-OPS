from abc import ABC, abstractmethod


class DocumentRepository(ABC):
    @abstractmethod
    def add_document(self, document_data):
        pass

    @abstractmethod
    def get_document(self, document_id):
        pass

    @abstractmethod
    def update_document(self, document_id, document_content):
        pass

    @abstractmethod
    def delete_document(self, document_id):
        pass

    @abstractmethod
    def get_documents_by_agreement_id(self, agreement_id):
        pass

    @abstractmethod
    def update_document_status(self, document_id, status):
        pass
