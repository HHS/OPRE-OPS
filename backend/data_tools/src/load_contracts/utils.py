import os
from csv import DictReader
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import AcquisitionType, ContractAgreement, ContractType, ProductServiceCode, User


@dataclass
class ContractData:
    """
    Dataclass to represent a Contract data row.
    """

    CONTRACT_NAME: str
    SYS_CONTRACT_ID: Optional[int] = field(default=None)
    SYS_PROJECT_ID: Optional[int] = field(default=None)
    SYS_VENDOR_ID: Optional[int] = field(default=None)
    CONTRACT_NBR: Optional[str] = field(default=None)
    TASK_ORDER_NBR: Optional[str] = field(default=None)
    PO_NBR: Optional[str] = field(default=None)
    ACQUISITION_TYPE: Optional[AcquisitionType] = field(default=None)
    PSC_CODE: Optional[str] = field(default=None)
    CONTRACT_TYPE: Optional[ContractType] = field(default=None)
    CONTRACT_START_DATE: Optional[date] = field(default=None)
    CONTRACT_END_DATE: Optional[date] = field(default=None)
    PSC_CONTRACT_SPECIALIST: Optional[str] = field(default=None)
    OPRE_COTR: Optional[int] = field(default=None)
    OPRE_PROJECT_OFFICER: Optional[int] = field(default=None)

    def __post_init__(self):
        if not self.CONTRACT_NAME:
            raise ValueError("CONTRACT_NAME is required.")

        self.CONTRACT_NAME = self.CONTRACT_NAME.strip()
        self.SYS_CONTRACT_ID = int(self.SYS_CONTRACT_ID) if self.SYS_CONTRACT_ID else None
        self.SYS_PROJECT_ID = int(self.SYS_PROJECT_ID) if self.SYS_PROJECT_ID else None
        self.SYS_VENDOR_ID = int(self.SYS_VENDOR_ID) if self.SYS_VENDOR_ID else None
        self.CONTRACT_NBR = self.CONTRACT_NBR.strip() if self.CONTRACT_NBR else None
        self.TASK_ORDER_NBR = self.TASK_ORDER_NBR.strip() if self.TASK_ORDER_NBR else None
        self.PO_NBR = self.PO_NBR.strip() if self.PO_NBR else None
        self.ACQUISITION_TYPE = AcquisitionType[self.ACQUISITION_TYPE.strip()] if self.ACQUISITION_TYPE else None
        self.PSC_CODE = self.PSC_CODE.strip() if self.PSC_CODE else None
        self.CONTRACT_TYPE = ContractType[self.CONTRACT_TYPE.strip()] if self.CONTRACT_TYPE else None
        self.CONTRACT_START_DATE = (
            datetime.strptime(self.CONTRACT_START_DATE, "%Y-%m-%d %H:%M:%S").date()
            if self.CONTRACT_START_DATE
            else None
        )
        self.CONTRACT_END_DATE = (
            datetime.strptime(self.CONTRACT_END_DATE, "%Y-%m-%d %H:%M:%S").date() if self.CONTRACT_END_DATE else None
        )
        self.PSC_CONTRACT_SPECIALIST = self.PSC_CONTRACT_SPECIALIST.strip() if self.PSC_CONTRACT_SPECIALIST else None
        self.OPRE_COTR = int(self.OPRE_COTR) if self.OPRE_COTR else None
        self.OPRE_PROJECT_OFFICER = int(self.OPRE_PROJECT_OFFICER) if self.OPRE_PROJECT_OFFICER else None


def create_contract_data(data: dict) -> ContractData:
    """
    Convert a dictionary to a ContractData dataclass instance.

    :param data: The dictionary to convert.

    :return: A ContractData dataclass instance.
    """
    return ContractData(**data)


def validate_data(data: ContractData) -> bool:
    """
    Validate the data in a ContractData instance.

    :param data: The ContractData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.CONTRACT_NAME is not None,
        ]
    )


def validate_all(data: List[ContractData]) -> bool:
    """
    Validate a list of ContractData instances.

    :param data: The list of ContractData instances to validate.

    :return: A list of valid ContractData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: ContractData, sys_user: User, session: Session) -> None:
    """
    Create and persist the ContractAgreement models.

    :param data: The ContractData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    psc = session.execute(
        select(ProductServiceCode).where(ProductServiceCode.naics == data.PSC_CODE)
    ).scalar_one_or_none()

    try:
        contract = ContractAgreement(
            name=data.CONTRACT_NAME,
            maps_sys_id=data.SYS_CONTRACT_ID,
            contract_number=data.CONTRACT_NBR,
            project_id=data.SYS_PROJECT_ID,
            vendor_id=data.SYS_VENDOR_ID,
            task_order_number=data.TASK_ORDER_NBR,
            po_number=data.PO_NBR,
            acquisition_type=data.ACQUISITION_TYPE,
            product_service_code_id=psc.id if psc else None,
            project_officer_id=data.OPRE_PROJECT_OFFICER,
            start_date=data.CONTRACT_START_DATE,
            end_date=data.CONTRACT_END_DATE,
            contract_type=data.CONTRACT_TYPE,
            psc_contract_specialist=data.PSC_CONTRACT_SPECIALIST,
            cotr_id=data.OPRE_COTR,
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )

        existing_contract = session.execute(
            select(ContractAgreement).where(ContractAgreement.maps_sys_id == data.SYS_CONTRACT_ID)
        ).scalar_one_or_none()

        if existing_contract:
            contract.id = existing_contract.id
            contract.created_on = existing_contract.created_on
            contract.created_by = existing_contract.created_by

        logger.info(f"Created ContractAgreement model for {contract.to_dict()}")

        session.merge(contract)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[ContractData], sys_user: User, session: Session) -> None:
    """
    Convert a list of ContractData instances to a list of BaseModel instances.

    :param data: The list of ContractData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_contract_data(data: List[dict]) -> List[ContractData]:
    """
    Convert a list of dictionaries to a list of ContractData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of ContractData instances.
    """
    return [create_contract_data(d) for d in data]


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

    contract_data = create_all_contract_data(list(data))
    logger.info(f"Created {len(contract_data)} Contract data instances.")

    if not validate_all(contract_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(contract_data, sys_user, session)
    logger.info("Finished loading models.")
