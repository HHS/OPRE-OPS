# flake8: noqa F401, F403, F405
from csv import DictReader
from dataclasses import dataclass
from datetime import datetime
from typing import List

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import *  # noqa: F403


@dataclass
class OBEBudgetLineItemData:

    SYS_BUDGET_ID: int

    def __post_init__(self):
        if not self.SYS_BUDGET_ID:
            raise ValueError("SYS_BUDGET_ID is required.")


        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID)

def mark_budget_lines_as_obe(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Mark budget line items as OBE based on SYS_BUDGET_ID from spreadsheet.

    :param data: TSV reader containing SYS_BUDGET_ID column
    :param session: Database session
    :param sys_user: System user performing the update
    """
    try:
        for row in data:
            try:
                sys_budget_id = int(row['SYS_BUDGET_ID'])
            except (KeyError, ValueError):
                logger.error(f"Invalid or missing SYS_BUDGET_ID in row: {row}")
                continue

            # Find budget line item
            bli = session.execute(
                select(BudgetLineItem).where(BudgetLineItem.id == sys_budget_id)
            ).scalar_one_or_none()

            if not bli:
                logger.warning(f"Budget line item with ID {sys_budget_id} not found")
                continue

            # Update OBE status
            bli.is_obe = True
            bli.updated_by = sys_user.id
            bli.updated_on = datetime.now()

            logger.info(f"Marked budget line item {sys_budget_id} as OBE")

        session.commit()
        logger.info("Successfully completed OBE updates")

    except Exception as err:
        logger.error(f"Error updating OBE status: {err}")
        session.rollback()
        raise


def create_budget_line_item_data(data: dict) -> OBEBudgetLineItemData:
    """
    Convert a dictionary to a BudgetLineItemData dataclass instance.

    :param data: The dictionary to convert.

    :return: A BudgetLineItemData dataclass instance.
    """
    return OBEBudgetLineItemData(**data)

def create_all_budget_line_item_data(data: List[dict]) -> List[OBEBudgetLineItemData]:
    """Convert a list of dictionaries to a list of OBEBudgetLineItemData instances."""
    return [create_budget_line_item_data(d) for d in data]

def validate_data(data: OBEBudgetLineItemData) -> bool:
    """Validate the data in a OBEBudgetLineItemData instance."""
    return data.SYS_BUDGET_ID is not None


def validate_all(data: List[OBEBudgetLineItemData]) -> bool:
    """Validate a list of OBEBudgetLineItemData instances."""
    return sum(1 for d in data if validate_data(d)) == len(data)

def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV file and mark budget line items as OBE.

    :param data: The data from the CSV file
    :param session: The database session to use
    :param sys_user: The system user to use
    """
    if not data or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    budget_line_item_data = create_all_budget_line_item_data(list(data))
    logger.info(f"Created {len(budget_line_item_data)} BudgetLineItemData instances.")

    if not validate_all(budget_line_item_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    mark_budget_lines_as_obe(data, session, sys_user)
    logger.info("Finished marking budget line items as OBE.")
