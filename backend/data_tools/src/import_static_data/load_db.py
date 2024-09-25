import os

import sqlalchemy.engine
from sqlalchemy.orm import configure_mappers

from common.utils import get_config, init_db
from models import BaseModel

configure_mappers()


def delete_and_create(engine: sqlalchemy.engine.Engine) -> None:
    BaseModel.metadata.drop_all(engine)
    BaseModel.metadata.create_all(engine)


if __name__ == "__main__":
    script_env = os.getenv("ENV")
    script_config = get_config(script_env)

    db_engine, db_metadata_obj = init_db(script_config)

    delete_and_create(db_engine)

    print("Data removed from DB.")
