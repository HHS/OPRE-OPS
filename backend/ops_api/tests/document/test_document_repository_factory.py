from unittest.mock import Mock

import pytest

from ops_api.ops.document.document_repository_factory import DocumentRepositoryFactory, UnsupportedProviderError
from ops_api.ops.document.exceptions import DocumentAlreadyExistsError, DocumentNotFoundError
from ops_api.ops.document.fake_document_repository import FakeDocumentRepository


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
    repository.add_document("123", "Example document")
    document = repository.get_document("123")
    assert document == "Example document"


def test_add_existing_document_raises_error(repository):
    repository.add_document("123", "Example document")
    with pytest.raises(DocumentAlreadyExistsError):
        repository.add_document("123", "Example document")


def test_update_document(repository):
    repository.add_document("123", "Example document")
    repository.update_document("123", "Updated document")
    updated_document = repository.get_document("123")
    assert updated_document == "Updated document"


def test_update_nonexistent_document_raises_error(repository):
    with pytest.raises(DocumentNotFoundError):
        repository.update_document("123", "Updated document")


def test_delete_document(repository):
    repository.add_document("123", "Example document")
    repository.delete_document("123")
    deleted_document = repository.get_document("123")
    assert deleted_document is None


def test_delete_nonexistent_document_raises_error(repository):
    with pytest.raises(DocumentNotFoundError):
        repository.delete_document("123")
