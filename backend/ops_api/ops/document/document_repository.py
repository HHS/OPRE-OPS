from abc import ABC, abstractmethod


class DocumentRepository(ABC):
    @abstractmethod
    def add_document(self, document_id, document_content):
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
