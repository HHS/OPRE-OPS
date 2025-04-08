from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from models import User


@dataclass
class BudgetLineFromMainSpreadsheetItemData:
    """
    Dataclass to represent a BudgetLineItemData data row.
    """

    EFFECTIVE_DATE: Optional[date] = field(default=None)
    REQUESTED_BY: Optional[str] = field(default=None)
    HOW_REQUESTED: Optional[str] = field(default=None)
    CHANGE_REASONS: Optional[str] = field(default=None)
    WHO_UPDATED: Optional[str] = field(default=None)
    FISCAL_YEAR: Optional[str] = field(default=None)
    CAN: Optional[str] = field(default=None)
    SYS_BUDGET_ID: Optional[int] = field(default=None)
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
        if self.EFFECTIVE_DATE and isinstance(self.EFFECTIVE_DATE, str):
            try:
                self.EFFECTIVE_DATE = datetime.strptime(self.EFFECTIVE_DATE, "%Y-%m-%d").date()
            except ValueError:
                self.EFFECTIVE_DATE = None

        if self.DATE_NEEDED and isinstance(self.DATE_NEEDED, str):
            try:
                self.DATE_NEEDED = datetime.strptime(self.DATE_NEEDED, "%Y-%m-%d").date()
            except ValueError:
                self.DATE_NEEDED = None

        if self.SYS_BUDGET_ID:
            try:
                self.SYS_BUDGET_ID = int(self.SYS_BUDGET_ID)
            except (ValueError, TypeError):
                self.SYS_BUDGET_ID = None

        if self.AMOUNT:
            try:
                self.AMOUNT = float(self.AMOUNT)
            except (ValueError, TypeError):
                self.AMOUNT = None

        if self.PROC_FEE_AMOUNT:
            try:
                self.PROC_FEE_AMOUNT = float(self.PROC_FEE_AMOUNT)
            except (ValueError, TypeError):
                self.PROC_FEE_AMOUNT = None


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the TSV file and persist the models to the database.

    :param data: The data from the TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.

    :return: None
    """
    logger.info("transform triggered")
