from __future__ import annotations

import csv
import io
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from io import StringIO
from urllib.parse import urlparse

from azure.core.credentials import AzureNamedKeyCredential
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import (
    BlobSasPermissions,
    BlobServiceClient,
    ContainerClient,
    ContentSettings,
    generate_blob_sas,
)
from loguru import logger

from data_tools.environment.pytest import PytestConfig
from data_tools.environment.types import DataToolsConfig

logger.add(sys.stdout, format="{time} {level} {message}", level="DEBUG")
logger.add(sys.stderr, format="{time} {level} {message}", level="DEBUG")

# The user-assigned managed identity's client id, when running attached to one (e.g. the data-tools
# Container App Jobs). Blob/Vault access must select this identity explicitly; a bare
# DefaultAzureCredential cannot resolve a user-assigned MI when no system-assigned identity exists.
MI_CLIENT_ID = os.getenv("MI_CLIENT_ID")


@dataclass
class AzureStorageAccount:
    name: str
    container_name: str
    account_url: str
    access_key: str


def get_secret(vault_url: str, key_name: str, client_id: str | None = MI_CLIENT_ID) -> str:
    """Read a secret from Key Vault, selecting the user-assigned MI when one is attached.

    Mirrors the credential handling in ``upload_blob`` / ``get_csv_using_mi_or_rbac``: when a
    ``client_id`` (user-assigned MI client id) is present the credential is pinned to it, because a
    bare ``DefaultAzureCredential`` cannot resolve a user-assigned identity in the absence of a
    system-assigned one. Falls back to a plain credential (RBAC / access-key contexts) when unset.
    """
    if client_id is None:
        credential = DefaultAzureCredential()
    else:
        credential = DefaultAzureCredential(managed_identity_client_id=client_id)
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


def upload_blob(
    account_url: str,
    container_name: str,
    blob_name: str,
    data: bytes,
    client_id: str = MI_CLIENT_ID,
    content_type: str | None = None,
) -> None:
    """
    Upload a blob to Azure Blob Storage using Managed Identity (or RBAC when no client ID is set).

    Mirrors ``get_csv_using_mi_or_rbac``: the client is built inline from ``DefaultAzureCredential``
    inside a context manager so it is closed after the upload. Requires the identity to have write
    access (e.g. ``Storage Blob Data Contributor``) on the target container.

    :param account_url: The storage account URL, e.g. "https://<account>.blob.core.windows.net".
    :param container_name: The name of the container to upload to.
    :param blob_name: The full blob name (may include a prefix, e.g. "reports/usage-metrics.csv").
    :param data: The blob contents as bytes.
    :param client_id: The client ID to use for Managed Identity.
    :param content_type: Optional MIME type recorded as the blob's Content-Type so browsers
        downloading it (e.g. via a SAS link) save it correctly. When None, Azure defaults apply.
    """
    logger.info(f"Uploading blob {blob_name!r} to container {container_name!r} at {account_url}.")

    if client_id is None:
        logger.warning("No client ID provided. Using RBAC.")
        credential = DefaultAzureCredential()
    else:
        credential = DefaultAzureCredential(managed_identity_client_id=client_id)

    content_settings = ContentSettings(content_type=content_type) if content_type else None
    with BlobServiceClient(account_url, credential=credential) as blob_service_client:
        container_client = blob_service_client.get_container_client(container=container_name)
        container_client.upload_blob(name=blob_name, data=data, overwrite=True, content_settings=content_settings)
        logger.info(f"Uploaded {len(data)} bytes to {blob_name!r}.")


def build_blob_sas_url(
    account_url: str,
    container_name: str,
    blob_name: str,
    account_key: str,
    expiry_days: int,
) -> str:
    """Build a read-only, time-limited SAS download URL for a single blob.

    Signs an *account-key* SAS (not a user-delegation SAS) so the link can outlive the 7-day cap
    that Azure imposes on user-delegation keys -- the report link needs a longer window (e.g. 90
    days). The ``account_key`` is expected to be read from Key Vault via the managed identity at
    call time (see ``get_secret``), so no storage key is stored in the job's environment.

    The returned URL is a bearer token: anyone who holds it can read the blob until it expires.
    Scope it to the single report blob and keep the expiry as short as the use case allows; the
    report contains named-user data.

    :param account_url: The storage account URL, e.g. "https://<account>.blob.core.windows.net".
    :param container_name: The container the blob lives in.
    :param blob_name: The full blob name (may include a prefix, e.g. "reports/usage-metrics.xlsx").
    :param account_key: The storage account access key used to sign the SAS.
    :param expiry_days: How many days from now the link stays valid (must be > 0).
    :return: A full https URL with the SAS query string appended.
    """
    if expiry_days <= 0:
        raise ValueError(f"expiry_days must be > 0, got {expiry_days}.")

    account_name = urlparse(account_url).hostname.split(".")[0]
    expiry = datetime.now(timezone.utc) + timedelta(days=expiry_days)
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=container_name,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=expiry,
    )
    return f"{account_url}/{container_name}/{blob_name}?{sas_token}"
