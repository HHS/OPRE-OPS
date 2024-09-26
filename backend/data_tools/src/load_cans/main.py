import csv
import sys
from csv import DictReader

import click
from data_tools.src.azure_utils.utils import get_csv
from data_tools.src.common.utils import get_config, init_db
from loguru import logger
from sqlalchemy import text
from sqlalchemy.dialects.mssql.pymssql import dialect


@click.command()
@click.option("--env", help="The environment to use.")
@click.option("--input_csv", help="The path to the CSV input file.")
@click.option("--output_csv", help="The path to the CSV output file.")
def main(
    env: str,
    input_csv: str,
    output_csv: str,
):
    """
    Main entrypoint for the script.
    """
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

    # write csv_f DictReader to a file
    with open(output_csv, "w") as f:
        writer = csv.writer(f, dialect="excel-tab")
        writer.writerows(csv_f)

    logger.info("Finished the ETL process.")

if __name__ == "__main__":
    main()
