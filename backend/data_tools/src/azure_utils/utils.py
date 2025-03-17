from __future__ import annotations

import csv
import io
import os
import sys
from dataclasses import dataclass
from io import StringIO
from urllib.parse import urlparse

from azure.core.credentials import AzureNamedKeyCredential
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobServiceClient, ContainerClient
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.types import DataToolsConfig
from loguru import logger

logger.add(sys.stdout, format="{time} {level} {message}", level="DEBUG")
logger.add(sys.stderr, format="{time} {level} {message}", level="DEBUG")


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


PYTEST_CONFIG = PytestConfig()


def get_csv(csv_path: str, config: DataToolsConfig = PYTEST_CONFIG, dialect: str = "excel-tab") -> csv.DictReader:
    """
    Get a CSV file from a local path or a remote URL. If the path is a remote URL,
    the file will be downloaded from Azure Blob Storage.

    :param csv_path: The path to the CSV file. This can be a local path or a remote URL.
    :param config: The configuration object.
    :param dialect: The CSV dialect to use when reading the file.
    """
    logger.debug(f"Getting CSV file from {csv_path}.")
    logger.debug(f"Using config: {config}")
    logger.debug(f"Using dialect: {dialect}")

    parts = urlparse(csv_path)

    if parts.scheme == "https":
        # file is remote
        if config.file_storage_auth_method == "rbac":
            return get_csv_using_mi_or_rbac(parts, dialect=dialect)

        elif config.file_storage_auth_method == "access_key":
            storage_account = AzureStorageAccount(
                name=parts.hostname.split(".")[0],
                container_name=parts.path.split("/")[1],
                account_url=f"https://{parts.hostname}",
                access_key=get_secret(config.vault_url, config.vault_file_storage_key),
            )
            return blob_to_records(storage_account, "/".join(parts.path.split("/")[2:]), dialect=dialect)
        elif config.file_storage_auth_method == "mi":
            return get_csv_using_mi_or_rbac(parts, dialect=dialect)
        else:
            raise ValueError("Invalid value for FILE_STORAGE_AUTH_METHOD.")
    else:
        # file is local
        return csv.DictReader(open(csv_path, "r"), dialect=dialect)


MI_CLIENT_ID = os.getenv("MI_CLIENT_ID")


def get_csv_using_mi_or_rbac(parts: tuple, dialect: str = "excel-tab", client_id: str = MI_CLIENT_ID) -> csv.DictReader:
    """
    Get a CSV file from a remote URL using Managed Identity.

    :param parts: The parsed URL parts.
    :param dialect: The CSV dialect to use when reading the file.
    :param client_id: The client ID to use for Managed Identity.
    """
    account_url = f"https://{parts.hostname}"
    logger.debug(f"Using Managed Identity with account URL: {account_url}")
    container_name = parts.path.split("/")[1]
    logger.debug(f"Container name: {container_name}")
    blob_name = "/".join(parts.path.split("/")[2:])
    logger.debug(f"Blob name: {blob_name}")
    logger.info(f"Using Managed Identity with client ID: {client_id}")

    if client_id is None:
        logger.warning("No client ID provided. Using RBAC.")
        credential = DefaultAzureCredential()
    else:
        credential = DefaultAzureCredential(managed_identity_client_id=client_id)
    with BlobServiceClient(account_url, credential=credential) as blob_service_client:
        container_client = blob_service_client.get_container_client(container=container_name)
        bytes_data = get_blob(container_client, blob_name)
        stream_str = bytes_data.decode("utf-8")
        logger.debug(f"Stream: {stream_str}")
        return csv.DictReader(io.StringIO(stream_str), dialect=dialect)


def get_blob(container_client: ContainerClient, blob_name: str) -> bytes:
    """
    Download a blob to bytes.

    :param container_client: The blob client.
    :param blob_name: The name of the blob.

    :return: The blob bytes.
    """
    bytes_data = container_client.download_blob(blob_name).readall()
    logger.info(f"Downloaded {len(bytes_data)} bytes.")
    return bytes_data
