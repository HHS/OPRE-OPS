# flake8: noqa F401, F403, F405
from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from models import *  # noqa: F403, F401


@dataclass
class IAAAgencyData:
    """
    Dataclass to represent an IAAAgencyData data row.
    """

    SYS_IAA_CUSTOMER_AGENCY_ID: int
    CUSTOMER_AGENCY_NAME: Optional[str] = field(default=None)
    OBJECT_CLASS_CODE: Optional[int] = field(default=None)
    CUSTOMER_AGENCY_NBR: Optional[str] = field(default=None)
    CUSTOMER_DUNS: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.SYS_IAA_CUSTOMER_AGENCY_ID:
            raise ValueError("IAA Customer Agency ID is required.")

        self.SYS_IAA_CUSTOMER_AGENCY_ID = int(self.SYS_IAA_CUSTOMER_AGENCY_ID)
        self.CUSTOMER_AGENCY_NAME = str(self.CUSTOMER_AGENCY_NAME) if self.CUSTOMER_AGENCY_NAME else None
        self.OBJECT_CLASS_CODE = int(self.OBJECT_CLASS_CODE) if self.OBJECT_CLASS_CODE else None
        self.CUSTOMER_AGENCY_NBR = str(self.CUSTOMER_AGENCY_NBR) if self.CUSTOMER_AGENCY_NBR else None
        self.CUSTOMER_DUNS = str(self.CUSTOMER_DUNS) if self.CUSTOMER_DUNS else None


def create_iaa_agency_data(data: dict) -> IAAAgencyData:
    """
    Convert a dictionary to an IAAAgencyData dataclass instance.

    :param data: The dictionary to convert.

    :return: An IAAAgencyData dataclass instance.
    """
    return IAAAgencyData(**data)


def validate_data(data: IAAAgencyData) -> bool:
    """
    Validate the data in an IAAAgencyData instance.

    :param data: The IAAAgencyData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.SYS_IAA_CUSTOMER_AGENCY_ID is not None,
            data.CUSTOMER_AGENCY_NAME is not None,  # Assuming agency name is required
        ]
    )


def validate_all(data: List[IAAAgencyData]) -> bool:
    """
    Validate a list of IAAAgencyData instances.

    :param data: The list of IAAAgencyData instances to validate.

    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: IAAAgencyData, sys_user: User, session: Session) -> None:
    """
    Create and persist the IAAAgency model.

    :param data: The IAAAgencyData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Creating models for {data}")

    try:

        object_class_code = session.execute(
            select(ObjectClassCode).where(ObjectClassCode.code == data.OBJECT_CLASS_CODE)
        ).scalar_one_or_none()

        iaa_agency = IAACustomerAgency(
            id=data.SYS_IAA_CUSTOMER_AGENCY_ID,
            name=data.CUSTOMER_AGENCY_NAME,
            object_class_code=object_class_code,
            customer_agency_nbr=data.CUSTOMER_AGENCY_NBR,
            customer_duns=data.CUSTOMER_DUNS,
            created_by=sys_user.id,
            updated_by=sys_user.id,
        )

        existing_agency = session.get(IAACustomerAgency, data.SYS_IAA_CUSTOMER_AGENCY_ID)
        if existing_agency:
            iaa_agency.id = existing_agency.id
            iaa_agency.created_by = existing_agency.created_by
            iaa_agency.created_on = existing_agency.created_on
            iaa_agency.updated_by = sys_user.id

        session.merge(iaa_agency)
        session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[IAAAgencyData], sys_user: User, session: Session) -> None:
    """
    Convert a list of IAAAgencyData instances to IAAAgency models and persist them.

    :param data: The list of IAAAgencyData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_iaa_agency_data(data: List[dict]) -> List[IAAAgencyData]:
    """
    Convert a list of dictionaries to a list of IAAAgencyData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of IAAAgencyData instances.
    """
    return [create_iaa_agency_data(d) for d in data]


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

    iaa_agency_data = create_all_iaa_agency_data(list(data))
    logger.info(f"Created {len(iaa_agency_data)} IAA Agency data instances.")

    if not validate_all(iaa_agency_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(iaa_agency_data, sys_user, session)
    logger.info("Finished loading IAA Agency models.")
