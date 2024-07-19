import unittest
from unittest.mock import MagicMock, Mock, patch

from flask import Flask
from flask_jwt_extended import current_user

from models import Role, User
from ops_api.ops.auth.exceptions import AuthenticationError
from ops_api.ops.document.document_gateway import DocumentGateway
from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.service import DocumentService
from ops_api.ops.utils.events import OpsEventHandler


class TestDocumentService(unittest.TestCase):
    def setUp(self):
        # Mock Flask app
        self.app = Flask(__name__)
        self.app.config["AUTHLIB_OAUTH_CLIENTS"] = "fakeauth"
        self.client = self.app.test_client()

        # Mock current_user with admin roles
        self.mock_user = User(id=1, roles=[Role(name="admin")])
        self.app.before_request(lambda: setattr(current_user, "id", self.mock_user.id))
        self.app.before_request(lambda: setattr(current_user, "roles", self.mock_user.roles))

        # Mock DocumentGateway
        self.mock_gateway = Mock(spec=DocumentGateway)
        self.mock_repository = Mock(spec=DocumentRepository)
        self.mock_gateway.create_repository.return_value = self.mock_repository

        # Initialize DocumentService with mocked dependencies
        self.document_service = DocumentService(self.mock_gateway, current_user_id=self.mock_user.id, is_admin=True)

        # Mock request document data
        self.mock_doc_data = {"file_name": "Test Document.pdf", "agreement_id": 123, "document_type": "PDF"}
        self.mock_repo_result = {"uuid": "123", "url": "mock_url"}
        self.mock_agreement_id = "456"

        # Mock event handler
        self.mock_event_handler = MagicMock(spec=OpsEventHandler)
        self.mock_event_handler.__enter__.return_value.metadata = {}
        self.mock_event_handler.__enter__.return_value.metadata.update({"new_document": self.mock_repo_result})

    def test_create_document(self):
        self.mock_repository.add_document.return_value = self.mock_repo_result

        with patch("ops_api.ops.document.service.OpsEventHandler", return_value=self.mock_event_handler):
            with patch.object(self.document_service, "can_access_docs", return_value=True):
                result = self.document_service.create_document(self.mock_doc_data)

            self.assertEqual(result, self.mock_repo_result)
            self.mock_repository.add_document.assert_called_once_with(self.mock_doc_data)

    def test_get_documents_by_agreement_id(self):
        self.mock_repository.get_documents_by_agreement_id.return_value = [
            {"uuid": "123", "file_name": "Test Document 1.pdf"},
            {"uuid": "456", "file_name": "Test Document 2.pdf"},
        ]

        with patch.object(self.document_service, "can_access_docs", return_value=True):
            result = self.document_service.get_documents_by_agreement_id(self.mock_agreement_id)

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["uuid"], "123")
        self.assertEqual(result[1]["uuid"], "456")
        self.mock_repository.get_documents_by_agreement_id.assert_called_once_with(self.mock_agreement_id)

    def test_create_document_unauthorized(self):
        with patch("ops_api.ops.document.service.OpsEventHandler", return_value=self.mock_event_handler):
            with patch.object(self.document_service, "can_access_docs", return_value=False):
                with self.assertRaises(AuthenticationError):
                    self.document_service.create_document(self.mock_doc_data)

    def test_get_documents_by_agreement_id_unauthorized(self):
        with patch.object(self.document_service, "can_access_docs", return_value=False):
            with self.assertRaises(AuthenticationError):
                self.document_service.get_documents_by_agreement_id(self.mock_agreement_id)
