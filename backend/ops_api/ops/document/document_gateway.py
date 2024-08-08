from flask import Config
from flask_jwt_extended import current_user

from ops_api.ops.auth.auth_types import ProviderTypes
from ops_api.ops.document.azure_document_repository import AzureDocumentRepository
from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.document_repository_factory import DocumentRepositoryFactory
from ops_api.ops.document.fake_document_repository import FakeDocumentRepository


class DocumentGateway:
    def __init__(self, config: Config) -> None:
        self.providers = config.get("AUTHLIB_OAUTH_CLIENTS", {})
        self.repository_factory = DocumentRepositoryFactory()

        # Validate and register providers with the factory
        self.register_providers(self.providers)

        # Select provider based on the current user
        if current_user.id >= 500:  # Users with id 5xx are test users
            self.provider = ProviderTypes.fakeauth.name
        else:
            self.provider = ProviderTypes.logingov.name

    def register_providers(self, providers: dict[str, dict]) -> None:
        """
        Register document repository providers with the factory.
        """
        for provider_name, provider_config in providers.items():
            if provider_name not in ProviderTypes.__members__:
                raise ValueError(f"Invalid document repository provider: {provider_name}")

            self.repository_factory.register_provider(provider_name, self.get_repository_class(provider_name))

    def get_repository_class(self, provider_name: str) -> DocumentRepository:
        """
        Return the document repository class corresponding to the provider.
        """
        if provider_name == ProviderTypes.fakeauth.name:
            return FakeDocumentRepository()
        elif provider_name == ProviderTypes.logingov.name or provider_name == ProviderTypes.hhsams.name:
            return AzureDocumentRepository()
        else:
            raise NotImplementedError(f"Unsupported document repository provider: {provider_name}")

    def create_repository(self) -> DocumentRepository:
        """
        Create a document repository instance based on the provider name.
        """
        return self.repository_factory.create_repository(self.provider)
