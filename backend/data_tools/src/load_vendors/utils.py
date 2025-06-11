from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from models import User, Vendor


@dataclass
class VendorData:
    """
    Dataclass to represent a Vendor data row.
    """

    SYS_VENDOR_ID: int
    VENDOR_NAME: Optional[str] = field(default=None)
    DUNS: Optional[int] = field(default=None)
    ADDRESS: Optional[str] = field(default=None)
    HEAD_OF_CONTRACT: Optional[str] = field(default=None)
    PHONE_NBR: Optional[str] = field(default=None)
    EMAIL: Optional[str] = field(default=None)
    STATUS: Optional[bool] = field(default=None)
    LAST_MODIFIED_DATE: Optional[str] = field(default=None)
    LAST_MODIFIED_BY: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.SYS_VENDOR_ID:
            raise ValueError("Vendor ID is required.")

        self.SYS_VENDOR_ID = int(self.SYS_VENDOR_ID)
        self.VENDOR_NAME = str(self.VENDOR_NAME) if self.VENDOR_NAME else None
        self.DUNS = int(self.DUNS) if self.DUNS else None
        self.ADDRESS = str(self.ADDRESS) if self.ADDRESS else None
        self.HEAD_OF_CONTRACT = str(self.HEAD_OF_CONTRACT) if self.HEAD_OF_CONTRACT else None
        self.PHONE_NBR = str(self.PHONE_NBR) if self.PHONE_NBR else None
        self.EMAIL = str(self.EMAIL) if self.EMAIL else None
        self.STATUS = True if self.STATUS is not None and self.STATUS == "ACTIVE" else False


def create_vendor_data(data: dict) -> VendorData:
    """
    Convert a dictionary to a VendorData dataclass instance.

    :param data: The dictionary to convert.

    :return: A VendorData dataclass instance.
    """
    return VendorData(**data)


def validate_data(data: VendorData) -> bool:
    """
    Validate the data in a VendorData instance.

    :param data: The VendorData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.SYS_VENDOR_ID is not None,
            data.VENDOR_NAME is not None,  # Assuming vendor name is also required
        ]
    )


def validate_all(data: List[VendorData]) -> bool:
    """
    Validate a list of VendorData instances.

    :param data: The list of VendorData instances to validate.

    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: VendorData, sys_user: User, session: Session) -> None:
    """
    Create and persist the Vendor model.

    :param data: The VendorData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    logger.debug(f"Creating models for {data}")

    try:
        vendor = Vendor(
            id=data.SYS_VENDOR_ID,
            name=data.VENDOR_NAME,
            duns=data.DUNS,
            active=data.STATUS,
            created_by=sys_user.id,
            updated_by=sys_user.id,
        )

        existing_vendor = session.get(Vendor, data.SYS_VENDOR_ID)
        if existing_vendor:
            vendor.id = existing_vendor.id
            vendor.created_by = existing_vendor.created_by
            vendor.created_on = existing_vendor.created_on
            vendor.updated_by = sys_user.id

        session.merge(vendor)
        session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[VendorData], sys_user: User, session: Session) -> None:
    """
    Convert a list of VendorData instances to Vendor models and persist them.

    :param data: The list of VendorData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_vendor_data(data: List[dict]) -> List[VendorData]:
    """
    Convert a list of dictionaries to a list of VendorData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of VendorData instances.
    """
    return [create_vendor_data(d) for d in data]


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

    vendor_data = create_all_vendor_data(list(data))
    logger.info(f"Created {len(vendor_data)} Vendor data instances.")

    if not validate_all(vendor_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(vendor_data, sys_user, session)
    logger.info("Finished loading vendor models.")
