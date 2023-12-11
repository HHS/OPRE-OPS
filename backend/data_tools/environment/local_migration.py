from data_tools.environment.common import DataToolsConfig


class LocalMigrationConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        return "postgresql://ops:ops@ops-db:5432/postgres"  # pragma: allowlist secret

    @property
    def opre_excel_connection_string(self) -> str:
        return ""

    @property
    def verbosity(self) -> bool:
        return False
