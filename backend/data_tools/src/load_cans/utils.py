from dataclasses import dataclass, field
from typing import List

from loguru import logger

from models import CAN, BaseModel, CANFundingDetails, CANFundingSource, CANMethodOfTransfer, Portfolio, User


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

def create_models(data: CANData, sys_user: User, portfolio_ref_data: List[Portfolio]) -> List[BaseModel]:
    """
    Convert a CanData instance to a list of BaseModel instances.

    :param data: The CanData instance to convert.
    :param portfolio_ref_data: A list of Portfolio instances to use as reference data.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    models: List[BaseModel] = []
    try:
        portfolio = next(p for p in portfolio_ref_data if p.abbreviation == data.PORTFOLIO)
        if not portfolio:
            raise ValueError(f"Portfolio not found for {data.PORTFOLIO}")

        funding_details = CANFundingDetails(
            fiscal_year=int(data.FUND[6:10]),
            fund_code=data.FUND,
            allowance=data.ALLOWANCE,
            sub_allowance=data.SUB_ALLOWANCE,
            allotment=data.ALLOTMENT_ORG,
            appropriation=data.APPROP_PREFIX + "-" + data.APPROP_YEAR[0:2] + "-" + data.APPROP_POSTFIX,
            method_of_transfer=CANMethodOfTransfer[data.METHOD_OF_TRANSFER],
            funding_source=CANFundingSource[data.FUNDING_SOURCE],
            created_by=sys_user.id,
        )

        can = CAN(
            id=data.SYS_CAN_ID,
            number=data.CAN_NBR,
            description=data.CAN_DESCRIPTION,
            nick_name=data.NICK_NAME,
            created_by=sys_user.id,
        )

        can.funding_details = funding_details
        can.portfolio = portfolio

        models.append(can)
        models.append(funding_details)
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e
    return models

def create_all_models(data: List[CANData], sys_user: User, portfolio_ref_data: List[Portfolio]) -> List[BaseModel]:
    """
    Convert a list of CanData instances to a list of BaseModel instances.

    :param data: The list of CanData instances to convert.
    :param portfolio_ref_data: A list of Portfolio instances to use as reference data.

    :return: A list of BaseModel instances.
    """
    return [m for d in data for m in create_models(d, sys_user, portfolio_ref_data)]

def persist_models(models: List[BaseModel], session) -> None:
    """
    Persist a list of models to the database.

    :param models: The list of models to persist.
    :param session: The database session to use.
    """
    for model in models:
        obj = session.get(type(model), model.id)

        if obj:
            session.merge(model)
        else:
            session.add(model)
    session.commit()
    logger.info(f"Persisted {len(models)} models.")
    return None

def create_all_can_data(data: List[dict]) -> List[CANData]:
    """
    Convert a list of dictionaries to a list of CanData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of CanData instances.
    """
    return [create_can_data(d) for d in data]
