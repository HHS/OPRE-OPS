import os

from data_tools.environment.types import DataToolsConfig


class AzureConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        db_username = os.getenv("PGUSER")
        db_password = os.getenv("PGPASSWORD")
        db_host = os.getenv("PGHOST")
        db_port = os.getenv("PGPORT")
        db_name = os.getenv("PGDATABASE")

        if not db_username or not db_password or not db_host or not db_port or not db_name:
            raise ValueError("Missing environment variables for database connection.")

        return (
            f"postgresql+psycopg2://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"
        )

    @property
    def verbosity(self) -> bool:
        return True

    @property
    def is_remote(self) -> bool:
        return True

    @property
    def vault_url(self) -> str | None:
        url = os.getenv("VAULT_URL")

        if not url:
            raise ValueError("Missing environment variable for Azure Vault URL.")
        return url

    @property
    def vault_file_storage_key(self) -> str:
        key = os.getenv("VAULT_FILE_STORAGE_KEY")

        if not key:
            raise ValueError("Missing environment variable for Azure Vault File Storage Key.")
        return key

    @property
    def file_storage_auth_method(self) -> str | None:
        access_key = os.getenv("FILE_STORAGE_AUTH_METHOD")

        if not access_key:
            raise ValueError("Missing environment variable for Azure Access Key or RBAC.")

        if access_key not in ["access_key", "rbac"]:
            raise ValueError("Invalid value for FILE_STORAGE_AUTH_METHOD. Must be either 'access_key' or 'rbac'.")

        return access_key
