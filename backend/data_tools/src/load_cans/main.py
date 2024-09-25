import os
import sys
from typing import Optional

import click
from loguru import logger

from common.utils import get_config, init_db


@click.command()
@click.option("--env", help="The environment to use.")
@click.option("--csv-file-path", help="The path to the CSV file.")
def main(
    connection_string: Optional[str],
    connection_secret_name: Optional[str],
):
    """
    Main entrypoint for the script.
    """
    if not connection_string and not connection_secret_name:
        logger.error("Either --connection-string or --secret_vault_path and --connection-secret-name must be provided.")
        sys.exit(1)

    logger.info("Starting the ETL process.")

    script_env = os.getenv("ENV")
    script_config = get_config(script_env)
    db_engine, db_metadata_obj = init_db(script_config)

    logger.info("Finished the ETL process.")
