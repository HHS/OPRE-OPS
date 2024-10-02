from data_tools.environment.types import DataToolsConfig


class PytestConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        return (
            "postgresql://ops:ops@unittest_db:5432/postgres"  # pragma: allowlist secret
        )

    @property
    def verbosity(self) -> bool:
        return True
