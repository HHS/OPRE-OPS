from abc import abstractmethod
from typing import Protocol


class DataToolsConfig(Protocol):
    @property
    @abstractmethod
    def db_connection_string(self) -> str:
        """
        Returns the connection string for the SQLAlchemy engine.
        """
        ...

    @property
    @abstractmethod
    def verbosity(self) -> bool:
        """
        Returns whether the SQLAlchemy engine is verbose or not.
        """
        ...

    @property
    @abstractmethod
    def is_remote(self) -> bool:
        """
        Returns whether the environment is remote or not, e.g. Azure, AWS, etc.
        """
        ...

    @property
    @abstractmethod
    def vault_url(self) -> str | None:
        """
        Returns the path to the cloud vault url when the environment is remote else returns None.
        """
        ...

    @property
    @abstractmethod
    def vault_file_storage_key(self) -> str | None:
        """
        Returns the key to the cloud vault file storage when the environment is remote else returns None.
        """
        ...

    @property
    @abstractmethod
    def file_storage_auth_method(self) -> str | None:
        """
        Returns whether to use the access key or role-based access control when the environment is remote else returns None.
        """
        ...

    @property
    @abstractmethod
    def cleanup_user_sessions_cutoff_days(self) -> str | None:
        """
        Returns the number of days after which the user sessions should be deleted.
        """
        ...

    @property
    @abstractmethod
    def usage_metrics_storage_account_url(self) -> str | None:
        """
        Returns the Azure Blob Storage account URL that the usage metrics report is uploaded to,
        e.g. "https://<account>.blob.core.windows.net". Returns None when the environment writes
        the report to the local file system instead of Blob storage.
        """
        ...

    @property
    @abstractmethod
    def usage_metrics_container_name(self) -> str:
        """
        Returns the name of the Blob container the usage metrics report is uploaded to.
        """
        ...

    @property
    @abstractmethod
    def usage_metrics_report_prefix(self) -> str:
        """
        Returns the blob-name prefix (folder) the usage metrics report is written under,
        e.g. "reports".
        """
        ...

    @property
    @abstractmethod
    def usage_metrics_lookback_days(self) -> str:
        """
        Returns the number of days of activity the usage metrics report covers (the reporting
        window). Only ops_event rows created within this many days of the run are aggregated,
        so the report is scoped to a period rather than re-reading the entire audit log.
        """
