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

    @property
    def is_remote(self) -> bool:
        return False

    @property
    def file_system_path(self) -> str:
        return "."

    @property
    def vault_url(self) -> str | None:
        return None

    @property
    def vault_file_storage_key(self) -> str | None:
        return None

    @property
    def file_storage_auth_method(self) -> str | None:
        return None
