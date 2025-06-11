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
class IAAData:
    """
    Dataclass to represent an IAA data row.
    """

    IAA_NAME: str
    SYS_IAA_ID: Optional[int] = field(default=None)
    SYS_PROJECT_ID: Optional[int] = field(default=None)
    SYS_IAA_CUSTOMER_AGENCY_ID: Optional[int] = field(default=None)
    OPRE_POC: Optional[str] = field(default=None)
    AGENCY_POC: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.IAA_NAME:
            raise ValueError("IAA_NAME is required.")

        self.IAA_NAME = self.IAA_NAME.strip()
        self.SYS_IAA_ID = int(self.SYS_IAA_ID) if self.SYS_IAA_ID else None
        self.SYS_PROJECT_ID = int(self.SYS_PROJECT_ID) if self.SYS_PROJECT_ID else None
        self.SYS_IAA_CUSTOMER_AGENCY_ID = (
            int(self.SYS_IAA_CUSTOMER_AGENCY_ID) if self.SYS_IAA_CUSTOMER_AGENCY_ID else None
        )
        self.OPRE_POC = self.OPRE_POC.strip() if self.OPRE_POC else None
        self.AGENCY_POC = self.AGENCY_POC.strip() if self.AGENCY_POC else None


def create_iaa_data(data: dict) -> IAAData:
    """
    Convert a dictionary to an IAAData dataclass instance.

    :param data: The dictionary to convert.

    :return: An IAAData dataclass instance.
    """
    return IAAData(**data)


def validate_data(data: IAAData) -> bool:
    """
    Validate the data in an IAAData instance.

    :param data: The IAAData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.IAA_NAME is not None,
        ]
    )


def validate_all(data: List[IAAData]) -> bool:
    """
    Validate a list of IAAData instances.

    :param data: The list of IAAData instances to validate.

    :return: A list of valid IAAData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: IAAData, sys_user: User, session: Session) -> None:
    """
    Create and persist the IAA models.

    :param data: The IAAData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    project = session.get(Project, data.SYS_PROJECT_ID)
    if not project:
        logger.warning(f"Project with ID {data.SYS_PROJECT_ID} not found.")

    agency = session.get(IAACustomerAgency, data.SYS_IAA_CUSTOMER_AGENCY_ID)
    if not agency:
        logger.warning(f"Agency with ID {data.SYS_IAA_CUSTOMER_AGENCY_ID} not found.")

    try:
        iaa = IaaAgreement(
            direction=IAADirectionType.OUTGOING,
            name=data.IAA_NAME,
            maps_sys_id=data.SYS_IAA_ID,
            project=project,
            iaa_customer_agency=agency,
            opre_poc=data.OPRE_POC,
            agency_poc=data.AGENCY_POC,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )

        existing_iaa = session.execute(
            select(IaaAgreement).where(IaaAgreement.maps_sys_id == data.SYS_IAA_ID)
        ).scalar_one_or_none()

        if existing_iaa:
            iaa.id = existing_iaa.id
            iaa.created_on = existing_iaa.created_on

        logger.debug(f"Created IAA model for {iaa.to_dict()}")

        session.merge(iaa)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[IAAData], sys_user: User, session: Session) -> None:
    """
    Convert a list of IAAData instances to a list of BaseModel instances.

    :param data: The list of IAAData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_iaa_data(data: List[dict]) -> List[IAAData]:
    """
    Convert a list of dictionaries to a list of IAAData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of IAAData instances.
    """
    return [create_iaa_data(d) for d in data]


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

    iaa_data = create_all_iaa_data(list(data))
    logger.info(f"Created {len(iaa_data)} IAA data instances.")

    if not validate_all(iaa_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(iaa_data, sys_user, session)
    logger.info("Finished loading models.")
