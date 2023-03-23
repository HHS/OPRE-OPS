from data_tools.environment.common import DataToolsConfig


class TestConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        return ""

    @property
    def opre_excel_connection_string(self) -> str:
        return "excel:///?Excel File='/Users/jdeangelis/PycharmProjects/OPRE-OPS-2/data-tools/data/REDACTED - FY22 Budget Summary -10-12-22.xlsm'"

    @property
    def verbosity(self) -> bool:
        return True
