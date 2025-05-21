import os
import sys

from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.import_static_data.import_data import get_config
from sqlalchemy.orm import scoped_session, sessionmaker

from models import *  # noqa: F403, F401

if __name__ == "__main__":
    logger.info("Starting update of Budget Lines and Service Component columns required for sorting.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")


    Session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    logger.info("Update of Budget Lines and Service Component columns complete.")
