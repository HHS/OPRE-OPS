import os
import urllib.parse

from data_tools.environment.common import DataToolsConfig

class AzureConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        db_username = os.getenv("PGUSER")
        db_password = urllib.parse.quote_plus(os.getenv("PGPASSWORD"))
        db_host = os.getenv("PGHOST")
        db_port = os.getenv("PGPORT")
        db_name = os.getenv("PGDATABASE")
        return (
            f"postgresql+psycopg2://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"
            # "postgresql://ops:ops@localhost:5432/postgres"  # pragma: allowlist secret
        )

    @property
    def opre_excel_connection_string(self) -> str:
        return ""

    @property
    def verbosity(self) -> bool:
        return True
