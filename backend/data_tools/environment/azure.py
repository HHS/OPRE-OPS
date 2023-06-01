"""
Configuration for running OPRE OPS in cloud.gov.
"""
import json
import os

from data_tools.environment.common import DataToolsConfig


class CloudGovConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        return "postgresql+psycopg2://postgres@opre-db:local_password0!@opre-db.postgres.database.azure.com/postgres?sslmode=require"  # noqa: B950

    @property
    def opre_excel_connection_string(self) -> str:
        return ""

    @property
    def verbosity(self) -> bool:
        return True
