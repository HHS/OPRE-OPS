import os
import sys
import time

import click
from data_tools.src.common.db import init_db_from_config, setup_triggers
from data_tools.src.common.utils import get_config, get_or_create_sys_user
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy.orm import scoped_session, sessionmaker

from models import *  # noqa: F403, F401

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
def main(
        env: str
):
    """
    Main function to update budget lines and service component columns required for sorting.
    """
    logger.info("Starting update of Budget Lines and Service Component columns required for sorting.")

    script_config = get_config(env)
    db_engine, _ = init_db_from_config(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to the database.")

    Session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    with Session() as session:
        sys_user = get_or_create_sys_user(session)
        logger.info(f"Retrieved system user: {sys_user}")
        setup_triggers(session, sys_user)
        update_budget_lines(session)


    logger.info("Update of Budget Lines and Service Component columns complete.")

def update_budget_lines(session):
    """
    Update budget lines and service component columns required for sorting.
    """
    # Add your logic here to update the budget lines and service component columns
    # iterate thru all service components here:
    #wrap this in a try except and rollback session if there is an error
    try:
        service_components = session.query(ServicesComponent).all()
        for component in service_components:
            if component.contract_agreement_id:
                requirement_type = session.scalar(select(ContractAgreement.service_requirement_type).where(ContractAgreement.id == component.contract_agreement_id))
                display_name = ServicesComponent.get_display_name(component.number, component.optional, requirement_type == ServiceRequirementType.SEVERABLE)
                logger.info(f"Updating service component {component.id} with display name for sort {display_name}")
                component.display_name_for_sort = display_name
                session.add(component)
        session.commit()
    except Exception as e:
        logger.error(f"Error updating service components: {e}")
        session.rollback()
        raise

    try:
        # iterate thru all budget lines here:
        budget_lines = session.query(BudgetLineItem).all()
        for budget_line in [bli for bli in budget_lines if bli.budget_line_item_type == AgreementType.CONTRACT]:
            if budget_line.services_component_id:
                component = session.get(ServicesComponent, budget_line.services_component_id)
                if component:
                    logger.info(f"Updating budget line {budget_line.id} with service component name for sort {component.display_name_for_sort}")
                    budget_line.service_component_name_for_sort = component.display_name_for_sort
                    session.add(budget_line)
        session.commit()
    except Exception as e:
        logger.error(f"Error updating budget lines: {e}")
        session.rollback()
        raise

if __name__ == "__main__":
    main()
