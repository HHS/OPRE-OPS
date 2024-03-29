"""
Configuration for running OPRE OPS in cloud.gov.
"""
import json
import os

from data_tools.environment.common import DataToolsConfig


class CloudGovConfig(DataToolsConfig):
    @property
    def db_connection_string(self) -> str:
        # Cloud.gov exposes variables for the application and bound services via
        # VCAP_APPLICATION and VCAP_SERVICES environment variables, respectively.
        vcap_services = json.loads(os.getenv("VCAP_SERVICES", "{}"))

        # Note: if or when we have more than one db per application instance,
        # we will need to do something smarter than taking the first db in the list
        database_service = vcap_services["aws-rds"][0]
        database_creds = database_service["credentials"]

        return f'postgresql+psycopg2://{database_creds["username"]}:{database_creds["password"]}@{database_creds["host"]}:{database_creds["port"]}/{database_creds["db_name"]}'  # noqa: B950

    @property
    def opre_excel_connection_string(self) -> str:
        return ""

    @property
    def verbosity(self) -> bool:
        return True
