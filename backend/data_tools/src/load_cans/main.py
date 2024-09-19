import os
import time
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse

import sqlalchemy.engine
from azure.core.credentials import AzureNamedKeyCredential
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobServiceClient
from data_tools.environment.azure import AzureConfig
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.common import DataToolsConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.local_migration import LocalMigrationConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.test import TestConfig
from flask.cli import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import configure_mappers

from models import BaseModel

configure_mappers()

import logging

logger = logging.getLogger(__name__)


load_dotenv()

LOGGER_FORMAT = "%(asctime)s %(name)s :: %(levelname)-8s :: %(message)s"
logging.Formatter.converter = time.gmtime

def init_db(
    config: DataToolsConfig, db: Optional[Engine] = None
) -> tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    if not db:
        engine = create_engine(
            config.db_connection_string, echo=config.verbosity, future=True
        )
    else:
        engine = db
    return engine, BaseModel.metadata


def get_config(environment_name: Optional[str] = None) -> DataToolsConfig:
    config: DataToolsConfig
    match environment_name:
        case "azure":
            config = AzureConfig()
        case "cloudgov":
            config = CloudGovConfig()
        case "local":
            config = LocalConfig()
        case "local-migration":
            config = LocalMigrationConfig()
        case "test":
            config = TestConfig()
        case "pytest":
            config = PytestConfig()
        case _:
            config = DevConfig()
    return config


def load(engine: sqlalchemy.engine.Engine, metadata: sqlalchemy.MetaData) -> None:
    pass

if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)

    db_engine, metadata = init_db(script_config)

    load(db_engine, metadata)



from __future__ import annotations

import logging
import sys

import click

logging.basicConfig(level=logging.DEBUG, format=LOGGER_FORMAT)

logger = logging.getLogger(__name__)

load_dotenv()

DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S.%f"

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

def blob_to_df(storage_account: AzureStorageAccount, file_name: str, index_col: str, sep: str = "\t") -> pd.DataFrame:
    blob_string = get_blob_string(storage_account, file_name)
    return pd.read_csv(StringIO(blob_string), index_col=index_col, sep=sep)

def get_csv(
    csv_path: str, sep: str = "\t", index: str = None, secret_vault_path: str = None, secret_name: str = None
):
    parts = urlparse(csv_path)
    if parts.scheme == "https":
        storage_account = AzureStorageAccount(
            name=parts.hostname.split(".")[0],
            container_name=parts.path.split("/")[1],
            account_url=f"https://{parts.hostname}",
            access_key=get_secret(secret_vault_path, secret_name),
        )
        return blob_to_df(storage_account, "/".join(parts.path.split("/")[2:]), index_col=index, sep=sep)
    else:
        return pd.read_csv(csv_path, index_col=index, sep=sep)


def load_cans_csv(csv_path: str, secret_vault_path: str = None, secret_name: str = None) -> None:
    """
    Load CANs CSV.
    """
    write_csv(df, csv_path, secret_vault_path=secret_vault_path, secret_name=secret_name)
    logger.info(f"Saved CSV file to {csv_path} with {len(df)} records.")


@click.command()
@click.option("--sql", help="The SQL to execute.")
@click.option("--connection-string", help="The connection string to the OPS ETL database.", required=False)
@click.option("--csv-file-path", help="The path to the CSV file.")
@click.option("--secret-vault-path", help="The path to the Azure Key Vault.", required=False)
@click.option(
    "--storage-access-key-secret-name", help="The secret name for the Azure Storage access key.", required=False
)
@click.option("--connection-secret-name", help="The secret name for the DB connection string.", required=False)
def main(
    sql: str,
    connection_string: str,
    csv_file_path: str,
    secret_vault_path: str,
    storage_access_key_secret_name: str,
    connection_secret_name: str,
):
    """
    Main entrypoint for the script.
    """
    if not connection_string and not connection_secret_name:
        print("Either --connection-string or --secret_vault_path and --connection-secret-name must be provided.")
        sys.exit(1)

    logger.info("Starting the ETL process.")

    if connection_string:
        db = psycopg2.connect(connection_string)
    else:
        db = create_connection_from_azure_details(secret_vault_path, connection_secret_name)

    csv_etl(db, sql, csv_file_path, secret_vault_path, storage_access_key_secret_name)

    logger.info("Finished the ETL process.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format=LOGGER_FORMAT)
    main()
