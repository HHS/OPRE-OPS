from csv import DictReader
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import ProcurementShop, ProcurementShopFee, User


@dataclass
class ProcurementShopData:
    """
    Dataclass to represent a Procurement Shop data row.
    """

    NAME: str
    ABBREVIATION: str
    FEE: Optional[str] = field(default=None)
    START_DATE: Optional[str] = field(default=None)
    END_DATE: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.NAME or not self.ABBREVIATION:
            raise ValueError("Both NAME and ABBREVIATION are required.")

        self.NAME = str(self.NAME).strip()
        self.ABBREVIATION = str(self.ABBREVIATION).strip()

        # Convert fee to Decimal or default to 0
        if self.FEE and self.FEE.strip():
            try:
                self.FEE = Decimal(self.FEE)
            except (ValueError, TypeError):
                self.FEE = Decimal("0")
        else:
            self.FEE = Decimal("0")

        # Convert dates from string to date objects if present
        if self.START_DATE and self.START_DATE.strip() and self.START_DATE != '""':
            self.START_DATE = datetime.strptime(self.START_DATE, "%Y-%m-%d").date()
        else:
            self.START_DATE = None

        if self.END_DATE and self.END_DATE.strip():
            self.END_DATE = datetime.strptime(self.END_DATE, "%Y-%m-%d").date()
        else:
            self.END_DATE = None


def create_procurement_shop_data(data: dict) -> ProcurementShopData:
    """
    Convert a dictionary to a ProcurementShopData dataclass instance.

    :param data: The dictionary to convert.
    :return: A ProcurementShopData dataclass instance.
    """
    return ProcurementShopData(**data)


def validate_data(data: ProcurementShopData) -> bool:
    """
    Validate the data in a ProcurementShopData instance.

    :param data: The ProcurementShopData instance to validate.
    :return: True if the data is valid, False otherwise.
    """
    return all(
        [data.NAME is not None and data.NAME.strip(), data.ABBREVIATION is not None and data.ABBREVIATION.strip()]
    )


def validate_all(data: List[ProcurementShopData]) -> bool:
    """
    Validate a list of ProcurementShopData instances.

    :param data: The list of ProcurementShopData instances to validate.
    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: ProcurementShopData, sys_user: User, session: Session) -> None:
    """
    Create and persist the ProcurementShop and ProcurementShopFee models.

    :param data: The ProcurementShopData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    :return: None
    """
    logger.debug(f"Creating models for {data}")

    try:
        # Check if the shop already exists
        existing_shop = session.execute(
            select(ProcurementShop).where(ProcurementShop.name == data.NAME, ProcurementShop.abbr == data.ABBREVIATION)
        ).scalar_one_or_none()

        if existing_shop:
            shop = existing_shop
        else:
            shop = ProcurementShop(
                name=data.NAME, abbr=data.ABBREVIATION, created_by=sys_user.id, updated_by=sys_user.id
            )
            session.add(shop)
            session.flush()  # To get the ID for the shop

        # Create the fee entry if fee data exists
        # Check if a fee with the same date range already exists
        existing_fee = session.execute(
            select(ProcurementShopFee).where(
                ProcurementShopFee.procurement_shop_id == shop.id,
                ProcurementShopFee.start_date == data.START_DATE,
                ProcurementShopFee.end_date == data.END_DATE,
            )
        ).scalar_one_or_none()

        if not existing_fee:
            # Create the fee entry if no duplicate exists
            fee = ProcurementShopFee(
                procurement_shop_id=shop.id,
                fee=data.FEE,
                start_date=data.START_DATE,
                end_date=data.END_DATE,
                created_by=sys_user.id,
                updated_by=sys_user.id,
            )
            session.add(fee)
            logger.info(
                f"Added new fee {data.FEE} for shop {shop.name} with date range: {data.START_DATE} to {data.END_DATE}"
            )
        elif existing_fee.fee != data.FEE:
            # Update the fee if it's different
            existing_fee.fee = data.FEE
            existing_fee.updated_by = sys_user.id
            logger.info(
                f"Updated fee to {data.FEE} for shop {shop.name} with date range: {data.START_DATE} to {data.END_DATE}"
            )
        else:
            logger.info(
                f"Fee already exists for shop {shop.name} with date range: {data.START_DATE} to {data.END_DATE}"
            )
        # session.add(fee)
        session.commit()

    except Exception as e:
        logger.error(f"Error creating models for {data}: {e}")
        session.rollback()
        raise e


def create_all_models(data: List[ProcurementShopData], sys_user: User, session: Session) -> None:
    """
    Convert a list of ProcurementShopData instances to models and persist them.

    :param data: The list of ProcurementShopData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    :return: None
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_procurement_shop_data(data: List[dict]) -> List[ProcurementShopData]:
    """
    Convert a list of dictionaries to a list of ProcurementShopData instances.

    :param data: The list of dictionaries to convert.
    :return: A list of ProcurementShopData instances.
    """
    return [create_procurement_shop_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the TSV file and persist the models to the database.

    :param data: The data from the TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.
    :return: None
    """
    if not data or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    procurement_shop_data = create_all_procurement_shop_data(list(data))
    logger.info(f"Created {len(procurement_shop_data)} Procurement Shop data instances.")

    if not validate_all(procurement_shop_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(procurement_shop_data, sys_user, session)
    logger.info("Finished loading procurement shop models.")
