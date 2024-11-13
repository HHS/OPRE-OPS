from csv import DictReader
from dataclasses import dataclass
from typing import List

from loguru import logger
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from models import CAN, CANFundingDetails, CANFundingSource, CANMethodOfTransfer, Portfolio, User


@dataclass
class CANData:
    """
    Dataclass to represent a CAN data row.
    """
    SYS_CAN_ID: int
    CAN_NBR: str
    CAN_DESCRIPTION: str
    FUND: str
    ALLOWANCE: str
    ALLOTMENT_ORG: str
    SUB_ALLOWANCE: str
    CURRENT_FY_FUNDING_YTD: float
    APPROP_PREFIX: str
    APPROP_POSTFIX: str
    APPROP_YEAR: str
    PORTFOLIO: str
    FUNDING_SOURCE: str
    METHOD_OF_TRANSFER: str
    NICK_NAME: str

    def __post_init__(self):
        if not self.CAN_NBR:
            raise ValueError("CAN_NBR is required.")

        self.SYS_CAN_ID = int(self.SYS_CAN_ID) if self.SYS_CAN_ID else None
        self.CAN_NBR = str(self.CAN_NBR)
        self.CAN_DESCRIPTION = str(self.CAN_DESCRIPTION) if self.CAN_DESCRIPTION else None
        self.FUND = str(self.FUND) if self.FUND else None
        self.ALLOWANCE = str(self.ALLOWANCE) if self.ALLOWANCE else None
        self.ALLOTMENT_ORG = str(self.ALLOTMENT_ORG) if self.ALLOTMENT_ORG else None
        self.SUB_ALLOWANCE = str(self.SUB_ALLOWANCE) if self.SUB_ALLOWANCE else None
        self.CURRENT_FY_FUNDING_YTD = float(self.CURRENT_FY_FUNDING_YTD) if self.CURRENT_FY_FUNDING_YTD else None
        self.APPROP_PREFIX = str(self.APPROP_PREFIX) if self.APPROP_PREFIX else None
        self.APPROP_POSTFIX = str(self.APPROP_POSTFIX) if self.APPROP_POSTFIX else None
        self.APPROP_YEAR = str(self.APPROP_YEAR) if self.APPROP_YEAR else None
        self.PORTFOLIO = str(self.PORTFOLIO) if self.PORTFOLIO else None
        self.FUNDING_SOURCE = str(self.FUNDING_SOURCE) if self.FUNDING_SOURCE else None
        self.METHOD_OF_TRANSFER = str(self.METHOD_OF_TRANSFER) if self.METHOD_OF_TRANSFER else None
        self.NICK_NAME = str(self.NICK_NAME) if self.NICK_NAME else None


def create_can_data(data: dict) -> CANData:
    """
    Convert a dictionary to a CanData dataclass instance.

    :param data: The dictionary to convert.

    :return: A CanData dataclass instance.
    """
    return CANData(**data)

def validate_data(data: CANData) -> bool:
    """
    Validate the data in a CanData instance.

    :param data: The CanData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all([
        data.CAN_NBR is not None,
        data.PORTFOLIO is not None,
        data.FUNDING_SOURCE is not None,
        data.METHOD_OF_TRANSFER is not None,
    ])

def validate_all(data: List[CANData]) -> bool:
    """
    Validate a list of CanData instances.

    :param data: The list of CanData instances to validate.

    :return: A list of valid CanData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)

