from datetime import datetime, timedelta, timezone

from azure.core.credentials import AzureNamedKeyCredential
from azure.storage.blob import BlobClient, BlobSasPermissions, BlobServiceClient, generate_blob_sas
from flask import Config, current_app

from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.exceptions import DocumentNotFoundError, SasUrlGenerationError
from ops_api.ops.document.utils import insert_new_document, set_document_status_by_id


class AzureDocumentRepository(DocumentRepository):
    def __init__(self) -> None:
        self.config = Config
        self.account_key = self.config["UPLOADS_STORAGE_ACCOUNT_ACCESS_KEY"]
        self.storage_account_name = self.config["UPLOADS_STORAGE_ACCOUNT_NAME"]
        self.container_name = self.config["UPLOADS_STORAGE_CONTAINER_NAME"]

    def add_document(self, document_data):
        try:
            # Insert document record into the database
            document_record = insert_new_document(document_data)
            uuid = document_record.document_id

            # Generate SAS URL for the document
            url = generate_sas_url(
                self.storage_account_name, self.container_name, document_data["file_name"], self.account_key
            )

            return {"uuid": uuid, "url": url}

        except SasUrlGenerationError as e:
            current_app.logger.error(f"Failed to generate SAS URL: {e}")
            raise e
        except Exception as e:
            current_app.logger.error(f"Failed to add document record: {e}")
            raise e

    def get_document(self, document_id):
        pass

    def update_document(self, document_id, document_content):
        pass

    def delete_document(self, document_id):
        pass

    def get_documents_by_agreement_id(self, agreement_id):
        pass

    def update_document_status(self, document_id, status):
        try:
            set_document_status_by_id(document_id, status)
        except DocumentNotFoundError as e:
            current_app.logger.error(f"Document not found with uuid {document_id}: {e}")
            raise
        except Exception as e:
            current_app.logger.error(f"Failed to update document status: {e}")
            raise e


def create_blob_sas_token(blob_client: BlobClient, account_key: str):
    """
    Create a Shared Access Signature (SAS) token for an Azure Blob Storage Container
    """
    # SAS token is valid for one hour
    start_time = datetime.now(tz=timezone.utc)
    expiry_time = start_time + timedelta(hours=1)

    sas_token = generate_blob_sas(
        account_name=blob_client.account_name,
        container_name=blob_client.container_name,
        blob_name=blob_client.blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True, add=True, create=True, write=True),
        expiry=expiry_time,
        start=start_time,
    )

    return sas_token


def generate_sas_url(account_name, container_name, blob_name, account_key):
    """
    Generate a SAS URL for an Azure Blob Storage Container
    """
    try:
        credential = AzureNamedKeyCredential(account_name, account_key)
        blob_service_client = BlobServiceClient(
            account_url=f"https://{account_name}.blob.core.windows.net", credential=credential
        )
        container_client = blob_service_client.get_container_client(container_name)
        blob_client = container_client.get_blob_client(blob_name)

        sas_token = create_blob_sas_token(blob_client, account_key)
        return f"https://{account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"
    except SasUrlGenerationError as e:
        raise e
