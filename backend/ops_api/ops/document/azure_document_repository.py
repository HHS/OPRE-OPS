import os
import uuid
from datetime import datetime, timedelta, timezone

from azure.storage.blob import AccountSasPermissions, ResourceTypes, generate_account_sas
from flask import Config, current_app

from ops_api.ops.document.document_repository import DocumentRepository
from ops_api.ops.document.exceptions import SasUrlGenerationError
from ops_api.ops.document.utils import get_by_agreement_id, insert_new_document, process_status_update


class AzureDocumentRepository(DocumentRepository):
    def __init__(self) -> None:
        self.config = Config
        self.account_key = os.getenv("DOCUMENT_STORAGE_ACCOUNT_ACCESS_KEY")
        self.storage_account_name = os.getenv("DOCUMENT_STORAGE_ACCOUNT_NAME")

    def add_document(self, document_data):
        try:
            # Insert document record into the database
            document_data["document_id"] = str(uuid.uuid4())
            document_record = insert_new_document(document_data)
            document_id = document_record.document_id

            return {"url": generate_account_sas_url(self.storage_account_name, self.account_key), "uuid": document_id}

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
        url = generate_account_sas_url(self.storage_account_name, self.account_key)
        return {"url": url, "documents": get_by_agreement_id(agreement_id)}

    def update_document_status(self, document_id, status):
        process_status_update(document_id, status)


def generate_account_sas_url(account_name, account_key, expiry_hours=1):
    """
    Generate an SAS URL for the Azure Blob Storage account level.

    :param account_name: The name of the Azure Storage account.
    :param account_key: The account key for the Azure Storage account.
    :param expiry_hours: The number of hours for which the SAS token should be valid.
    :return: The SAS URL for the storage account.
    """
    try:
        # Define the expiration time of the SAS token. Default is one hour.
        expiry_time = datetime.now(tz=timezone.utc) + timedelta(hours=expiry_hours)

        # Generate the SAS token
        sas_token = generate_account_sas(
            account_name=account_name,
            account_key=account_key,
            resource_types=ResourceTypes(service=True, container=True, object=True),
            permission=AccountSasPermissions(
                read=True, write=True, delete=True, list=True, add=True, create=True, update=True, process=True
            ),
            expiry=expiry_time,
        )

        # Construct the SAS URL
        DEFAULT_DEV_OPS_URL = "https://dev.ops.opre.acf.gov"
        OPS_URL = (
            DEFAULT_DEV_OPS_URL
            if "localhost" in current_app.config.get("OPS_FRONTEND_URL")
            else current_app.config.get("OPS_FRONTEND_URL")
        )
        # https://dev.ops.opre.acf.gov/?{sas_token} in dev
        sas_url = f"{OPS_URL}/?{sas_token}"
        return sas_url

    except SasUrlGenerationError as e:
        raise e
