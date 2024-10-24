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
