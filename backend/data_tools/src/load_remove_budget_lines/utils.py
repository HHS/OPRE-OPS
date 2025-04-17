from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from models import BudgetLineItem, OpsEvent, OpsEventStatus, OpsEventType, User


@dataclass
class BudgetLineItemData:
    """
    Dataclass to represent a BudgetLineItemData data row.
    """

    SYS_BUDGET_ID: int
    EFFECTIVE_DATE: Optional[str] = field(default=None)
    REQUESTED_BY: Optional[str] = field(default=None)
    HOW_REQUESTED: Optional[str] = field(default=None)
    CHANGE_REASONS: Optional[str] = field(default=None)
    WHO_UPDATED: Optional[str] = field(default=None)
    FISCAL_YEAR: Optional[str] = field(default=None)
    CAN: Optional[str] = field(default=None)
    PROJECT_TITLE: Optional[str] = field(default=None)
    CIG_NAME: Optional[str] = field(default=None)
    CIG_TYPE: Optional[str] = field(default=None)
    LINE_DESC: Optional[str] = field(default=None)
    DATE_NEEDED: Optional[str] = field(default=None)
    AMOUNT: Optional[str] = field(default=None)
    PROC_FEE_AMOUNT: Optional[str] = field(default=None)
    STATUS: Optional[str] = field(default=None)
    COMMENTS: Optional[str] = field(default=None)
    NEW_VS_CONTINUING: Optional[str] = field(default=None)
    APPLIED_RESEARCH_VS_EVALUATIVE: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.SYS_BUDGET_ID:
            raise ValueError("SYS_BUDGET_ID is required.")

        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID) if self.SYS_BUDGET_ID else None
        self.EFFECTIVE_DATE = str(self.EFFECTIVE_DATE) if self.EFFECTIVE_DATE else None
        self.REQUESTED_BY = str(self.REQUESTED_BY) if self.REQUESTED_BY else None
        self.HOW_REQUESTED = str(self.HOW_REQUESTED) if self.HOW_REQUESTED else None
        self.CHANGE_REASONS = str(self.CHANGE_REASONS) if self.CHANGE_REASONS else None
        self.WHO_UPDATED = str(self.WHO_UPDATED) if self.WHO_UPDATED else None
        self.FISCAL_YEAR = str(self.FISCAL_YEAR) if self.FISCAL_YEAR else None
        self.CAN = str(self.CAN) if self.CAN else None
        self.PROJECT_TITLE = str(self.PROJECT_TITLE) if self.PROJECT_TITLE else None
        self.CIG_NAME = str(self.CIG_NAME) if self.CIG_NAME else None
        self.CIG_TYPE = str(self.CIG_TYPE) if self.CIG_TYPE else None
        self.LINE_DESC = str(self.LINE_DESC) if self.LINE_DESC else None
        self.DATE_NEEDED = str(self.DATE_NEEDED) if self.DATE_NEEDED else None
        self.AMOUNT = str(self.AMOUNT) if self.AMOUNT else None
        self.PROC_FEE_AMOUNT = str(self.PROC_FEE_AMOUNT) if self.PROC_FEE_AMOUNT else None
        self.STATUS = str(self.STATUS) if self.STATUS else None
        self.COMMENTS = str(self.COMMENTS) if self.COMMENTS else None
        self.NEW_VS_CONTINUING = str(self.NEW_VS_CONTINUING) if self.NEW_VS_CONTINUING else None
        self.APPLIED_RESEARCH_VS_EVALUATIVE = (
            str(self.APPLIED_RESEARCH_VS_EVALUATIVE) if self.APPLIED_RESEARCH_VS_EVALUATIVE else None
        )


def create_models(data: BudgetLineItemData, sys_user: User, session: Session) -> None:
    """
    Delete the BudgetLineItem models.

    :param data: The BudgetLineItemData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Creating models for {data}.")

    # Find the budget_line_item
    budget_line_item = session.get(BudgetLineItem, data.SYS_BUDGET_ID)

    if not budget_line_item:
        raise ValueError(f"BudgetLineItem with SYS_BUDGET_ID {data.SYS_BUDGET_ID} not found.")

    agreement = budget_line_item.agreement

    session.delete(budget_line_item)
    session.commit()

    if not agreement:
        logger.warning(f"No agreement found for {data}.")

    if agreement and not agreement.budget_line_items:
        logger.warning(f"I would have deleted the agreement here since it has no budget line items: {agreement}")

    # create an OPS event for the delete
    ops_event = OpsEvent(
        event_type=OpsEventType.DELETE_BLI,
        event_status=OpsEventStatus.SUCCESS,
        created_by=sys_user.id,
        event_details={"deleted_bli": budget_line_item.to_dict()},
    )

    session.add(ops_event)
    session.commit()


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


def validate_data(data: BudgetLineItemData) -> bool:
    """
    Validate the data in a BudgetLineItemData instance.

    :param data: The BudgetLineItemData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.SYS_BUDGET_ID is not None,
        ]
    )


def validate_all(data: List[BudgetLineItemData]) -> bool:
    """
    Validate a list of BudgetLineItemData instances.

    :param data: The list of BudgetLineItemData instances to validate.

    :return: A list of valid BudgetLineItemData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


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


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the TSV file and persist the models to the database.

    :param data: The data from the TSV file.
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
