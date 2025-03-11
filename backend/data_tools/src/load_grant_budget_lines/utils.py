import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from models import (
    CAN,
    BudgetLineItemStatus,
    GrantAgreement,
    GrantBudgetLineItem,
    GrantBudgetLineItemDetail,
    ObjectClassCode,
    StateCode,
    User,
)


@dataclass
class GrantBudgetLineItemData:
    """
    Dataclass to represent a GrantBudgetLineItemData data row.
    """

    SYS_GRANTS_ID: int
    SYS_BUDGET_ID: Optional[int] = field(default=None)
    YEAR: Optional[int] = field(default=None)
    BNS_NBR: Optional[str] = field(default=None)
    COMMITTED_DATE: Optional[date] = field(default=None)
    FA_SIGNED_DATE: Optional[date] = field(default=None)
    OBLIGATED_DATE: Optional[date] = field(default=None)
    BUDGET_START_DATE: Optional[date] = field(default=None)
    BUDGET_END_DATE: Optional[date] = field(default=None)
    OBJECT_CLASS_CODE: Optional[int] = field(default=None)
    ENABLE: Optional[bool] = field(default=None)
    GRANTS_NBR: Optional[str] = field(default=None)
    GRANTEE: Optional[str] = field(default=None)
    EDUCATIONAL_INSTITUTE: Optional[bool] = field(default=None)
    STATE_CODE: Optional[StateCode] = field(default=None)
    LINE_DESCRIPTION: Optional[str] = field(default=None)
    COMMENTS: Optional[str] = field(default=None)
    DATE_NEEDED: Optional[date] = field(default=None)
    SYS_CAN_ID: Optional[int] = field(default=None)
    AMOUNT: Optional[float] = field(default=None)
    STATUS: Optional[BudgetLineItemStatus] = field(default=None)

    def __post_init__(self):
        if not self.SYS_GRANTS_ID:
            raise ValueError("SYS_GRANTS_ID is required.")

        self.SYS_GRANTS_ID = int(self.SYS_GRANTS_ID)
        self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID) if self.SYS_BUDGET_ID else None
        self.YEAR = int(self.YEAR) if self.YEAR else None
        self.BNS_NBR = self.BNS_NBR if self.BNS_NBR else None
        self.COMMITTED_DATE = datetime.strptime(self.COMMITTED_DATE, "%Y-%m-%d").date() if self.COMMITTED_DATE else None
        self.FA_SIGNED_DATE = datetime.strptime(self.FA_SIGNED_DATE, "%Y-%m-%d").date() if self.FA_SIGNED_DATE else None
        self.OBLIGATED_DATE = datetime.strptime(self.OBLIGATED_DATE, "%Y-%m-%d").date() if self.OBLIGATED_DATE else None
        self.BUDGET_START_DATE = (
            datetime.strptime(self.BUDGET_START_DATE, "%Y-%m-%d").date() if self.BUDGET_START_DATE else None
        )
        self.BUDGET_END_DATE = (
            datetime.strptime(self.BUDGET_END_DATE, "%Y-%m-%d").date() if self.BUDGET_END_DATE else None
        )
        self.OBJECT_CLASS_CODE = int(self.OBJECT_CLASS_CODE) if self.OBJECT_CLASS_CODE else None
        self.ENABLE = bool(self.ENABLE) if self.ENABLE else None
        self.GRANTS_NBR = self.GRANTS_NBR if self.GRANTS_NBR else None
        self.GRANTEE = self.GRANTEE if self.GRANTEE else None
        self.EDUCATIONAL_INSTITUTE = (
            True if self.EDUCATIONAL_INSTITUTE == "1" else False if self.EDUCATIONAL_INSTITUTE == "0" else None
        )
        self.STATE_CODE = StateCode[self.STATE_CODE] if self.STATE_CODE else None
        self.LINE_DESCRIPTION = self.LINE_DESCRIPTION if self.LINE_DESCRIPTION else None
        self.COMMENTS = str(self.COMMENTS) if self.COMMENTS else None
        self.DATE_NEEDED = datetime.strptime(self.DATE_NEEDED, "%Y-%m-%d").date() if self.DATE_NEEDED else None
        self.SYS_CAN_ID = int(self.SYS_CAN_ID) if self.SYS_CAN_ID else None
        self.AMOUNT = float(self.AMOUNT) if self.AMOUNT else None
        self.STATUS = BudgetLineItemStatus[self.STATUS] if self.STATUS else None


