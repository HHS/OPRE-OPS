import uuid
from unittest.mock import Mock

import pytest

from ops_api.ops.document.document_repository_factory import DocumentRepositoryFactory, UnsupportedProviderError
from ops_api.ops.document.exceptions import DocumentAlreadyExistsError, DocumentNotFoundError
from ops_api.ops.document.fake_document_repository import FakeDocumentRepository

mock_document_data = {"file_name": "Certification of Funding.pdf", "document_type": "PDF", "agreement_id": 123}


@pytest.fixture()
def document_repository_factory():
    return DocumentRepositoryFactory()


def test_register_provider(document_repository_factory):
    mock_repository_class = FakeDocumentRepository()
    document_repository_factory.register_provider("mockfakeauth", mock_repository_class)
    assert document_repository_factory._registered_providers["mockfakeauth"] == mock_repository_class


def test_create_repository_with_valid_provider(document_repository_factory):
    fake_repository = FakeDocumentRepository()
    mock_repository_class = Mock(return_value=fake_repository)
    document_repository_factory.register_provider("mockfakeauth", mock_repository_class)
    repository = document_repository_factory.create_repository("mockfakeauth")
    assert repository == fake_repository


def test_create_repository_with_invalid_provider(document_repository_factory):
    with pytest.raises(UnsupportedProviderError):
        document_repository_factory.create_repository("invalid_provider")


@pytest.fixture()
def repository(document_repository_factory):
    document_repository_factory.register_provider("mockfakeauth", FakeDocumentRepository)
    return document_repository_factory.create_repository("mockfakeauth")


def test_add_document(repository):
    created_document = repository.add_document(mock_document_data)
    assert "uuid" in created_document
    assert created_document["uuid"] is not None
    assert created_document["url"] == f"FakeDocumentRepository/{created_document['uuid']}"
    assert repository.get_document(created_document["uuid"]) == mock_document_data


def test_add_existing_document_raises_error(repository):
    repository.add_document(mock_document_data)
    with pytest.raises(DocumentAlreadyExistsError):
        repository.add_document(mock_document_data)


def test_update_document(repository):
    mock_update = "Certification of Funding V2.pdf"

    created_document = repository.add_document(mock_document_data)
    created_test_uuid = created_document["uuid"]

    repository.update_document(
        document_id=created_test_uuid,
        document_content={"file_name": mock_update, "document_type": "PDF", "agreement_id": 123},
    )

    updated_document = repository.get_document(created_test_uuid)
    assert updated_document["file_name"] == mock_update


def test_update_nonexistent_document_raises_error(repository):
    with pytest.raises(DocumentNotFoundError):
        repository.update_document("123", mock_document_data)


def test_delete_document(repository):
    created_document = repository.add_document(mock_document_data)
    created_test_uuid = created_document["uuid"]
    repository.delete_document(created_test_uuid)
    deleted_document = repository.get_document(created_test_uuid)
    assert deleted_document is None


def test_delete_nonexistent_document_raises_error(repository):
    with pytest.raises(DocumentNotFoundError):
        repository.delete_document("123")


def test_update_existing_document(repository):
    new_status = "Uploaded"
    created_document = repository.add_document({"file_name": "Test.pdf", "document_type": "PDF", "agreement_id": 456})
    document_id = created_document["uuid"]
    repository.update_document_status(document_id, new_status)
    updated_document = repository.get_document(document_id)
    assert updated_document is not None
    assert updated_document["status"] == new_status


def test_update_nonexistent_document(repository):
    non_existent_id = str(uuid.uuid4())
    with pytest.raises(DocumentNotFoundError):
        repository.update_document_status(non_existent_id, "")
