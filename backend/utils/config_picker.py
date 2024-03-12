import os
from typing import Optional

from data_tools.environment.common import DataToolsConfig
from data_tools.environment.azure import AzureConfig
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.local_migration import LocalMigrationConfig
from data_tools.environment.test import TestConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.dev import DevConfig

def get_config(environment_name: Optional[str] = None) -> DataToolsConfig:
    if environment_name is None:
        # If no environment name is provided, get it from the ENV environment variable
        environment_name = os.getenv("ENV")

    # Select the configuration based on the environment name
    if environment_name == "azure":
        config = AzureConfig()
    elif environment_name == "cloudgov":
        config = CloudGovConfig()
    elif environment_name == "local":
        config = LocalConfig()
    elif environment_name == "local-migration":
        config = LocalMigrationConfig()
    elif environment_name == "test":
        config = TestConfig()
    elif environment_name == "pytest":
        config = PytestConfig()
    else:
        config = DevConfig()

    return config
