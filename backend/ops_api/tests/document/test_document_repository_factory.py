import uuid
from unittest.mock import MagicMock, patch

import pytest

from models import Document, DocumentType
from ops_api.ops.document.document_repository_factory import DocumentRepositoryFactory, UnsupportedProviderError
from ops_api.ops.document.exceptions import DocumentAlreadyExistsError, DocumentNotFoundError
from ops_api.ops.document.fake_document_repository import FakeDocumentRepository
from ops_api.ops.document.utils import insert_new_document
from ops_api.tests.document.test_case import BaseDocumentTestCase


@pytest.fixture()
def document_repository_factory():
    return DocumentRepositoryFactory()


@pytest.fixture()
def repository(document_repository_factory):
    document_repository_factory.register_provider("mockfakeauth", FakeDocumentRepository())
    return document_repository_factory.create_repository("mockfakeauth")


class TestDocumentRepositoryFactory(BaseDocumentTestCase):
    def setUp(self):
        super().setUp()
        self.provider = "mock_fake_auth"

        self.mock_document_data = {
            "agreement_id": 1,
            "document_id": "mock-doc-id",
            "document_type": "Certification of Funding",
            "file_name": "Certification of Funding.pdf",
        }

        self.mock_document = Document(
            agreement_id=1,
            document_id="uuid",
            document_type=DocumentType.CERTIFICATION_OF_FUNDING,
            file_name="Certification of Funding.pdf",
        )

        self.mock_repository_factory = DocumentRepositoryFactory()

        self.mock_repository_factory.register_provider(self.provider, FakeDocumentRepository())
        self.mock_repository = self.mock_repository_factory.create_repository(self.provider)

        self.mock_insert = MagicMock(spec=insert_new_document)
        self.mock_insert.return_value = self.mock_document
        print(self.mock_insert.return_value)

    def tearDown(self):
        pass

    def test_register_provider(self):
        mock_repository_class = FakeDocumentRepository()
        self.mock_repository_factory.register_provider(self.provider, mock_repository_class)
        assert self.mock_repository_factory._registered_providers[self.provider] == mock_repository_class

    def test_create_repository_with_valid_provider(self):
        fake_repository = FakeDocumentRepository()

        self.mock_repository_factory.register_provider(self.provider, fake_repository)
        repository = self.mock_repository_factory.create_repository(self.provider)

        assert repository == fake_repository

    def test_create_repository_with_invalid_provider(self):
        with pytest.raises(UnsupportedProviderError):
            self.mock_repository_factory.create_repository("invalid_provider")

    @patch("ops_api.ops.document.fake_document_repository.insert_new_document")
    def test_add_document(self, mock_insert):
        mock_insert.return_value = self.mock_document
        created_document = self.mock_repository.add_document(self.mock_document_data)

        mock_insert.assert_called_once_with(self.mock_document_data)
        assert "uuid" in created_document
        assert created_document["uuid"] is not None
        assert created_document["url"] == f"FakeDocumentRepository/{created_document['uuid']}"

    def test_add_existing_document_raises_error(
        self,
    ):
        self.mock_repository.documents = {self.mock_document_data["document_id"]: self.mock_document_data}
        with pytest.raises(DocumentAlreadyExistsError):
            self.mock_repository.add_document(self.mock_document_data)

    def test_update_document(self):
        mock_update = "Certification of Funding V2.pdf"

        self.mock_repository.documents = {self.mock_document_data["document_id"]: self.mock_document_data}

        self.mock_repository.update_document(
            document_id=self.mock_document_data["document_id"],
            document_content={"file_name": mock_update, "document_type": "PDF", "agreement_id": 123},
        )

        updated_document = self.mock_repository.get_document(self.mock_document_data["document_id"])
        assert updated_document["file_name"] == mock_update

    def test_update_nonexistent_document_raises_error(self):
        with pytest.raises(DocumentNotFoundError):
            self.mock_repository.update_document("123", self.mock_document_data)

    def test_delete_document(self):
        self.mock_repository.documents = {self.mock_document_data["document_id"]: self.mock_document_data}
        self.mock_repository.delete_document(self.mock_document_data["document_id"])
        deleted_document = self.mock_repository.get_document(self.mock_document_data["document_id"])
        assert deleted_document is None

    def test_delete_nonexistent_document_raises_error(self):
        with pytest.raises(DocumentNotFoundError):
            self.mock_repository.delete_document("123")

    @patch("ops_api.ops.document.fake_document_repository.process_status_update")
    def test_update_status_existing_document(self, mock_process_status_update):
        mock_process_status_update.return_value = None
        new_status = "uploaded"
        document_id = str(uuid.uuid4())
        resp = self.mock_repository.update_document_status(document_id, new_status)
        mock_process_status_update.assert_called_once_with(document_id, new_status)
        self.assertIsNone(resp)

    @patch("ops_api.ops.document.fake_document_repository.process_status_update")
    def test_update_status_nonexistent_document(self, mock_process_status_update):
        mock_process_status_update.side_effect = DocumentNotFoundError("Document not found")
        non_existent_id = str(uuid.uuid4())
        with pytest.raises(DocumentNotFoundError):
            self.mock_repository.update_document_status(non_existent_id, "")
