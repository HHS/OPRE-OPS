from __future__ import annotations

import csv
import logging
import time
from dataclasses import dataclass
from io import StringIO
from typing import Optional
from urllib.parse import urlparse

from azure.core.credentials import AzureNamedKeyCredential
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobServiceClient

logger = logging.getLogger(__name__)
LOGGER_FORMAT = "%(asctime)s %(name)s :: %(levelname)-8s :: %(message)s"
logging.Formatter.converter = time.gmtime


@dataclass
class AzureStorageAccount:
    name: str
    container_name: str
    account_url: str
    access_key: str

def get_secret(vault_url: str, key_name: str) -> str:
    credential = DefaultAzureCredential()
    secret_client = SecretClient(vault_url=vault_url, credential=credential)
    secret = secret_client.get_secret(key_name)
    return secret.value

def get_container_client(storage_account: AzureStorageAccount):
    default_credential = AzureNamedKeyCredential(storage_account.name, storage_account.access_key)
    blob_service_client = BlobServiceClient(storage_account.account_url, credential=default_credential)
    return blob_service_client.get_container_client(storage_account.container_name)

def get_blob_string(storage_account: AzureStorageAccount, file_name: str) -> str:
    container_client = get_container_client(storage_account)
    return container_client.download_blob(file_name).readall().decode("utf-8")

def blob_to_records(storage_account: AzureStorageAccount, file_name: str, dialect: str = "excel-tab") -> csv.DictReader:
    blob_string = get_blob_string(storage_account, file_name)
    return csv.DictReader(StringIO(blob_string), dialect=dialect)


@dataclass
class AzureVaultPath:
    url: str
    secret_name: str


def get_csv(csv_path: str, dialect: str = "excel-tab", vault_path: Optional[AzureVaultPath] = None) -> csv.DictReader:
    """
    Get a CSV file from a local path or a remote URL. If the path is a remote URL, the file will be downloaded from Azure Blob Storage.

    :param csv_path: The path to the CSV file. This can be a local path or a remote URL.
    :param dialect: The CSV dialect to use when reading the file.
    :param secret_vault_path: The URL of the Azure Key Vault where the secret is stored.
    :param secret_name: The name of the secret that contains the Azure Storage Account access key.
    """
    parts = urlparse(csv_path)
    if parts.scheme == "https":
        if vault_path:
            storage_account = AzureStorageAccount(
                name=parts.hostname.split(".")[0],
                container_name=parts.path.split("/")[1],
                account_url=f"https://{parts.hostname}",
                access_key=get_secret(vault_path.url, vault_path.secret_name),
            )
        else:
            raise ValueError("vault_path is required for remote CSV files.")
        return blob_to_records(storage_account, "/".join(parts.path.split("/")[2:]), dialect=dialect)
    else:
        return csv.DictReader(open(csv_path, "r") , dialect=dialect)
