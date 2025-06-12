# flake8: noqa F401, F403, F405
import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import *


@dataclass
class AAData:
    """
    Dataclass to represent an AA data row.
    """

    AA_NAME: str
    SYS_AA_ID: Optional[int] = field(default=None)
    SYS_PROJECT_ID: Optional[int] = field(default=None)
    PROC_SHOP_ID: Optional[str] = field(default=None)
    CONTRACT_START_DATE: Optional[date] = field(default=None)
    CONTRACT_END_DATE: Optional[date] = field(default=None)
    OPRE_PROJECT_OFFICER: Optional[int] = field(default=None)
    OPRE_ALT_PROJECT_OFFICER: Optional[int] = field(default=None)

    def __post_init__(self):
        if not self.AA_NAME:
            raise ValueError("AA_NAME is required.")

        self.AA_NAME = self.AA_NAME.strip()
        self.SYS_AA_ID = int(self.SYS_IAA_ID) if self.SYS_IAA_ID else None
        self.SYS_PROJECT_ID = int(self.SYS_PROJECT_ID) if self.SYS_PROJECT_ID else None
        self.PROC_SHOP_ID = int(self.PROC_SHOP_ID) if self.PROC_SHOP_ID else None
        self.CONTRACT_START_DATE = (
            datetime.strptime(self.CONTRACT_START_DATE, "%Y-%m-%d").date()
            if self.CONTRACT_START_DATE
            else None
        )
        self.CONTRACT_END_DATE = (
            datetime.strptime(self.CONTRACT_END_DATE, "%Y-%m-%d").date() if self.CONTRACT_END_DATE else None
        )
        self.OPRE_PROJECT_OFFICER = int(self.OPRE_PROJECT_OFFICER) if self.OPRE_PROJECT_OFFICER else None
        self.OPRE_ALT_PROJECT_OFFICER = int(self.OPRE_ALT_PROJECT_OFFICER) if self.OPRE_ALT_PROJECT_OFFICER else None


def create_aa_data(data: dict) -> AAData:
    """
    Convert a dictionary to an AAData dataclass instance.

    :param data: The dictionary to convert.

    :return: An AAData dataclass instance.
    """
    return AAData(**data)


def validate_data(data: AAData) -> bool:
    """
    Validate the data in an AAData instance.

    :param data: The AAData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.AA_NAME is not None,
        ]
    )


def validate_all(data: List[AAData]) -> bool:
    """
    Validate a list of AAData instances.

    :param data: The list of AAData instances to validate.

    :return: A list of valid AAData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: AAData, sys_user: User, session: Session) -> None:
    """
    Create and persist the AA models.

    :param data: The AAData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    project = session.get(Project, data.SYS_PROJECT_ID)
    if not project:
        logger.warning(f"Project with ID {data.SYS_PROJECT_ID} not found.")

    try:
        aa = IaaAaAgreement(
            name=data.AA_NAME,
            project=project,
            start_date=data.CONTRACT_START_DATE,
            end_date=data.CONTRACT_END_DATE,
            awarding_entity_id=data.PROC_SHOP_ID,
            project_officer_id=data.OPRE_PROJECT_OFFICER,
            alternate_project_officer_id=data.OPRE_ALT_PROJECT_OFFICER,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )

        existing_aa = session.execute(
            select(IaaAaAgreement).where(IaaAaAgreement.id == data.SYS_AA_ID)
        ).scalar_one_or_none()

        if existing_aa:
            logger.info(f"Found existing AA with ID {existing_aa.id}. Updating fields.")
            aa.id = existing_aa.id
            aa.created_on = existing_aa.created_on
            aa.created_by = existing_aa.created_by

        logger.debug(f"Created AA model for {aa.to_dict()}")

        session.merge(aa)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[AAData], sys_user: User, session: Session) -> None:
    """
    Convert a list of AAData instances to a list of BaseModel instances.

    :param data: The list of AAData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_aa_data(data: List[dict]) -> List[AAData]:
    """
    Convert a list of dictionaries to a list of AAData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of AAData instances.
    """
    return [create_aa_data(d) for d in data]


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

    aa_data = create_all_aa_data(list(data))
    logger.info(f"Created {len(aa_data)} IAA data instances.")

    if not validate_all(aa_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(aa_data, sys_user, session)
    logger.info("Finished loading models.")
