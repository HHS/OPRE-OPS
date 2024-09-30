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
        return (
            f"postgresql+psycopg2://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"
        )

    @property
    def verbosity(self) -> bool:
        return True
