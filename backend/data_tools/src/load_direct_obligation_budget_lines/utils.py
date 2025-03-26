# flake8: noqa F401, F403, F405
import os
import re
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import *


@dataclass
class BudgetLineItemData:
    """
    Dataclass to represent a BudgetLineItem data row.
    """

    SYS_DIRECT_OBLIGATION_ID: int
    SYS_BUDGET_ID: Optional[int] = field(default=None)
    PROJECT_OFFICER: Optional[str] = field(default=None)
    PROJECT_OFFICER_USER_ID: Optional[int] = field(default=None)
    RECEIVING_AGENCY: Optional[str] = field(default=None)
    OBJECT_CLASS_CODE: Optional[int] = field(default=None)
    REQUISITION_NBR: Optional[str] = field(default=None)
    IP_NBR: Optional[str] = field(default=None)
    LINE_DESCRIPTION: Optional[str] = field(default=None)
    COMMENTS: Optional[str] = field(default=None)
    DATE_NEEDED: Optional[date] = field(default=None)
    SYS_CAN_ID: Optional[int] = field(default=None)
    AMOUNT: Optional[float] = field(default=None)
    STATUS: Optional[BudgetLineItemStatus] = field(default=None)
    OVERWRITE_PSC_FEE_RATE: Optional[float] = field(default=None)

    def __post_init__(self):
        if not self.SYS_DIRECT_OBLIGATION_ID:
            raise ValueError("SYS_DIRECT_OBLIGATION_ID is required.")

        self.SYS_DIRECT_OBLIGATION_ID = int(self.SYS_DIRECT_OBLIGATION_ID)
        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID) if self.SYS_BUDGET_ID else None
        self.PROJECT_OFFICER_USER_ID = int(self.PROJECT_OFFICER_USER_ID) if self.PROJECT_OFFICER_USER_ID else None
        self.RECEIVING_AGENCY = str(self.RECEIVING_AGENCY) if self.RECEIVING_AGENCY else None
        self.OBJECT_CLASS_CODE = int(self.OBJECT_CLASS_CODE) if self.OBJECT_CLASS_CODE else None
        self.REQUISITION_NBR = str(self.REQUISITION_NBR) if self.REQUISITION_NBR else None
        self.IP_NBR = str(self.IP_NBR) if self.IP_NBR else None
        self.LINE_DESCRIPTION = str(self.LINE_DESCRIPTION) if self.LINE_DESCRIPTION else None
        self.COMMENTS = str(self.COMMENTS) if self.COMMENTS else None
        self.DATE_NEEDED = datetime.strptime(self.DATE_NEEDED, "%Y-%m-%d").date() if self.DATE_NEEDED else None
        self.SYS_CAN_ID = int(self.SYS_CAN_ID) if self.SYS_CAN_ID else None
        self.AMOUNT = float(self.AMOUNT) if self.AMOUNT else None
        self.STATUS = BudgetLineItemStatus[self.STATUS] if self.STATUS else None
        self.OVERWRITE_PSC_FEE_RATE = float(self.OVERWRITE_PSC_FEE_RATE) if self.OVERWRITE_PSC_FEE_RATE else None


def create_budget_line_item_data(data: dict) -> BudgetLineItemData:
    """
    Convert a dictionary to a BudgetLineItemData dataclass instance.

    :param data: The dictionary to convert.

    :return: A BudgetLineItemData dataclass instance.
    """
    return BudgetLineItemData(**data)


def validate_data(data: BudgetLineItemData) -> bool:
    """
    Validate the data in a BudgetLineItemData instance.

    :param data: The BudgetLineItemData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.SYS_DIRECT_OBLIGATION_ID is not None,
        ]
    )


def validate_all(data: List[BudgetLineItemData]) -> bool:
    """
    Validate a list of BudgetLineItemData instances.

    :param data: The list of BudgetLineItemData instances to validate.

    :return: A list of valid BudgetLineItemData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: BudgetLineItemData, sys_user: User, session: Session) -> None:
    """
    Create and persist the DirectObligationBudgetLineItem models.

    :param data: The BudgetLineItemData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Creating models for {data}")

    try:
        # Find the associated Agreement
        agreement = session.execute(
            select(Agreement).where(Agreement.maps_sys_id == data.SYS_DIRECT_OBLIGATION_ID)
        ).scalar_one_or_none()

        if not agreement:
            logger.warning(f"Agreement with SYS_DIRECT_OBLIGATION_ID {data.SYS_DIRECT_OBLIGATION_ID} not found.")

        # Get CAN if it exists
        can = session.get(CAN, data.SYS_CAN_ID) if data.SYS_CAN_ID else None

        requisition = get_requisition(data, session)

        # Get object class code if it exists
        object_class_code = (
            session.execute(
                select(ObjectClassCode).where(ObjectClassCode.code == data.OBJECT_CLASS_CODE)
            ).scalar_one_or_none()
            if data.OBJECT_CLASS_CODE
            else None
        )

        # Create the DirectObligationBudgetLineItem
        bli = DirectObligationBudgetLineItem(
            id=data.SYS_BUDGET_ID,
            line_description=data.LINE_DESCRIPTION,
            comments=data.COMMENTS,
            agreement_id=agreement.id if agreement else None,
            can_id=can.id if can else None,
            requisition=requisition,
            amount=data.AMOUNT,
            status=data.STATUS,
            date_needed=data.DATE_NEEDED,
            receiving_agency=data.RECEIVING_AGENCY,
            ip_nbr=data.IP_NBR,
            object_class_code_id=object_class_code.id if object_class_code else None,
            proc_shop_fee_percentage=data.OVERWRITE_PSC_FEE_RATE,
            created_by=sys_user.id,
            updated_by=sys_user.id,
        )

        existing_bli = session.get(BudgetLineItem, data.SYS_BUDGET_ID) if data.SYS_BUDGET_ID else None

        if existing_bli:
            bli.id = existing_bli.id
            bli.created_on = existing_bli.created_on
            bli.created_by = existing_bli.created_by

        logger.debug(f"Created DirectObligationBudgetLineItem model for {bli.to_dict()}")

        session.merge(bli)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}: {e}")
        session.rollback()
        raise e


def create_all_models(data: List[BudgetLineItemData], sys_user: User, session: Session) -> None:
    """
    Convert a list of BudgetLineItemData instances to a list of BaseModel instances.

    :param data: The list of BudgetLineItemData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_budget_line_item_data(data: List[dict]) -> List[BudgetLineItemData]:
    """
    Convert a list of dictionaries to a list of BudgetLineItemData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of BudgetLineItemData instances.
    """
    return [create_budget_line_item_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV file and persist the models to the database.

    :param data: The data from the CSV file.
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
    logger.info("Finished loading models.")


def get_requisition(data: BudgetLineItemData, session: Session) -> Requisition | None:
    if not data.REQUISITION_NBR:
        return None

    requisition = session.execute(
        select(Requisition).where(Requisition.budget_line_item_id == data.SYS_BUDGET_ID)
    ).scalar_one_or_none()

    if not requisition:
        requisition = Requisition(
            budget_line_item_id=data.SYS_BUDGET_ID,
            number=data.REQUISITION_NBR,
        )

    return requisition
