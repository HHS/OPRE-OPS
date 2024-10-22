import os
import sys
import time

import click
from data_tools.src.azure_utils.utils import get_csv
from data_tools.src.common.utils import get_config, get_or_create_sys_user, init_db
from data_tools.src.load_cans.utils import (
    create_all_can_data,
    create_all_models,
    create_can_data,
    create_models,
    persist_models,
    validate_all,
)
from loguru import logger
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from models import Portfolio, User

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
logger.add(sys.stdout, format=format, level="DEBUG")
logger.add(sys.stderr, format=format, level="DEBUG")


@click.command()
@click.option("--env", help="The environment to use.")
@click.option("--input-csv", help="The path to the CSV input file.")
@click.option("--output-csv", help="The path to the CSV output file.")
def main(
    env: str,
    input_csv: str,
    output_csv: str,
):
    """
    Main entrypoint for the script.
    """
    logger.debug(f"Environment: {env}")
    logger.debug(f"Input CSV: {input_csv}")
    logger.debug(f"Output CSV: {output_csv}")

    logger.info("Starting the ETL process.")

    script_config = get_config(env)
    db_engine, db_metadata_obj = init_db(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    csv_f = get_csv(input_csv, script_config)

    logger.info(f"Loaded CSV file from {input_csv}.")

    sys_user = get_or_create_sys_user(db_engine)
    logger.info(f"Retrieved system user {sys_user}")

    with Session(db_engine) as session:
        portfolios = list(session.execute(select(Portfolio)).scalars().all())

        logger.info(f"Retrieved {len(portfolios)} portfolios.")

        can_data = create_all_can_data(list(csv_f))

        logger.info(f"Created {len(can_data)} CAN data instances.")

        if not validate_all(can_data):
            logger.error("Validation failed. Exiting.")
            sys.exit(1)

        logger.info("Data validation passed.")

        models = create_all_models(can_data, sys_user, portfolios)

        logger.info(f"Created {len(models)} models.")

        persist_models(models, session)

    logger.info("Finished the ETL process.")

if __name__ == "__main__":
    main()
