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

    PROJECT_NAME: str
    AA_NAME: str
    REQUESTING_AGENCY_NAME: str
    SERVICING_AGENCY_NAME: str
    SERVICE_REQUIREMENT_TYPE: str
    REQUESTING_AGENCY_ABBREVIATION: Optional[str] = field(default=None)
    SERVICING_AGENCY_ABBREVIATION: Optional[str] = field(default=None)

    def __post_init__(self):
        if (
            not self.PROJECT_NAME
            or not self.AA_NAME
            or not self.REQUESTING_AGENCY_NAME
            or not self.SERVICING_AGENCY_NAME
            or not self.SERVICE_REQUIREMENT_TYPE
        ):
            raise ValueError("All fields must be provided.")

        self.PROJECT_NAME = self.PROJECT_NAME.strip()
        self.AA_NAME = self.AA_NAME.strip()
        self.REQUESTING_AGENCY_NAME = self.REQUESTING_AGENCY_NAME.strip()
        self.SERVICING_AGENCY_NAME = self.SERVICING_AGENCY_NAME.strip()
        self.SERVICE_REQUIREMENT_TYPE = self.SERVICE_REQUIREMENT_TYPE.strip()
        self.REQUESTING_AGENCY_ABBREVIATION = (
            self.REQUESTING_AGENCY_ABBREVIATION.strip() if self.REQUESTING_AGENCY_ABBREVIATION else None
        )
        self.SERVICING_AGENCY_ABBREVIATION = (
            self.SERVICING_AGENCY_ABBREVIATION.strip() if self.SERVICING_AGENCY_ABBREVIATION else None
        )


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
            data.PROJECT_NAME is not None,
            data.AA_NAME is not None,
            data.REQUESTING_AGENCY_NAME is not None,
            data.SERVICING_AGENCY_NAME is not None,
            data.SERVICE_REQUIREMENT_TYPE is not None,
        ]
    )


def validate_all(data: List[AAData]) -> bool:
    """
    Validate a list of AAData instances.

    :param data: The list of AAData instances to validate.

    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: AAData, sys_user: User, session: Session) -> None:
    """
    Create and persist the AA models.

    :param data: The AAData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Creating models for {data}")

    # Find project by name
    project = session.execute(select(Project).where(Project.title == data.PROJECT_NAME)).scalar_one_or_none()

    if not project:
        raise ValueError(f"Project with name {data.PROJECT_NAME} not found.")

    # Find or create agencies - check only by name
    requesting_agency = session.execute(
        select(AgreementAgency).where(AgreementAgency.name == data.REQUESTING_AGENCY_NAME)
    ).scalar_one_or_none()

    if not requesting_agency:
        logger.info(f"Creating new requesting agency: {data.REQUESTING_AGENCY_NAME}")
        requesting_agency = AgreementAgency(
            name=data.REQUESTING_AGENCY_NAME,
            abbreviation=data.REQUESTING_AGENCY_ABBREVIATION,
            requesting=True,
            servicing=False,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )
        session.add(requesting_agency)
    else:
        # Update the existing agency to ensure it has requesting role
        if not requesting_agency.requesting:
            requesting_agency.requesting = True
            requesting_agency.updated_by = sys_user.id
            requesting_agency.updated_on = datetime.now()

    servicing_agency = session.execute(
        select(AgreementAgency).where(AgreementAgency.name == data.SERVICING_AGENCY_NAME)
    ).scalar_one_or_none()

    if not servicing_agency:
        logger.info(f"Creating new servicing agency: {data.SERVICING_AGENCY_NAME}")
        servicing_agency = AgreementAgency(
            name=data.SERVICING_AGENCY_NAME,
            abbreviation=data.SERVICING_AGENCY_ABBREVIATION,
            requesting=False,
            servicing=True,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )
        session.add(servicing_agency)
    else:
        # Update the existing agency to ensure it has servicing role
        if not servicing_agency.servicing:
            servicing_agency.servicing = True
            servicing_agency.updated_by = sys_user.id
            servicing_agency.updated_on = datetime.now()

    session.commit()  # Commit to ensure agencies are created/updated before creating the agreement

    try:
        aa = AaAgreement(
            name=data.AA_NAME,
            project=project,
            requesting_agency=requesting_agency,
            servicing_agency=servicing_agency,
            service_requirement_type=ServiceRequirementType[data.SERVICE_REQUIREMENT_TYPE],
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )

        # Check if agreement already exists
        existing_aa = session.execute(select(AaAgreement).where(AaAgreement.name == data.AA_NAME)).scalar_one_or_none()

        if existing_aa:
            logger.info(f"Found existing AA with ID {existing_aa.id} for {data.AA_NAME}")
            aa.id = existing_aa.id
            aa.created_on = existing_aa.created_on
            aa.created_by = existing_aa.created_by

        logger.debug(f"Created AA model: {aa.to_dict()}")

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

    :return: None
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
    logger.info(f"Created {len(aa_data)} AA data instances.")

    if not validate_all(aa_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(aa_data, sys_user, session)
    logger.info("Finished loading models.")