def create_models(data: CANData, sys_user: User, session: Session) -> None:
    """
    Create and persist the CAN and CANFundingDetails models.

    The CANData does not contain a SYS_ID for the CANFundDetails model.
    A check is made to see if the funding details already exist in the database by comparing the fields.
    If the funding details do not exist, a new instance is created and persisted to the database.
    If it does exist, the existing instance is associated with the CAN model.
    This means that the funding details are not duplicated in the database but is also not updated if the data changes.
    The CAN model is upserted, however.

    :param data: The CanData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    try:
        portfolio = session.execute(select(Portfolio).where(Portfolio.abbreviation == data.PORTFOLIO)).scalar_one_or_none()
        if not portfolio:
            raise ValueError(f"Portfolio not found for {data.PORTFOLIO}")

        can = CAN(
            id=data.SYS_CAN_ID if data.SYS_CAN_ID else None,
            number=data.CAN_NBR,
            description=data.CAN_DESCRIPTION,
            nick_name=data.NICK_NAME,
            created_by=sys_user.id,
        )

        can.portfolio = portfolio

        try:
            validate_fund_code(data)
        except ValueError as e:
            logger.info(f"Skipping creating funding details for {data} due to invalid fund code. {e}")

        can.funding_details = get_or_create_funding_details(data, sys_user, session)
        session.merge(can)
        session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def get_or_create_funding_details(data: CANData, sys_user: User, session: Session) -> CANFundingDetails:
    """
    Get or create a CANFundingDetails instance.

    :param data: The CANData instance to use.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A CANFundingDetails instance.
    """
    fiscal_year = int(data.FUND[6:10])
    fund_code = data.FUND
    allowance = data.ALLOWANCE
    sub_allowance = data.SUB_ALLOWANCE
    allotment = data.ALLOTMENT_ORG
    appropriation = "-".join([data.APPROP_PREFIX or "", data.APPROP_YEAR[0:2] or "", data.APPROP_POSTFIX or ""])
    method_of_transfer = CANMethodOfTransfer[data.METHOD_OF_TRANSFER]
    funding_source = CANFundingSource[data.FUNDING_SOURCE]
    existing_funding_details = session.execute(select(CANFundingDetails).where(
        and_(
            CANFundingDetails.fiscal_year == fiscal_year,
            CANFundingDetails.fund_code == fund_code,
            CANFundingDetails.allowance == allowance,
            CANFundingDetails.sub_allowance == sub_allowance,
            CANFundingDetails.allotment == allotment,
            CANFundingDetails.appropriation == appropriation,
            CANFundingDetails.method_of_transfer == method_of_transfer,
            CANFundingDetails.funding_source == funding_source,
        ))).scalar_one_or_none()
    if not existing_funding_details:
        funding_details = CANFundingDetails(
            fiscal_year=fiscal_year,
            fund_code=fund_code,
            allowance=allowance,
            sub_allowance=sub_allowance,
            allotment=allotment,
            appropriation=appropriation,
            method_of_transfer=method_of_transfer,
            funding_source=funding_source,
            created_by=sys_user.id,
        )
        return funding_details
    else:
        return existing_funding_details


def validate_fund_code(data: CANData) -> None:
    """
    Validate the fund code in a CANData instance.

    :param data: The CANData instance to validate.

    :return: None
    :raises ValueError: If the fund code is invalid.
    """
    if len(data.FUND) != 14:
        raise ValueError(f"Invalid fund code length {data.FUND}")
    int(data.FUND[6:10])
    length_of_appropriation = data.FUND[10]
    if length_of_appropriation not in ["0", "1", "5"]:
        raise ValueError(f"Invalid length of appropriation {length_of_appropriation}")
    direct_or_reimbursable = data.FUND[11]
    if direct_or_reimbursable not in ["D", "R"]:
        raise ValueError(f"Invalid direct or reimbursable {direct_or_reimbursable}")
    category = data.FUND[12]
    if category not in ["A", "B", "C"]:
        raise ValueError(f"Invalid category {category}")
    discretionary_or_mandatory = data.FUND[13]
    if discretionary_or_mandatory not in ["D", "M"]:
        raise ValueError(f"Invalid discretionary or mandatory {discretionary_or_mandatory}")


def create_all_models(data: List[CANData], sys_user: User, session: Session) -> None:
    """
    Convert a list of CanData instances to a list of BaseModel instances.

    :param data: The list of CanData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_can_data(data: List[dict]) -> List[CANData]:
    """
    Convert a list of dictionaries to a list of CanData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of CanData instances.
    """
    return [create_can_data(d) for d in data]


def transform(data: DictReader, portfolios: List[Portfolio], session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV file and persist the models to the database.

    :param data: The data from the CSV file.
    :param portfolios: The portfolios to use as reference data.
    :param session: The database session to use.
    :param sys_user: The system user to use.

    :return: None
    """
    if not data or not portfolios or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    can_data = create_all_can_data(list(data))
    logger.info(f"Created {len(can_data)} CAN data instances.")

    if not validate_all(can_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(can_data, sys_user, session)
    logger.info(f"Finished loading models.")
