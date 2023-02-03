from abc import ABC, abstractmethod


class DataToolsConfig(ABC):
    @property
    @abstractmethod
    def db_connection_string(self) -> str:
        ...

    @property
    @abstractmethod
    def opre_excel_connection_string(self) -> str:
        ...

    @property
    @abstractmethod
    def verbosity(self) -> bool:
        ...
