import unittest
from unittest.mock import Mock

from ops_api.ops.document.document_gateway import DocumentGateway
from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.service import DocumentService


class TestDocumentService(unittest.TestCase):
    def setUp(self):
        self.mock_gateway = Mock(spec=DocumentGateway)
        self.mock_repository = Mock(spec=DocumentRepository)
        self.mock_gateway.create_repository.return_value = self.mock_repository

        self.document_service = DocumentService(self.mock_gateway)

    def test_create_document(self):
        document_data = {"file_name": "Test Document.pdf"}
        self.mock_repository.add_document.return_value = {"uuid": "123", "url": "mock_url"}

        result = self.document_service.create_document(document_data)

        self.assertEqual(result, {"uuid": "123", "url": "mock_url"})
        self.mock_repository.add_document.assert_called_once_with(document_data)

    def test_get_documents_by_agreement_id(self):
        agreement_id = "456"
        self.mock_repository.get_documents_by_agreement_id.return_value = [
            {"uuid": "123", "file_name": "Test Document 1.pdf"},
            {"uuid": "456", "file_name": "Test Document 2.pdf"},
        ]

        result = self.document_service.get_documents_by_agreement_id(agreement_id)

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["uuid"], "123")
        self.assertEqual(result[1]["uuid"], "456")
        self.mock_repository.get_documents_by_agreement_id.assert_called_once_with(agreement_id)
