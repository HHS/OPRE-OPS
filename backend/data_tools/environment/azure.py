"""
Configuration for running OPRE OPS in cloud.gov.
"""
from urllib.parse import quote_plus

from data_tools.environment.common import DataToolsConfig


class AzureConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:

        db_user = "psqladmin"
        db_pass = "D161t4l42"
        db_host = "postgresql-server-ops-db.postgres.database.azure.com"
        db_name = "postgres"
        return f"postgresql+psycopg2://{db_user}:{db_pass}@{db_host}/{db_name}?sslmode=require"  # noqa: B950

        #return "postgresql+psycopg2://postgres@opre-db:local_password0!@opre-db.postgres.database.azure.com/postgres?sslmode=require"  # noqa: B950

    @property
    def opre_excel_connection_string(self) -> str:
        return ""

    @property
    def verbosity(self) -> bool:
        return True
