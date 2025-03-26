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
class DirectObligationData:
    """
    Dataclass to represent an Direct Obligation data row.
    """

    DIRECT_OBLIGATION_NAME: str
    SYS_DIRECT_OBLIGATION_ID: Optional[int] = field(default=None)
    SYS_PROJECT_ID: Optional[int] = field(default=None)

    def __post_init__(self):
        if not self.DIRECT_OBLIGATION_NAME:
            raise ValueError("DIRECT_OBLIGATION_NAME is required.")

        self.DIRECT_OBLIGATION_NAME = self.DIRECT_OBLIGATION_NAME.strip()
        self.SYS_DIRECT_OBLIGATION_ID = int(self.SYS_DIRECT_OBLIGATION_ID) if self.SYS_DIRECT_OBLIGATION_ID else None
        self.SYS_PROJECT_ID = int(self.SYS_PROJECT_ID) if self.SYS_PROJECT_ID else None


def create_direct_obligation_data(data: dict) -> DirectObligationData:
    """
    Convert a dictionary to a DirectObligationData dataclass instance.

    :param data: The dictionary to convert.

    :return: A DirectObligationData dataclass instance.
    """
    return DirectObligationData(**data)


def validate_data(data: DirectObligationData) -> bool:
    """
    Validate the data in a DirectObligationData instance.

    :param data: The DirectObligationData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.DIRECT_OBLIGATION_NAME is not None,
        ]
    )


def validate_all(data: List[DirectObligationData]) -> bool:
    """
    Validate a list of DirectObligationData instances.

    :param data: The list of DirectObligationData instances to validate.

    :return: A list of valid DirectObligationData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: DirectObligationData, sys_user: User, session: Session) -> None:
    """
    Create and persist the Direct Obligation models.

    :param data: The DirectObligationData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Creating models for {data}")

    project = session.get(Project, data.SYS_PROJECT_ID)
    if not project:
        logger.warning(f"Project with ID {data.SYS_PROJECT_ID} not found.")

    try:
        direct_obligation = DirectAgreement(
            name=data.DIRECT_OBLIGATION_NAME,
            maps_sys_id=data.SYS_DIRECT_OBLIGATION_ID,
            project=project,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )

        existing_direct_obligation = session.execute(
            select(DirectAgreement).where(DirectAgreement.maps_sys_id == data.SYS_DIRECT_OBLIGATION_ID)
        ).scalar_one_or_none()

        if existing_direct_obligation:
            direct_obligation.id = existing_direct_obligation.id
            direct_obligation.created_on = existing_direct_obligation.created_on

        logger.debug(f"Created Direct Obligation model for {direct_obligation.to_dict()}")

        session.merge(direct_obligation)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[DirectObligationData], sys_user: User, session: Session) -> None:
    """
    Convert a list of DirectObligationData instances to a list of BaseModel instances.

    :param data: The list of DirectObligationData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_direct_obligation_data(data: List[dict]) -> List[DirectObligationData]:
    """
    Convert a list of dictionaries to a list of DirectObligationData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of DirectObligationData instances.
    """
    return [create_direct_obligation_data(d) for d in data]


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

    direct_obligation_data = create_all_direct_obligation_data(list(data))
    logger.info(f"Created {len(direct_obligation_data)} Direct Obligation data instances.")

    if not validate_all(direct_obligation_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(direct_obligation_data, sys_user, session)
    logger.info("Finished loading models.")
