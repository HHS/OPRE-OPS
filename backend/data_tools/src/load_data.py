import os
import sys
import time

import click
from data_tools.src.azure_utils.utils import get_csv
from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_config, get_or_create_sys_user
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
@click.option(
    "--type",
    type=click.Choice(
        [
            "projects",
            "contract_budget_lines",
            "contracts",
            "grant_budget_lines",
            "grants",
            "users",
            "cans",
            "vendors",
            "iaas",
            "iaa_budget_lines",
            "iaa_agency",
            "direct_obligations",
            "direct_obligation_budget_lines",
            "budget_lines",
        ],
        case_sensitive=False,
    ),
    required=True,
    help="The type of data to load.",
)
@click.option("--input-csv", help="The path to the CSV input file.")
def main(
    env: str,
    type: str,
    input_csv: str,
):
    """
    Main entrypoint for the script.
    """
    logger.debug(f"Environment: {env}")
    logger.debug(f"Data type: {type}")
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
            match type:
                case "projects":
                    from data_tools.src.load_projects.utils import transform
                case "contract_budget_lines":
                    from data_tools.src.load_contract_budget_lines.utils import transform
                case "contracts":
                    from data_tools.src.load_contracts.utils import transform
                case "grant_budget_lines":
                    from data_tools.src.load_grant_budget_lines.utils import transform
                case "grants":
                    from data_tools.src.load_grants.utils import transform
                case "users":
                    from data_tools.src.load_users.utils import transform
                case "cans":
                    from data_tools.src.load_cans.utils import transform
                case "vendors":
                    from data_tools.src.load_vendors.utils import transform
                case "iaas":
                    from data_tools.src.load_iaas.utils import transform
                case "iaa_budget_lines":
                    from data_tools.src.load_iaa_budget_lines.utils import transform
                case "iaa_agency":
                    from data_tools.src.load_iaa_agency.utils import transform
                case "direct_obligations":
                    from data_tools.src.load_direct_obligations.utils import transform
                case "direct_obligation_budget_lines":
                    from data_tools.src.load_direct_obligation_budget_lines.utils import transform
                case "budget_lines":
                    from data_tools.src.load_budget_lines.utils import transform
                case _:
                    raise ValueError(f"Unsupported data type: {type}")
            transform(csv_f, session, sys_user)
        except RuntimeError as re:
            logger.error(f"Error transforming data: {re}")
            sys.exit(1)

    logger.info("Finished the ETL process.")


if __name__ == "__main__":
    main()
