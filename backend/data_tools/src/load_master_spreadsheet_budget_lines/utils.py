import csv
import decimal
import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    CAN,
    Agreement,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractBudgetLineItem,
    DirectObligationBudgetLineItem,
    GrantBudgetLineItem,
    IAABudgetLineItem,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    Project,
    User,
)


@dataclass
class BudgetLineItemData:
    """
    Dataclass to represent a BudgetLineItemData data row.
    """

    SYS_BUDGET_ID: int
    EFFECTIVE_DATE: Optional[date] = field(default=None)
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
    DATE_NEEDED: Optional[date] = field(default=None)
    AMOUNT: Optional[float] = field(default=None)
    PROC_FEE_AMOUNT: Optional[float] = field(default=None)
    STATUS: Optional[str] = field(default=None)
    COMMENTS: Optional[str] = field(default=None)
    NEW_VS_CONTINUING: Optional[str] = field(default=None)
    APPLIED_RESEARCH_VS_EVALUATIVE: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.SYS_BUDGET_ID:
            raise ValueError("SYS_BUDGET_ID is required.")

        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID)
        self.EFFECTIVE_DATE = datetime.strptime(self.EFFECTIVE_DATE, "%m/%d/%Y").date() if self.EFFECTIVE_DATE else None
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
        self.DATE_NEEDED = datetime.strptime(self.DATE_NEEDED, "%m/%d/%Y").date() if self.DATE_NEEDED else None
        self.AMOUNT = float(self.AMOUNT) if self.AMOUNT else None
        self.PROC_FEE_AMOUNT = float(self.PROC_FEE_AMOUNT) if self.PROC_FEE_AMOUNT else None
        self.STATUS = str(self.STATUS) if self.STATUS else None
        self.COMMENTS = str(self.COMMENTS) if self.COMMENTS else None
        self.NEW_VS_CONTINUING = str(self.NEW_VS_CONTINUING) if self.NEW_VS_CONTINUING else None
        self.APPLIED_RESEARCH_VS_EVALUATIVE = str(self.APPLIED_RESEARCH_VS_EVALUATIVE) if self.APPLIED_RESEARCH_VS_EVALUATIVE else None


def calculate_proc_fee_percentage(pro_fee_amount: decimal, amount: decimal) -> Optional[float]:
    """
    Calculate the procurement shop fee (fractional) percentage.

    :param pro_fee_amount: The procurement shop fee amount.
    :param amount: The budget line item amount.

    :return: The calculated percentage or None if not applicable.
    """
    return (
        round((pro_fee_amount / amount), 5)
        if amount and pro_fee_amount and amount != 0
        else None
    )


def get_bli_status(status: str) -> Optional[BudgetLineItemStatus]:
    """
    Map the status string to the appropriate BudgetLineItemStatus.

    :param status: The status string to map.

    :return: The mapped BudgetLineItemStatus or None if not applicable.
    """
    status_mapping = {
        "obl": BudgetLineItemStatus.OBLIGATED,
        "com": BudgetLineItemStatus.IN_EXECUTION,
    }

    if status:
        if status.lower().startswith("opre"):
            status = BudgetLineItemStatus.PLANNED
        elif status.lower().startswith("psc"):
            status = BudgetLineItemStatus.IN_EXECUTION
        else:
            status = status_mapping.get(status.lower(), None)
    else:
        status = None
        logger.warning(f"No BudgetLineItemStatus conversion for {status}")

    return status


def get_cig_type_mapping() -> dict[str, AgreementType]:
    """
    Returns a mapping of CIG_TYPE to AgreementType.
    """
    return {
        "contract": AgreementType.CONTRACT,
        "grant": AgreementType.GRANT,
        "direct obligation": AgreementType.DIRECT_OBLIGATION,
        "do": AgreementType.DIRECT_OBLIGATION,
        "iaa": AgreementType.IAA,
        "iaa_aa": AgreementType.IAA_AA,
        "iaa aa": AgreementType.IAA_AA,
        "miscellaneous": AgreementType.MISCELLANEOUS,
    }


def verify_and_log_project_title(data: BudgetLineItemData, session: Session, project_id:Optional[int]):
    """
    Verify the project title against the provided CIG_NAME.

    :param data: BudgetLineItemData containing the expected project title and agreement name.
    :param session: SQLAlchemy DB session.
    :param project_id: ID of the project to verify.
    """
    project_title = None
    if project_id:
        project = session.execute(
            select(Project).where(Project.id == project_id)
        ).scalar_one_or_none()

        if project:
            project_title = project.title
            logger.info(f"Found Project: id={project_id}, title={project_title} for Agreement={data.CIG_NAME}.")
        else:
            logger.warning(f"Project with id {project_id} not found for Agreement {data.CIG_NAME}.")
    else:
        logger.warning(f"No project_id found for Agreement {data.CIG_NAME}.")

    if project_title and project_title.strip().lower() != data.PROJECT_TITLE.strip().lower():
        logger.warning(
            f"Mismatch: Expected Project Title '{data.PROJECT_TITLE}', "
            f"got '{project_title}' for Agreement {data.CIG_NAME}."
        )


