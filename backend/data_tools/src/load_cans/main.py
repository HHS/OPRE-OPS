import sys

import click
from data_tools.src.azure_utils.utils import get_csv
from data_tools.src.common.utils import get_config, init_db
from loguru import logger
from sqlalchemy import text


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
    logger.add(sys.stdout, format="{time} {level} {message}", level="DEBUG")
    logger.add(sys.stderr, format="{time} {level} {message}", level="DEBUG")
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

    for row in csv_f:
        logger.debug(f"row={row}")

    logger.info("Finished the ETL process.")

if __name__ == "__main__":
    main()
