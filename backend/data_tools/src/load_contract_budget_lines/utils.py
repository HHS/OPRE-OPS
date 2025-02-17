import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from models import BudgetLineItemStatus, ModType, User


@dataclass
class BudgetLineItemData:
    """
    Dataclass to represent a BudgetLineItem data row.
    """

    SYS_CONTRACT_ID: int
    SYS_BUDGET_ID: Optional[int] = field(default=None)
    INVOICE_LINE_NBR: Optional[int] = field(default=None)
    SYS_TYPE_OF_MODE_ID: Optional[ModType] = field(default=None)
    EXTEND_POP_TO: Optional[date] = field(default=None)
    ZERO_REQUISITION_NBR: Optional[str] = field(default=None)
    ZERO_REQUISITION_DATE: Optional[date] = field(default=None)
    REQUISITION_NBR: Optional[str] = field(default=None)
    REQUISITION_DATE: Optional[date] = field(default=None)
    OBJECT_CLASS_CODE: Optional[int] = field(default=None)
    MOD_NBR: Optional[str] = field(default=None)
    DOC_RECEIVED: Optional[bool] = field(default=None)
    PSC_FEE_DOC_NBR: Optional[str] = field(default=None)
    PSC_FEE_PYMT_REF_NBR: Optional[str] = field(default=None)
    OBLIGATION_DATE: Optional[date] = field(default=None)
    CERTIFIED: Optional[bool] = field(default=None)
    PERF_START_DATE: Optional[date] = field(default=None)
    PERF_END_DATE: Optional[date] = field(default=None)
    CLOSED: Optional[bool] = field(default=None)
    CLOSED_BY: Optional[int] = field(default=None)
    CLOSE_DATE: Optional[date] = field(default=None)
    REQUISITION_GROUP: Optional[int] = field(default=None)
    REQUISITION_CHECK: Optional[str] = field(default=None)
    SYS_AAP_ID: Optional[int] = field(default=None)
    SYS_CLIN_ID: Optional[int] = field(default=None)
    ON_HOLD: Optional[bool] = field(default=None)
    LINE_DESCRIPTION: Optional[str] = field(default=None)
    COMMENTS: Optional[str] = field(default=None)
    DATE_NEEDED: Optional[date] = field(default=None)
    SYS_CAN_ID: Optional[int] = field(default=None)
    AMOUNT: Optional[float] = field(default=None)
    STATUS: Optional[BudgetLineItemStatus] = field(default=None)
    OVERWRITE_PSC_FEE_RATE: Optional[float] = field(default=None)
    CLIN_NAME: Optional[str] = field(default=None)
    CLIN: Optional[str] = field(default=None)
    POP_START_DATE: Optional[date] = field(default=None)
    POP_END_DATE: Optional[date] = field(default=None)

    def __post_init__(self):
        if not self.SYS_CONTRACT_ID:
            raise ValueError("SYS_CONTRACT_ID is required.")

        self.SYS_CONTRACT_ID = int(self.SYS_CONTRACT_ID)
        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID) if self.SYS_BUDGET_ID else None
        self.INVOICE_LINE_NBR = int(self.INVOICE_LINE_NBR) if self.INVOICE_LINE_NBR else None
        self.SYS_TYPE_OF_MODE_ID = ModType(int(self.SYS_TYPE_OF_MODE_ID)) if self.SYS_TYPE_OF_MODE_ID else None
        self.EXTEND_POP_TO = datetime.strptime(self.EXTEND_POP_TO, "%Y-%m-%d").date() if self.EXTEND_POP_TO else None
        self.ZERO_REQUISITION_NBR = str(self.ZERO_REQUISITION_NBR) if self.ZERO_REQUISITION_NBR else None
        self.ZERO_REQUISITION_DATE = (
            datetime.strptime(self.ZERO_REQUISITION_DATE, "%Y-%m-%d").date() if self.ZERO_REQUISITION_DATE else None
        )
        self.REQUISITION_NBR = str(self.REQUISITION_NBR) if self.REQUISITION_NBR else None
        self.REQUISITION_DATE = (
            datetime.strptime(self.REQUISITION_DATE, "%Y-%m-%d").date() if self.REQUISITION_DATE else None
        )
        self.OBJECT_CLASS_CODE = int(self.OBJECT_CLASS_CODE) if self.OBJECT_CLASS_CODE else None
        self.MOD_NBR = str(self.MOD_NBR) if self.MOD_NBR else None
        self.DOC_RECEIVED = bool(self.DOC_RECEIVED) if self.DOC_RECEIVED else None
        self.PSC_FEE_DOC_NBR = str(self.PSC_FEE_DOC_NBR) if self.PSC_FEE_DOC_NBR else None
        self.PSC_FEE_PYMT_REF_NBR = str(self.PSC_FEE_PYMT_REF_NBR) if self.PSC_FEE_PYMT_REF_NBR else None
        self.OBLIGATION_DATE = (
            datetime.strptime(self.OBLIGATION_DATE, "%Y-%m-%d").date() if self.OBLIGATION_DATE else None
        )
        self.CERTIFIED = bool(self.CERTIFIED) if self.CERTIFIED else None
        self.PERF_START_DATE = (
            datetime.strptime(self.PERF_START_DATE, "%Y-%m-%d").date() if self.PERF_START_DATE else None
        )
        self.PERF_END_DATE = datetime.strptime(self.PERF_END_DATE, "%Y-%m-%d").date() if self.PERF_END_DATE else None
        self.CLOSED = True if self.CLOSED == "Closed" else False
        self.CLOSED_BY = int(self.CLOSED_BY) if self.CLOSED_BY else None
        self.CLOSE_DATE = datetime.strptime(self.CLOSE_DATE, "%Y-%m-%d").date() if self.CLOSE_DATE else None
        self.REQUISITION_GROUP = int(self.REQUISITION_GROUP) if self.REQUISITION_GROUP else None
        self.REQUISITION_CHECK = str(self.REQUISITION_CHECK) if self.REQUISITION_CHECK else None
        self.SYS_AAP_ID = int(self.SYS_AAP_ID) if self.SYS_AAP_ID else None
        self.SYS_CLIN_ID = int(self.SYS_CLIN_ID) if self.SYS_CLIN_ID else None
        self.ON_HOLD = True if self.ON_HOLD == "1" else False
        self.LINE_DESCRIPTION = str(self.LINE_DESCRIPTION) if self.LINE_DESCRIPTION else None
        self.COMMENTS = str(self.COMMENTS) if self.COMMENTS else None
        self.DATE_NEEDED = datetime.strptime(self.DATE_NEEDED, "%Y-%m-%d").date() if self.DATE_NEEDED else None
        self.SYS_CAN_ID = int(self.SYS_CAN_ID) if self.SYS_CAN_ID else None
        self.AMOUNT = float(self.AMOUNT) if self.AMOUNT else None
        self.STATUS = BudgetLineItemStatus[self.STATUS] if self.STATUS else None
        self.OVERWRITE_PSC_FEE_RATE = float(self.OVERWRITE_PSC_FEE_RATE) if self.OVERWRITE_PSC_FEE_RATE else None
        self.CLIN_NAME = str(self.CLIN_NAME) if self.CLIN_NAME else None
        self.CLIN = str(self.CLIN) if self.CLIN else None
        self.POP_START_DATE = datetime.strptime(self.POP_START_DATE, "%Y-%m-%d").date() if self.POP_START_DATE else None
        self.POP_END_DATE = datetime.strptime(self.POP_END_DATE, "%Y-%m-%d").date() if self.POP_END_DATE else None


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
            data.SYS_CONTRACT_ID is not None,
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
    Create and persist the BudgetLineItem models.

    :param data: The BudgetLineItemData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    try:
        # contract = ContractAgreement(
        #     name=data.CONTRACT_NAME,
        #     maps_sys_id=data.SYS_CONTRACT_ID,
        #     contract_number=data.CONTRACT_NBR,
        #     project_id=data.SYS_PROJECT_ID,
        #     vendor_id=data.SYS_VENDOR_ID,
        #     task_order_number=data.TASK_ORDER_NBR,
        #     po_number=data.PO_NBR,
        #     acquisition_type=data.ACQUISITION_TYPE,
        #     product_service_code_id=psc.id if psc else None,
        #     project_officer_id=data.OPRE_PROJECT_OFFICER,
        #     start_date=data.CONTRACT_START_DATE,
        #     end_date=data.CONTRACT_END_DATE,
        #     contract_type=data.CONTRACT_TYPE,
        #     psc_contract_specialist=data.PSC_CONTRACT_SPECIALIST,
        #     cotr_id=data.OPRE_COTR,
        #     created_by=sys_user.id,
        #     updated_by=sys_user.id,
        #     created_on=datetime.now(),
        #     updated_on=datetime.now(),
        # )
        #
        # existing_contract = session.execute(
        #     select(ContractAgreement).where(ContractAgreement.maps_sys_id == data.SYS_CONTRACT_ID)
        # ).scalar_one_or_none()
        #
        # if existing_contract:
        #     contract.id = existing_contract.id
        #     contract.created_on = existing_contract.created_on
        #
        # logger.info(f"Created ContractAgreement model for {contract.to_dict()}")
        #
        # session.merge(contract)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[BudgetLineItemData], sys_user: User, session: Session) -> None:
    """
    Convert a list of BudgetLineItemData instances to a list of BaseModel instances.

    :param data: The list of BudgetLineItemData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
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
    logger.info(f"Finished loading models.")
