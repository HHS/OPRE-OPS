import os
from typing import Optional, Tuple

import sqlalchemy.engine
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.common import DataToolsConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.test import TestConfig
from models.base import BaseModel
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


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


def get_config(environment_name: str = None):
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


def delete_existing_data(engine: sqlalchemy.engine.Engine):
    BaseModel.metadata.drop_all(engine)


if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)

    print(f"Data-Tools Config: {script_config.db_connection_string}")

    db_engine, db_metadata_obj = init_db(script_config)

    delete_existing_data(db_engine)

    print(f"Data removed from DB.")
