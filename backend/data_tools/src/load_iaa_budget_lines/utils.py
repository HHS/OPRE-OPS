# flake8: noqa F401, F403, F405
import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from models import *  # noqa: F403


@dataclass
class IAABudgetLineItemData:
    """
    Dataclass to represent a IAABudgetLineItemData data row.
    """

    SYS_IAA_ID: int
    SYS_BUDGET_ID: Optional[int] = field(default=None)
    DOC_RECEIVED: Optional[bool] = field(default=None)
    IP_NBR: Optional[str] = field(default=None)
    LINE_DESCRIPTION: Optional[str] = field(default=None)
    COMMENTS: Optional[str] = field(default=None)
    DATE_NEEDED: Optional[date] = field(default=None)
    SYS_CAN_ID: Optional[int] = field(default=None)
    AMOUNT: Optional[float] = field(default=None)
    STATUS: Optional[BudgetLineItemStatus] = field(default=None)
    OVERWRITE_PSC_FEE_RATE: Optional[float] = field(default=None)

    def __post_init__(self):
        if not self.SYS_IAA_ID:
            raise ValueError("SYS_IAA_ID is required.")

        self.SYS_IAA_ID = int(self.SYS_IAA_ID)
        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID) if self.SYS_BUDGET_ID else None
        self.DOC_RECEIVED = True if self.DOC_RECEIVED in ("true") else False
        if self.DOC_RECEIVED == "1":
            self.DOC_RECEIVED = True
        elif self.DOC_RECEIVED == "0":
            self.DOC_RECEIVED = False
        self.IP_NBR = self.IP_NBR if self.IP_NBR else None
        self.LINE_DESCRIPTION = self.LINE_DESCRIPTION if self.LINE_DESCRIPTION else None
        self.COMMENTS = str(self.COMMENTS) if self.COMMENTS else None
        self.DATE_NEEDED = datetime.strptime(self.DATE_NEEDED, "%Y-%m-%d").date() if self.DATE_NEEDED else None
        self.SYS_CAN_ID = int(self.SYS_CAN_ID) if self.SYS_CAN_ID else None
        self.AMOUNT = float(self.AMOUNT) if self.AMOUNT else None
        self.STATUS = BudgetLineItemStatus[self.STATUS] if self.STATUS else None
        self.OVERWRITE_PSC_FEE_RATE = float(self.OVERWRITE_PSC_FEE_RATE) if self.OVERWRITE_PSC_FEE_RATE else 0.0


def create_budget_line_item_data(data: dict) -> IAABudgetLineItemData:
    """
    Convert a dictionary to a IAABudgetLineItemData dataclass instance.

    :param data: The dictionary to convert.

    :return: A IAABudgetLineItemData dataclass instance.
    """
    return IAABudgetLineItemData(**data)


def validate_data(data: IAABudgetLineItemData) -> bool:
    """
    Validate the data in a IAABudgetLineItemData instance.

    :param data: The IAABudgetLineItemData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.SYS_IAA_ID is not None,
        ]
    )


def validate_all(data: List[IAABudgetLineItemData]) -> bool:
    """
    Validate a list of IAABudgetLineItemData instances.

    :param data: The list of IAABudgetLineItemData instances to validate.

    :return: A list of valid IAABudgetLineItemData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: IAABudgetLineItemData, sys_user: User, session: Session) -> None:
    """
    Create and persist the IAABudgetLineItem models.

    :param data: The IAABudgetLineItemData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    try:
        # Create IAABudgetLineItem model
        iaa = session.execute(select(IaaAgreement).where(IaaAgreement.maps_sys_id == data.SYS_IAA_ID)).scalar_one_or_none()

        if not iaa:
            raise ValueError(f"IAA with SYS_IAA_ID {data.SYS_IAA_ID} not found.")

        can = session.get(CAN, data.SYS_CAN_ID)

        bli = IAABudgetLineItem(
            id=data.SYS_BUDGET_ID,
            agreement_id=iaa.id,
            doc_received=data.DOC_RECEIVED,
            ip_nbr=data.IP_NBR,
            line_description=data.LINE_DESCRIPTION,
            comments=data.COMMENTS,
            date_needed=data.DATE_NEEDED,
            can=can,
            amount=data.AMOUNT,
            status=data.STATUS,
            proc_shop_fee_percentage=data.OVERWRITE_PSC_FEE_RATE,
            created_by=sys_user.id,
            updated_by=sys_user.id,
        )

        existing_bli = session.get(IAABudgetLineItem, data.SYS_BUDGET_ID)

        if existing_bli:
            bli.id = existing_bli.id
            bli.created_on = existing_bli.created_on
            bli.created_by = existing_bli.created_by

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.merge(bli)
            session.commit()

        logger.debug(f"IAABudgetLineItem model: {bli.to_dict()}")
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[IAABudgetLineItemData], sys_user: User, session: Session) -> None:
    """
    Convert a list of IAABudgetLineItemData instances to a list of BaseModel instances.

    :param data: The list of IAABudgetLineItemData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_budget_line_item_data(data: List[dict]) -> List[IAABudgetLineItemData]:
    """
    Convert a list of dictionaries to a list of IAABudgetLineItemData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of IAABudgetLineItemData instances.
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
    logger.info(f"Created {len(budget_line_item_data)} IAABudgetLineItemData instances.")

    if not validate_all(budget_line_item_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(budget_line_item_data, sys_user, session)
    logger.info("Finished loading models.")
