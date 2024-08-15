from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.exceptions import UnsupportedProviderError


class DocumentRepositoryFactory:
    _registered_providers = {}

    @staticmethod
    def register_provider(provider_name, repository_class):
        DocumentRepositoryFactory._registered_providers[provider_name] = repository_class

    @staticmethod
    def create_repository(provider_name: str) -> DocumentRepository:
        repository_class = DocumentRepositoryFactory._registered_providers.get(provider_name)
        if repository_class:
            return repository_class
        else:
            raise UnsupportedProviderError(f"Document repository provider '{provider_name}' is not supported.")
