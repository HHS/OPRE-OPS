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

    @property
    @abstractmethod
    def acs_connection_string(self) -> str | None:
        """
        Returns the Azure Communication Services connection string used to send
        notification emails (currently consumed by disable_users). Returns None
        when email isn't configured (local/dev/pytest).
        """
        ...

    @property
    @abstractmethod
    def email_sender_address(self) -> str | None:
        """
        Returns the verified ACS sender ("From") address for notification emails,
        e.g. "DoNotReply@<verified-domain>" (currently consumed by disable_users).
        Returns None when email isn't configured.
        """
        ...
