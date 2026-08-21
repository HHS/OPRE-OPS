from data_tools.environment.types import DataToolsConfig


class PytestConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        return "postgresql://ops:ops@unittest_db:5432/postgres"  # pragma: allowlist secret

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

    @property
    def cleanup_user_sessions_cutoff_days(self) -> str | None:
        return "90"

    @property
    def usage_metrics_storage_account_url(self) -> str | None:
        return None

    @property
    def usage_metrics_container_name(self) -> str:
        return "data"

    @property
    def usage_metrics_report_prefix(self) -> str:
        return "reports"

    @property
    def usage_metrics_lookback_days(self) -> str:
        return "7"

    @property
    def usage_metrics_sas_expiry_days(self) -> str:
        return "90"

    @property
    def usage_metrics_acs_endpoint(self) -> str | None:
        return None

    @property
    def usage_metrics_email_sender(self) -> str | None:
        return None

    @property
    def usage_metrics_email_recipients(self) -> str | None:
        return None
