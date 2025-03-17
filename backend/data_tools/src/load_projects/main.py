import os
import sys
import time

import click
from data_tools.src.azure_utils.utils import get_csv
from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_config, get_or_create_sys_user
from data_tools.src.load_projects.utils import transform
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy import text
from sqlalchemy.orm import scoped_session, sessionmaker

load_dotenv(os.getenv("ENV_FILE", ".env"))

# Set the timezone to UTC
os.environ["TZ"] = "UTC"
time.tzset()

# logger configuration
format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
# Configure logger with global level set to INFO by default
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()  # Remove default handlers
logger.configure(handlers=[{"sink": sys.stdout, "format": format, "level": LOG_LEVEL}])
logger.add(sys.stderr, format=format, level=LOG_LEVEL)


@click.command()
@click.option("--env", help="The environment to use.")
@click.option("--input-csv", help="The path to the CSV input file.")
def main(
    env: str,
    input_csv: str,
):
    """
    Main entrypoint for the script.
    """
    logger.debug(f"Environment: {env}")
    logger.debug(f"Input CSV: {input_csv}")

    logger.info("Starting the ETL process.")

    script_config = get_config(env)
    db_engine, db_metadata_obj = init_db_from_config(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    csv_f = get_csv(input_csv, script_config)

    logger.info(f"Loaded CSV file from {input_csv}.")

    Session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    with Session() as session:
        sys_user = get_or_create_sys_user(session)
        logger.info(f"Retrieved system user {sys_user}")

        setup_triggers(session, sys_user)

        try:
            transform(csv_f, session, sys_user)
        except RuntimeError as re:
            logger.error(f"Error transforming data: {re}")
            sys.exit(1)

    logger.info("Finished the ETL process.")


if __name__ == "__main__":
    main()
