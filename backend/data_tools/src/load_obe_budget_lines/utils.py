# flake8: noqa F401, F403, F405
from csv import DictReader
from dataclasses import dataclass
from datetime import datetime
from typing import List

from loguru import logger
from sqlalchemy.orm import Session

from models import *  # noqa: F403


@dataclass
class OBEBudgetLineItemData:

    SYS_BUDGET_ID: int

    def __post_init__(self):
        if not self.SYS_BUDGET_ID:
            raise ValueError("SYS_BUDGET_ID is required.")


        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID)

def mark_budget_lines_as_obe(data: List[OBEBudgetLineItemData], session: Session, sys_user: User) -> None:
    """
    Mark budget line items as OBE based on SYS_BUDGET_ID from spreadsheet.

    :param data: The OBEBudgetLineItemData instance.
    :param session: The database session to use.
    :param sys_user: System user performing the update

    :return: None
    """

    for d in data:
        logger.info(f"Marking budget line item as OBE for {d.SYS_BUDGET_ID}")

        # Find budget line item
        budget_line_item = session.get(BudgetLineItem, d.SYS_BUDGET_ID)

        if not budget_line_item:
            logger.warning(f"Budget line item with ID {d.SYS_BUDGET_ID} not found")
            return

        # Update OBE status
        budget_line_item.status = None
        budget_line_item.is_obe = True
        budget_line_item.updated_by = sys_user.id
        budget_line_item.updated_on = datetime.now()

        logger.info(f"Marked budget line item {d.SYS_BUDGET_ID} as OBE")

        session.commit()
        logger.info("Successfully completed OBE updates")


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

    mark_budget_lines_as_obe(budget_line_item_data, session, sys_user)
    logger.info("Finished marking budget line items as OBE.")
