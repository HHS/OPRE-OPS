import os
from typing import Tuple

import sqlalchemy.engine
from sqlalchemy import MetaData, create_engine

from environment.cloudgov import CloudGovConfig
from environment.common import DataToolsConfig
from environment.dev import DevConfig
from environment.local import LocalConfig
from environment.test import TestConfig


def init_db(
    config: DataToolsConfig,
) -> Tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    engine = create_engine(config.db_connection_string, echo=config.verbosity, future=True)
    metadata_obj = MetaData()
    metadata_obj.reflect(bind=engine)

    return engine, metadata_obj


def get_config(environment_name: str) -> DataToolsConfig:
    config: DataToolsConfig
    match environment_name:
        case "cloudgov":
            config = CloudGovConfig()
        case "local":
            config = LocalConfig()
        case "test":
            config = TestConfig()
        case _:
            config = DevConfig()
    return config


if __name__ == "__main__":
    script_env = os.getenv("ENV")
    if script_env is None:
        raise ValueError
    script_config = get_config(script_env)

    db_engine, db_metadata_obj = init_db(script_config)
