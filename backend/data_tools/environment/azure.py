import os
import re

from data_tools.environment.types import DataToolsConfig

# A single AzureConfig serves every deployed environment (dev, stg, prod), so the environment is
# identified from CONTAINER_APP_JOB_NAME, which Azure Container Apps injects into every job
# execution and which follows the "opre-ops-<env>-app-<job>" naming convention. Environments
# not listed here (e.g. dev) yield None.
_JOB_NAME_PATTERN = re.compile(r"^opre-ops-(?P<env>[a-z]+)-app-")
_ENVIRONMENTS = {
    "stg": ("Staging", "https://stg.ops.opre.acf.gov/"),
    "prod": ("Production", "https://ops.opre.acf.gov/"),
}


def _deployed_environment() -> tuple[str, str] | tuple[None, None]:
    match = _JOB_NAME_PATTERN.match(os.getenv("CONTAINER_APP_JOB_NAME", ""))
    if not match:
        return None, None
    return _ENVIRONMENTS.get(match["env"], (None, None))


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

        return f"postgresql+psycopg2://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}"

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
            raise ValueError("Missing environment variable for FILE_STORAGE_AUTH_METHOD.")

        if access_key not in ["access_key", "rbac", "mi"]:
            raise ValueError(
                "Invalid value for FILE_STORAGE_AUTH_METHOD. Must be either 'access_key' or 'rbac' or 'mi'."
            )

        return access_key

    @property
    def cleanup_user_sessions_cutoff_days(self) -> str | None:
        cutoff_days = os.getenv("CLEANUP_USER_SESSIONS_CUTOFF_DAYS")

        if not cutoff_days:
            raise ValueError("Missing environment variable for Cleanup User Sessions Cutoff_Days.")

        return cutoff_days

    @property
    def acs_connection_string(self) -> str | None:
        # Deliberately does NOT raise when unset, unlike most AzureConfig properties. Both outbound
        # email paths gate on this being present and no-op (with a log line) when it is absent, so a
        # job in a deployed environment that has not had ACS wired yet still completes its primary
        # work. Raising here would abort the usage metrics run *after* the report was already
        # uploaded to Blob storage, and would abort disable_users before it disabled anyone.
        # Callers that need ACS to be mandatory should assert it themselves.
        return os.getenv("ACS_CONNECTION_STRING") or None

    @property
    def email_sender_address(self) -> str | None:
        # See acs_connection_string above for why this returns None rather than raising.
        return os.getenv("EMAIL_SENDER_ADDRESS") or None

    @property
    def environment_label(self) -> str | None:
        return _deployed_environment()[0]

    @property
    def frontend_url(self) -> str | None:
        return _deployed_environment()[1]

    @property
    def file_storage_account_key(self) -> str | None:
        # Injected as a Container App secret (not read from Key Vault) so the job needs no vault
        # access at run time. Returns None when SAS signing is not configured, which makes the
        # report email no-op rather than fail.
        return os.getenv("FILE_STORAGE_ACCOUNT_KEY") or None

    @property
    def usage_metrics_storage_account_url(self) -> str | None:
        url = os.getenv("USAGE_METRICS_STORAGE_ACCOUNT_URL")

        if not url:
            raise ValueError("Missing environment variable for USAGE_METRICS_STORAGE_ACCOUNT_URL.")

        return url

    @property
    def usage_metrics_container_name(self) -> str:
        return os.getenv("USAGE_METRICS_CONTAINER_NAME", "data")

    @property
    def usage_metrics_report_prefix(self) -> str:
        return os.getenv("USAGE_METRICS_REPORT_PREFIX", "reports")

    @property
    def usage_metrics_lookback_days(self) -> str:
        return os.getenv("USAGE_METRICS_LOOKBACK_DAYS", "14")

    @property
    def usage_metrics_sprint_anchor_date(self) -> str:
        return os.getenv("USAGE_METRICS_SPRINT_ANCHOR_DATE", "2026-09-11")

    @property
    def usage_metrics_force_run(self) -> bool:
        return os.getenv("USAGE_METRICS_FORCE_RUN", "").strip().lower() in ("1", "true", "yes")

    @property
    def usage_metrics_sas_expiry_days(self) -> str:
        return os.getenv("USAGE_METRICS_SAS_EXPIRY_DAYS", "90")

    @property
    def usage_metrics_email_recipients(self) -> str | None:
        return os.getenv("USAGE_METRICS_EMAIL_RECIPIENTS") or None
