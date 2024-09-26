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
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.types import DataToolsConfig

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


def get_csv(csv_path: str, config: DataToolsConfig = PytestConfig(), dialect: str = "excel-tab") -> csv.DictReader:
    """
    Get a CSV file from a local path or a remote URL. If the path is a remote URL, the file will be downloaded from Azure Blob Storage.

    :param csv_path: The path to the CSV file. This can be a local path or a remote URL.
    :param config: The configuration object.
    :param dialect: The CSV dialect to use when reading the file.
    """
    parts = urlparse(csv_path)
    if parts.scheme == "https":
        # file is remote
        if config.file_storage_auth_method == "rbac":
            raise ValueError("RBAC is not supported for Azure Blob Storage.")

        elif config.file_storage_auth_method == "access_key":
            storage_account = AzureStorageAccount(
                name=parts.hostname.split(".")[0],
                container_name=parts.path.split("/")[1],
                account_url=f"https://{parts.hostname}",
                access_key=get_secret(config.vault_url, config.vault_file_storage_key),
            )
            return blob_to_records(storage_account, "/".join(parts.path.split("/")[2:]), dialect=dialect)

        else:
            raise ValueError("Invalid value for FILE_STORAGE_AUTH_METHOD. Must be either 'access_key' or 'rbac'.")
    else:
        # file is local
        return csv.DictReader(open(csv_path, "r") , dialect=dialect)
