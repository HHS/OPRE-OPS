from data_tools.environment.common import DataToolsConfig


class PytestConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        return "postgresql://postgres:local_password@unittest_db:5432/postgres"  # pragma: allowlist secret

    @property
    def opre_excel_connection_string(self) -> str:
        return "excel:///?Excel File='/Users/jdeangelis/PycharmProjects/OPRE-OPS-2/data-tools/data/REDACTED - FY22 Budget Summary -10-12-22.xlsm'"  # noqa: B950

    @property
    def verbosity(self) -> bool:
        return True