def create_models(data: BudgetLineItemData, sys_user: User, session: Session, is_first_run : bool) -> None:
    """
    Create and persist the DirectObligationBudgetLineItem models.

    :param data: The BudgetLineItemData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    :param is_first_run: The flag to indicate first run.

    :return: None
    """
    logger.debug(f"Creating models for {data}.")

    try:
        # Find the associated Agreement
        agreement = session.execute(
            select(Agreement).where(Agreement.name == data.CIG_NAME)
        ).scalar_one_or_none()

        if not agreement:
            logger.warning(f"Agreement with CIG_NAME {data.CIG_NAME} not found.")
            project_id = None
        else:
            project_id = agreement.project_id
            logger.info(f"project_id={project_id} for Agreement={data.CIG_NAME}.")

        # Verify the Project Title
        verify_and_log_project_title(data, session, project_id)

        # Get CAN if it exists
        can_number = data.CAN.split(" ")[0] if data.CAN else None
        can = session.execute(
            select(CAN).where(CAN.number == can_number)
        ).scalar_one_or_none()

        if not can:
            logger.warning(f"CAN with number {can_number} not found.")

        # Map the CIG_TYPE to the appropriate AgreementType
        agreement_type = get_cig_type_mapping().get(data.CIG_TYPE.lower(), None)
        if not agreement_type:
            logger.warning(f"Unknown CIG_TYPE: {data.CIG_TYPE}")

        # Only process CONTRACT budget lines on the first run — skip them otherwise.
        if not is_first_run and agreement_type == AgreementType.CONTRACT:
            logger.warning(f"Skipping CONTRACT budget line item {data.SYS_BUDGET_ID}")
            return

        # Find the budget line item by SYS_BUDGET_ID
        existing_budget_line_item = session.execute(
            select(BudgetLineItem).where(BudgetLineItem.id == data.SYS_BUDGET_ID)
        ).scalar_one_or_none()

        # Determine which subclass to instantiate
        bli_class = {
            AgreementType.CONTRACT: ContractBudgetLineItem,
            AgreementType.GRANT: GrantBudgetLineItem,
            AgreementType.DIRECT_OBLIGATION: DirectObligationBudgetLineItem,
            AgreementType.IAA: IAABudgetLineItem,
        }.get(agreement_type, None)

        if not existing_budget_line_item:
            # Create a new BudgetLineItem subclass
            bli = bli_class(
                budget_line_item_type=agreement_type if agreement_type else None,
                line_description=data.LINE_DESC,
                comments=data.COMMENTS,
                agreement_id=agreement.id if agreement else None,
                agreement=agreement if agreement else None,
                can_id=can.id if can else None,
                can=can if can else None,
                amount=data.AMOUNT,
                status=get_bli_status(data.STATUS),
                date_needed=data.DATE_NEEDED,
                proc_shop_fee_percentage=calculate_proc_fee_percentage(data.PROC_FEE_AMOUNT, data.AMOUNT),
                created_by=sys_user.id,
                created_on=datetime.now()
            )
            logger.debug(f"Created {bli_class.__name__} model for {bli.to_dict()}")

        else:
            # Update the existing BudgetLineItem
            bli = existing_budget_line_item
            bli.id = existing_budget_line_item.id
            bli.budget_line_item_type = agreement_type if agreement_type else None
            bli.line_description = data.LINE_DESC
            bli.comments = data.COMMENTS
            bli.agreement_id = agreement.id if agreement else None
            bli.agreement = agreement if agreement else None
            bli.can_id = can.id if can else None
            bli.can = can if can else None
            bli.amount = data.AMOUNT
            bli.status = get_bli_status(data.STATUS)
            bli.date_needed = data.DATE_NEEDED
            bli.proc_shop_fee_percentage = calculate_proc_fee_percentage(data.PROC_FEE_AMOUNT, data.AMOUNT)
            bli.updated_by = sys_user.id
            bli.updated_on = datetime.now()

            logger.debug(f"Updated BudgetLineItem model for {bli.to_dict()}")

        # Merge the BudgetLineItem into the session
        session.add(bli)
        session.flush()

        # Record the new SYS_BUDGET_ID to manually update the spreadsheet later
        if not existing_budget_line_item:
            logger.info(
                f"BudgetLineItem ID updated: original SYS_BUDGET_ID = {data.SYS_BUDGET_ID}, "
                f"new SYS_BUDGET_ID = {bli.id}."
            )

        session.commit()

        # Create an OPSEvent record for the new BLI
        ops_event = OpsEvent(
            event_type=OpsEventType.CREATE_BLI if not existing_budget_line_item else OpsEventType.UPDATE_BLI,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={"new_bli": bli.to_dict()}
        )
        session.add(ops_event)
        session.commit()

    except Exception as err:
        logger.error(f"Error creating models for {data}: {err}")
        session.rollback()
        raise err


def create_all_models(data: List[BudgetLineItemData], sys_user: User, session: Session, is_first_run: bool) -> None:
    """
    Convert a list of BudgetLineItemData instances to a list of BaseModel instances.

    :param data: The list of BudgetLineItemData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    :param is_first_run: The flag to indicate first run.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session, is_first_run)


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


def transform(data: DictReader, session: Session, sys_user: User, is_first_run: bool = False) -> None:
    """
    Transform the data from the TSV file and persist the models to the database.

    :param data: The data from the TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.
    :param is_first_run: The flag to indicate first run.
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

    create_all_models(budget_line_item_data, sys_user, session, is_first_run)
    logger.info("Finished loading models.")
