import os
import uuid
from datetime import datetime, timedelta, timezone

from azure.identity import DefaultAzureCredential
from azure.storage.blob import AccountSasPermissions, BlobServiceClient, ResourceTypes, generate_container_sas
from flask import Config, current_app

from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.exceptions import SasUrlGenerationError
from ops_api.ops.document.utils import get_by_agreement_id, insert_new_document, process_status_update


class AzureDocumentRepository(DocumentRepository):
    def __init__(self) -> None:
        self.config = Config
        self.storage_account_name = os.getenv("DOCUMENT_STORAGE_ACCOUNT_NAME")
        self.storage_container_name = os.getenv("DOCUMENT_STORAGE_CONTAINER_NAME")

    def add_document(self, document_data):
        try:
            # Insert document record into the database
            document_data["document_id"] = str(uuid.uuid4())
            document_record = insert_new_document(document_data)
            document_id = document_record.document_id

            return {
                "url": generate_container_sas_url(self.storage_account_name, "docs", upload=True),
                "uuid": document_id,
            }

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
        url = generate_container_sas_url(self.storage_account_name, "docs", download=True)
        return {"url": url, "documents": get_by_agreement_id(agreement_id)}

    def update_document_status(self, document_id, status):
        process_status_update(document_id, status)


def generate_container_sas_url(account_name, container_name, download=False, upload=False, expiry_hours=1):
    """
    Generate an SAS URL for the Azure Blob Storage at the container level.

    :param account_name: The name of the Azure Storage account.
    :param container_name: The container to work within the Azure Storage Account.
    :param download: Boolean value which indicates the SAS token generated is for downloading a file.
    :param upload: Boolean value which indicates that the SAS token generated is for uploading a file.
    :param expiry_hours: The number of hours for which the SAS token should be valid.
    :return: The SAS URL for the storage account.
    """
    try:
        # Define the expiration time of the SAS token. Default is one hour.
        now_time = datetime.now(tz=timezone.utc)
        expiry_time = now_time + timedelta(hours=expiry_hours)

        # Construct the SAS URL
        DEFAULT_DEV_OPS_URL = "https://dev.ops.opre.acf.gov"
        OPS_URL = (
            DEFAULT_DEV_OPS_URL
            if "localhost" in current_app.config.get("OPS_FRONTEND_URL")
            else current_app.config.get("OPS_FRONTEND_URL")
        )
        old_url = f"https://{account_name}.blob.core.windows.net/"
        credential = DefaultAzureCredential()
        blob_service_client = BlobServiceClient(account_url=old_url, credential=credential)

        user_delegation_key = blob_service_client.get_user_delegation_key(
            key_start_time=now_time, key_expiry_time=expiry_time
        )
        sas_permissions = None
        if download:
            sas_permissions = AccountSasPermissions(read=True, list=True)
        if upload:
            sas_permissions = AccountSasPermissions(write=True)

        if sas_permissions is None:
            raise ValueError("Neither Upload nor Download was specified for SAS Token generation.")
        # Generate the SAS token
        sas_token = generate_container_sas(
            account_name=account_name,
            container_name=container_name,
            user_delegation_key=user_delegation_key,
            resource_types=ResourceTypes(service=True, container=True, object=True),
            permission=sas_permissions,
            start=now_time,
            expiry=expiry_time,
        )

        # https://dev.ops.opre.acf.gov/?{sas_token} in dev
        sas_url = f"{OPS_URL}/?{sas_token}"
        return sas_url

    except SasUrlGenerationError as e:
        raise e
