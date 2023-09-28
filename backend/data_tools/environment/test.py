from data_tools.environment.common import DataToolsConfig


class TestConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        return ""

    @property
    def opre_excel_connection_string(self) -> str:
        return ""

    @property
    def verbosity(self) -> bool:
        return True
