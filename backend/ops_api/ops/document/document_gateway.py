from flask import Config, current_app

from ops_api.ops.document.azure_document_repository import AzureDocumentRepository
from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.document_repository_factory import DocumentRepositoryFactory
from ops_api.ops.document.fake_document_repository import FakeDocumentRepository
from ops_api.ops.document.utils import DocumentProviders


class DocumentGateway:
    def __init__(self, config: Config) -> None:
        self.providers = config.get("DOCUMENT_PROVIDERS", {})
        self.repository_factory = DocumentRepositoryFactory()

        # Validate and register providers with the factory
        self.register_providers()

        if "localhost" in current_app.config.get("OPS_FRONTEND_URL"):
            self.provider = DocumentProviders.fake.name
        else:
            self.provider = DocumentProviders.azure.name

    def register_providers(self) -> None:
        """
        Register document providers with the factory.
        """
        for each in self.providers:
            if each not in DocumentProviders.__members__:
                raise ValueError(f"Invalid document repository provider: {each}")

            self.repository_factory.register_provider(each, self.get_repository_class(each))

    def get_repository_class(self, provider_name: str) -> DocumentRepository:
        """
        Return the document repository class corresponding to the provider.
        """
        if provider_name == DocumentProviders.fake.name:
            return FakeDocumentRepository()
        elif provider_name == DocumentProviders.azure.name:
            return AzureDocumentRepository()
        else:
            raise NotImplementedError(f"Unsupported document repository provider: {provider_name}")

    def create_repository(self) -> DocumentRepository:
        """
        Create a document repository instance based on the provider name.
        """
        return self.repository_factory.create_repository(self.provider)