def create_budget_line_item_data(data: dict) -> GrantBudgetLineItemData:
    """
    Convert a dictionary to a GrantBudgetLineItemData dataclass instance.

    :param data: The dictionary to convert.

    :return: A GrantBudgetLineItemData dataclass instance.
    """
    return GrantBudgetLineItemData(**data)


def validate_data(data: GrantBudgetLineItemData) -> bool:
    """
    Validate the data in a GrantBudgetLineItemData instance.

    :param data: The GrantBudgetLineItemData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.SYS_GRANTS_ID is not None,
        ]
    )


def validate_all(data: List[GrantBudgetLineItemData]) -> bool:
    """
    Validate a list of GrantBudgetLineItemData instances.

    :param data: The list of GrantBudgetLineItemData instances to validate.

    :return: A list of valid GrantBudgetLineItemData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: GrantBudgetLineItemData, sys_user: User, session: Session) -> None:
    """
    Create and persist the GrantBudgetLineItem models.

    :param data: The GrantBudgetLineItemData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    try:
        # Create BudgetLineItem model
        grant = session.execute(
            select(GrantAgreement).where(GrantAgreement.maps_sys_id == data.SYS_GRANTS_ID)
        ).scalar_one_or_none()

        if not grant:
            raise ValueError(f"GrantAgreement with SYS_GRANTS_ID {data.SYS_GRANTS_ID} not found.")

        object_class_code = session.execute(
            select(ObjectClassCode).where(ObjectClassCode.code == data.OBJECT_CLASS_CODE)
        ).scalar_one_or_none()

        can = session.get(CAN, data.SYS_CAN_ID)

        existing_bli_detail = session.execute(
            select(GrantBudgetLineItemDetail).where(
                and_(
                    GrantBudgetLineItemDetail.grants_number == data.GRANTS_NBR,
                    GrantBudgetLineItemDetail.grantee_name == data.GRANTEE,
                    GrantBudgetLineItemDetail.educational_institution == data.EDUCATIONAL_INSTITUTE,
                    GrantBudgetLineItemDetail.state_code == data.STATE_CODE,
                )
            )
        ).scalar_one_or_none()

        if not existing_bli_detail:
            bli_detail = GrantBudgetLineItemDetail(
                grants_number=data.GRANTS_NBR,
                grantee_name=data.GRANTEE,
                educational_institution=data.EDUCATIONAL_INSTITUTE,
                state_code=data.STATE_CODE,
                created_by=sys_user.id,
                updated_by=sys_user.id,
            )
        else:
            bli_detail = existing_bli_detail

        bli = GrantBudgetLineItem(
            id=data.SYS_BUDGET_ID,
            agreement_id=grant.id,
            details=bli_detail,
            grant_year_number=data.YEAR,
            bns_number=data.BNS_NBR,
            committed_date=data.COMMITTED_DATE,
            fa_signed_date=data.FA_SIGNED_DATE,
            obligation_date=data.OBLIGATED_DATE,
            start_date=data.BUDGET_START_DATE,
            end_date=data.BUDGET_END_DATE,
            object_class_code=object_class_code,
            line_description=data.LINE_DESCRIPTION,
            comments=data.COMMENTS,
            date_needed=data.DATE_NEEDED,
            can=can,
            amount=data.AMOUNT,
            status=data.STATUS,
            created_by=sys_user.id,
            updated_by=sys_user.id,
        )

        existing_bli = session.get(GrantBudgetLineItem, data.SYS_BUDGET_ID)

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

        logger.info(f"GrantBudgetLineItem model: {bli.to_dict()}")
        logger.info(f"GrantBudgetLineItemDetail model: {bli_detail.to_dict()}")
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[GrantBudgetLineItemData], sys_user: User, session: Session) -> None:
    """
    Convert a list of GrantBudgetLineItemData instances to a list of BaseModel instances.

    :param data: The list of GrantBudgetLineItemData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_budget_line_item_data(data: List[dict]) -> List[GrantBudgetLineItemData]:
    """
    Convert a list of dictionaries to a list of GrantBudgetLineItemData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of GrantBudgetLineItemData instances.
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
    logger.info(f"Created {len(budget_line_item_data)} GrantBudgetLineItemData instances.")

    if not validate_all(budget_line_item_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(budget_line_item_data, sys_user, session)
    logger.info(f"Finished loading models.")
