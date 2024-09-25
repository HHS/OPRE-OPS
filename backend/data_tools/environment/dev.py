from data_tools.environment.types import DataToolsConfig


class DevConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        return (
            "postgresql://ops:ops@localhost:5432/postgres"  # pragma: allowlist secret
        )

    @property
    def verbosity(self) -> bool:
        return True
