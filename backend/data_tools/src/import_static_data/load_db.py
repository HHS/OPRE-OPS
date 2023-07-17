import os
from typing import Tuple

import sqlalchemy.engine
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.common import DataToolsConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.test import TestConfig
from models import *
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import configure_mappers

configure_mappers()


def init_db(
    config: DataToolsConfig, db: Optional[Engine] = None
) -> Tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    if not db:
        engine = create_engine(
            config.db_connection_string, echo=config.verbosity, future=True
        )
    else:
        engine = db
    return engine, BaseModel.metadata


def get_config(environment_name: Optional[str] = None) -> DataToolsConfig:
    config: DataToolsConfig
    match environment_name:
        case "cloudgov":
            config = CloudGovConfig()
        case "local":
            config = LocalConfig()
        case "test":
            config = TestConfig()
        case "pytest":
            config = PytestConfig()
        case _:
            config = DevConfig()
    return config


def delete_and_create(engine: sqlalchemy.engine.Engine) -> None:
    BaseModel.metadata.drop_all(engine)
    BaseModel.metadata.create_all(engine)


if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)

    db_engine, db_metadata_obj = init_db(script_config)

    delete_and_create(db_engine)

    print("Data removed from DB.")
