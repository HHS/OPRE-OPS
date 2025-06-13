import os
from csv import DictReader
from dataclasses import dataclass
from typing import List

from data_tools.src.common.utils import get_bli_class_from_type, get_cig_type_mapping
from loguru import logger
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from models import (
    AgreementType,
    BudgetLineItem,
    ContractBudgetLineItem,
    DirectObligationBudgetLineItem,
    GrantBudgetLineItem,
    IAABudgetLineItem,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    User,
)


@dataclass
class BudgetLineItemData:
    """
    Dataclass to represent a BudgetLineItemData data row for type updates.
    """

    SYS_BUDGET_ID: int
    CIG_TYPE: str

    def __post_init__(self):
        if not self.SYS_BUDGET_ID or not self.CIG_TYPE:
            raise ValueError("SYS_BUDGET_ID and CIG_TYPE must be provided")

        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID)
        self.CIG_TYPE = get_cig_type_mapping().get(self.CIG_TYPE.lower())

        if not self.CIG_TYPE:
            raise ValueError(f"Invalid CIG_TYPE: {self.CIG_TYPE}")


def create_budget_line_item_data(data: dict) -> BudgetLineItemData:
    """
    Convert a dictionary to a BudgetLineItemData dataclass instance.

    :param data: The dictionary to convert.

    :return: A BudgetLineItemData dataclass instance.
    """
    return BudgetLineItemData(**data)


def create_all_budget_line_item_data(data: List[dict]) -> List[BudgetLineItemData]:
    """
    Convert a list of dictionaries to a list of BudgetLineItemData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of BudgetLineItemData instances.
    """
    return [create_budget_line_item_data(d) for d in data]


def validate_data(data: BudgetLineItemData) -> bool:
    """
    Validate the data in a BudgetLineItemData instance.

    :param data: The BudgetLineItemData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all([data.SYS_BUDGET_ID is not None, data.CIG_TYPE is not None])


def validate_all(data: List[BudgetLineItemData]) -> bool:
    """
    Validate a list of BudgetLineItemData instances.

    :param data: The list of BudgetLineItemData instances to validate.

    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: BudgetLineItemData, sys_user: User, session: Session) -> None:
    """
    Update the BudgetLineItem type based on the CIG_TYPE.

    :param data: The BudgetLineItemData instance.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Updating budget line item type for {data}")

    # Find the budget_line_item
    budget_line_item = session.get(BudgetLineItem, data.SYS_BUDGET_ID)

    if not budget_line_item:
        logger.warning(f"No budget line item found for {data}")
        return

    # Store the original values for the event details
    original_values = {
        "id": budget_line_item.id,
        "budget_line_item_type": (
            budget_line_item.budget_line_item_type.name if budget_line_item.budget_line_item_type else None
        ),
    }

    # Check if the budget line item already has the correct type
    if budget_line_item.budget_line_item_type == data.CIG_TYPE:
        logger.info(f"BudgetLineItem {data.SYS_BUDGET_ID} already has the correct type: {data.CIG_TYPE}")
        return

    if budget_line_item.agreement and budget_line_item.agreement.agreement_type != data.CIG_TYPE:
        raise ValueError(
            f"BudgetLineItem with SYS_BUDGET_ID {data.SYS_BUDGET_ID} has an agreement type of "
            f"{budget_line_item.agreement.agreement_type}, but the new type is {data.CIG_TYPE}."
        )

    # Create a new budget line item with the correct type
    attrs = {c.key: getattr(budget_line_item, c.key) for c in inspect(BudgetLineItem).mapper.column_attrs}
    attrs["budget_line_item_type"] = data.CIG_TYPE
    logger.info(f"new BL is of type {data.CIG_TYPE} and of id {attrs["id"]}")

    # Delete the old budget line item using the appropriate subclass and add the new one
    budget_line_item_class = get_bli_class_from_type(budget_line_item.budget_line_item_type)
    budget_line_item_to_delete = session.get(budget_line_item_class, data.SYS_BUDGET_ID)
    logger.info(f"BL to delete is of type {budget_line_item_to_delete.budget_line_item_type} and ID {budget_line_item_to_delete.id}")
    session.delete(budget_line_item_to_delete)

    if os.getenv("DRY_RUN"):
        logger.info("Dry run enabled. Rolling back transaction.")
        session.rollback()
    else:
        session.commit()

        session.flush()

        # new_class = get_bli_class_from_type(data.CIG_TYPE)
        new_budget_line_item = get_bli_class_from_type(data.CIG_TYPE)(**attrs)
        session.add(new_budget_line_item)

        # Create an OPS event for the update
        ops_event = OpsEvent(
            event_type=OpsEventType.UPDATE_BLI,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={
                "budget_line_item_id": new_budget_line_item.id,
                "original_type": original_values["budget_line_item_type"],
                "new_type": data.CIG_TYPE.name,
                "message": f"Updated budget line item type from {original_values['budget_line_item_type']} to {data.CIG_TYPE.name}",
            },
        )

        session.add(ops_event)
        session.commit()
        logger.info(f"Successfully updated BudgetLineItem {data.SYS_BUDGET_ID} type to {data.CIG_TYPE.name}")


def create_all_models(data: List[BudgetLineItemData], sys_user: User, session: Session) -> None:
    """
    Update multiple budget line items types.

    :param data: The list of BudgetLineItemData instances.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV/TSV file and update the budget line item types.

    :param data: The data from the CSV/TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.

    :return: None
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

    create_all_models(budget_line_item_data, sys_user, session)
    logger.info("Finished updating budget line item types.")
