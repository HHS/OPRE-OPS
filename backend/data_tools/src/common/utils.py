from typing import Optional

import sqlalchemy
from data_tools.environment.azure import AzureConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.types import DataToolsConfig
from sqlalchemy import Engine, create_engine

from models import BaseModel


def init_db(
    config: DataToolsConfig, db: Optional[Engine] = None
) -> tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    if not db:
        engine = create_engine(
            config.db_connection_string, echo=config.verbosity, future=True
        )
    else:
        engine = db
    return engine, BaseModel.metadata


def get_config(environment_name: Optional[str] = None) -> DataToolsConfig:
    match environment_name:
        case "azure":
            config = AzureConfig()
        case "dev":
            config = DevConfig()
        case "local":
            config = LocalConfig()
        case "pytest":
            config = PytestConfig()
        case _:
            config = DevConfig()
    return config
