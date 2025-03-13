import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import GrantAgreement, Project, User


@dataclass
class GrantData:
    """
    Dataclass to represent a Grant data row.
    """

    GRANTS_TITLE: str
    SYS_GRANTS_ID: Optional[int] = field(default=None)
    SYS_PROJECT_ID: Optional[int] = field(default=None)
    OPRE_PROJECT_OFFICER_ID: Optional[int] = field(default=None)
    FOA_NBR: Optional[str] = field(default=None)
    TOTAL_FUNDING: Optional[float] = field(default=None)
    GRANTS_START_DATE: Optional[date] = field(default=None)
    GRANTS_END_DATE: Optional[date] = field(default=None)
    NUMBER_OF_YEARS: Optional[int] = field(default=None)
    NUMBER_OF_GRANTS: Optional[int] = field(default=None)

    def __post_init__(self):
        if not self.GRANTS_TITLE:
            raise ValueError("GRANTS_TITLE is required.")

        self.GRANTS_TITLE = self.GRANTS_TITLE.strip()
        self.SYS_GRANTS_ID = int(self.SYS_GRANTS_ID) if self.SYS_GRANTS_ID else None
        self.SYS_PROJECT_ID = int(self.SYS_PROJECT_ID) if self.SYS_PROJECT_ID else None
        self.OPRE_PROJECT_OFFICER_ID = int(self.OPRE_PROJECT_OFFICER_ID) if self.OPRE_PROJECT_OFFICER_ID else None
        self.FOA_NBR = self.FOA_NBR.strip() if self.FOA_NBR else None
        self.TOTAL_FUNDING = float(self.TOTAL_FUNDING) if self.TOTAL_FUNDING else None
        self.GRANTS_START_DATE = (
            datetime.strptime(self.GRANTS_START_DATE, "%Y-%m-%d %H:%M:%S").date() if self.GRANTS_START_DATE else None
        )
        self.GRANTS_END_DATE = (
            datetime.strptime(self.GRANTS_END_DATE, "%Y-%m-%d %H:%M:%S").date() if self.GRANTS_END_DATE else None
        )
        self.NUMBER_OF_YEARS = int(self.NUMBER_OF_YEARS) if self.NUMBER_OF_YEARS else None
        self.NUMBER_OF_GRANTS = int(self.NUMBER_OF_GRANTS) if self.NUMBER_OF_GRANTS else None


def create_grant_data(data: dict) -> GrantData:
    """
    Convert a dictionary to a GrantData dataclass instance.

    :param data: The dictionary to convert.

    :return: A GrantData dataclass instance.
    """
    return GrantData(**data)


def validate_data(data: GrantData) -> bool:
    """
    Validate the data in a GrantData instance.

    :param data: The GrantData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.GRANTS_TITLE is not None,
        ]
    )


def validate_all(data: List[GrantData]) -> bool:
    """
    Validate a list of GrantData instances.

    :param data: The list of GrantData instances to validate.

    :return: A list of valid GrantData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: GrantData, sys_user: User, session: Session) -> None:
    """
    Create and persist the GrantAgreement models.

    :param data: The GrantData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    po = session.get(User, data.OPRE_PROJECT_OFFICER_ID)

    if not po:
        logger.warning(f"Project Officer with ID {data.OPRE_PROJECT_OFFICER_ID} not found.")

    project = session.get(Project, data.SYS_PROJECT_ID)

    if not project:
        logger.warning(f"Project with ID {data.SYS_PROJECT_ID} not found.")

    try:
        grant = GrantAgreement(
            name=data.GRANTS_TITLE,
            maps_sys_id=data.SYS_GRANTS_ID,
            project=project,
            project_officer=po,
            foa=data.FOA_NBR,
            total_funding=data.TOTAL_FUNDING,
            start_date=data.GRANTS_START_DATE,
            end_date=data.GRANTS_END_DATE,
            number_of_years=data.NUMBER_OF_YEARS,
            number_of_grants=data.NUMBER_OF_GRANTS,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )

        existing_grant = session.execute(
            select(GrantAgreement).where(GrantAgreement.maps_sys_id == data.SYS_GRANTS_ID)
        ).scalar_one_or_none()

        if existing_grant:
            grant.id = existing_grant.id
            grant.created_on = existing_grant.created_on

        logger.info(f"Created GrantAgreement model for {grant.to_dict()}")

        session.merge(grant)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[GrantData], sys_user: User, session: Session) -> None:
    """
    Convert a list of GrantData instances to a list of BaseModel instances.

    :param data: The list of GrantData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_grant_data(data: List[dict]) -> List[GrantData]:
    """
    Convert a list of dictionaries to a list of GrantData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of GrantData instances.
    """
    return [create_grant_data(d) for d in data]


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

    grant_data = create_all_grant_data(list(data))
    logger.info(f"Created {len(grant_data)} Grant data instances.")

    if not validate_all(grant_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(grant_data, sys_user, session)
    logger.info("Finished loading models.")
