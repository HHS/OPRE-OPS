from abc import abstractmethod
from typing import Protocol


class DataToolsConfig(Protocol):
    @property
    @abstractmethod
    def db_connection_string(self) -> str:
        ...


    @property
    @abstractmethod
    def verbosity(self) -> bool:
        ...
