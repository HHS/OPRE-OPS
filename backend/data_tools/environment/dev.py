from data_tools.environment.common import DataToolsConfig


class DevConfig(DataToolsConfig):
    @property
    def db_connection_string(self):
        return "postgresql://postgres:local_password@localhost:5432/postgres"  # pragma: allowlist secret

    @property
    def opre_excel_connection_string(self):
        return ""

    @property
    def verbosity(self):
        return True
