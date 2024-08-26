import logging
import os
from typing import List, Optional

import sqlalchemy.engine
from data_tools.environment.azure import AzureConfig
from data_tools.environment.cloudgov import CloudGovConfig
from data_tools.environment.common import DataToolsConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.local_migration import LocalMigrationConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.test import TestConfig
from sqlalchemy import create_engine, insert, inspect, text
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.orm import Session
from sqlalchemy.schema import MetaData

logging.basicConfig(level=logging.INFO)

from models import *  # noqa: F403, F401

data = os.getenv("DATA")


def init_db(
    config: DataToolsConfig, db: Optional[Engine] = None
) -> tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    if not db:
        engine = create_engine(
            config.db_connection_string,
            echo=config.verbosity,
            future=True,
        )
    else:
        engine = db
    return engine, BaseModel.metadata


def get_config(environment_name: Optional[str] = None) -> DataToolsConfig:
    config: DataToolsConfig
    match environment_name:
        case "azure":
            config = AzureConfig()
        case "cloudgov":
            config = CloudGovConfig()
        case "local":
            config = LocalConfig()
        case "local-migration":
            config = LocalMigrationConfig()
        case "test":
            config = TestConfig()
        case "pytest":
            config = PytestConfig()
        case _:
            config = DevConfig()
    return config

def update_expired_users(conn: sqlalchemy.engine.Engine):
    with Session(conn) as session:
        print("Deactivating users that have not logged on in 60 days. ")
        stmt = (
            "select id "
            "FROM ops_user "
            "WHERE id IN ( "
            "    select ou.id "
            "    from user_session join ops_user ou on user_session.user_id = ou.id "
            "    where ou.status = 'ACTIVE' "
            "    AND user_session.last_active_at < CURRENT_TIMESTAMP - interval '60 days'"
            ");"
        )
        results = session.execute(text(stmt))

        user_ids = [row[0] for row in results] if results else None
        print(user_ids)
        for id in user_ids:
            print(f"Updating status of user {id}")
            updated_user = User(id= id, status= 'INACTIVE')
            session.merge(updated_user)
        session.commit()

if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)

    db_engine, db_metadata_obj = init_db(script_config)

    update_expired_users(db_engine)
