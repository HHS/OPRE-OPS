from flask import Config

from ops_api.ops.auth.decorators import is_user_active
from ops_api.ops.document.azure_document_repository import AzureDocumentRepository
from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.document_repository_factory import DocumentRepositoryFactory
from ops_api.ops.document.fake_document_repository import FakeDocumentRepository


class DocumentGateway:
    def __init__(self, config: Config) -> None:
        self.provider = config["AUTHLIB_OAUTH_CLIENTS"]
        self.repository_factory = DocumentRepositoryFactory()

        # Validate and register providers with the factory
        self.register_provider(self.provider)

    def register_provider(self, provider: str) -> None:
        """
        Register document repository providers with the factory.
        """
        supported_providers = ["fakeauth", "logingov", "hhsams"]

        if provider not in supported_providers:
            raise ValueError(f"Invalid document repository provider: {provider}")

        self.repository_factory.register_provider(provider, self.get_repository_class(provider))

    def get_repository_class(self, provider_name: str) -> DocumentRepository:
        """
        Return the document repository class corresponding to the provider.
        """
        if provider_name == "fakeauth":
            return FakeDocumentRepository()
        elif provider_name == "logingov" or provider_name == "hhsams":
            return AzureDocumentRepository()
        else:
            raise NotImplementedError(f"Unsupported document repository provider: {provider_name}")

    @is_user_active
    def create_repository(self) -> DocumentRepository:
        """
        Create a document repository instance based on the provider name.
        """
        return self.repository_factory.create_repository(self.provider)
