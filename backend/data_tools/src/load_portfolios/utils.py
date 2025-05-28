import os
from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from backend.ops_api.ops import urls
from loguru import logger
from sqlalchemy.orm import Session

from models import CAN, Division, OpsEvent, Portfolio, PortfolioStatus, PortfolioTeamLeaders, PortfolioUrl, User


@dataclass
class PortfolioData:
    """
    Dataclass to represent a Portfolio data row.
    """

    PORTFOLIO_ID: int
    PORTFOLIO_NAME: str
    DIVISION: str # abbreviation of division
    PORTFOLIO_ABBREVIATION: Optional[str] = None
    CANS: Optional[list[str]] = None
    URL: Optional[str] = None
    DESCRIPTION: Optional[str] = None
    TEAM_LEADERS: Optional[list[int]] = None # looking for their user ID-- not email, name, or anything else

    def __post_init__(self):
        if not self.PORTFOLIO_ID or not self.PORTFOLIO_NAME or not self.DIVISION:
            raise ValueError("An existing portfolio id or the keyword new, a portfolio name, and division acronym are required.")

        self.PORTFOLIO_ID = 0 if self.PORTFOLIO_ID in ["new", "NEW"] else int(self.PORTFOLIO_ID)
        self.PORTFOLIO_NAME = str(self.PORTFOLIO_NAME)
        self.DIVISION = str(self.DIVISION)
        self.PORTFOLIO_ABBREVIATION = str(self.PORTFOLIO_ABBREVIATION) if self.PORTFOLIO_ABBREVIATION else None
        self.CANS = [str(c).strip() for c in self.CANS.split(",")] if self.CANS else []
        self.URL = str(self.URL) if self.URL else None
        self.DESCRIPTION = str(self.DESCRIPTION) if self.DESCRIPTION else ""
        self.TEAM_LEADERS = [int(l) for l in self.TEAM_LEADERS.split(",")] if self.TEAM_LEADERS else []


def create_portfolio_data(data: dict) -> PortfolioData:
    """
    Convert a dictionary to a PortfolioData dataclass instance.

    :param data: The dictionary to convert.

    :return: A PortfolioData dataclass instance.
    """
    return PortfolioData(**data)


def validate_data(data: PortfolioData) -> bool:
    """
    Validate the data in a PortfolioData instance.

    :param data: The PortfolioData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.PORTFOLIO_ID is not None,
            data.PORTFOLIO_NAME is not None,
            data.DIVISION is not None,
        ]
    )


def validate_all(data: List[PortfolioData]) -> bool:
    """
    Validate a list of PortfolioData instances.

    :param data: The list of PortfolioData instances to validate.

    :return: A list of valid PortfolioData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: PortfolioData, sys_user: User, session: Session, divisions: List[Division]) -> None:
    """
    Create and persist the Portfolio model.

    :param data: The PortfolioData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")


    if not data or not sys_user or not session or not divisions:
        raise ValueError(f"Arguments are invalid. {data}, {sys_user}, {session}, {divisions}")

    # if the portfolio id is 0, then we are creating a new portfolio
    # TODO

    # find and validate the CANs owned by the portfolio
    portfolio_cans = None;
    for cn in data.CANS:
        can = session.execute(select(CAN).where(CAN.number == cn)).scalar_one_or_none()

        if not can:
            logger.warning(f"CAN with number {can_number} not found.")
        else:
            portfolio_cans.cans.append(can)

    # find the division by abbreviation
    division = next((d for d in divisions if d.abbreviation == data.DIVISION), None)
    division.id if division else None


    # figure out the user(s) that are team leaders
    ptl = []
    for tl in data.TEAM_LEADERS:
        validated_tl = session.execute(select(User).where(User.id == tl)).scalar_one_or_none()

        if not validated_tl
            logger.warning(f"User with ID {tl} not found.")
        else:
            ptl.append(validated_tl)
            # ptl.append(PortfolioTeamLeaders(portfolio_id=data.PORTFOLIO_ID, team_lead_id=tl))

    try:
        portfolio = Portfolio(
            id=data.PORTFOLIO_ID, # TODO
            name=data.PORTFOLIO_NAME,
            abbreviation=data.PORTFOLIO_ABBREVIATION,
            status=PortfolioStatus.IN_PROCESS,
            cans=portfolio_cans,
            division_id=division.id,
            urls=[PortfolioUrl(url=data.URL)] if data.URL else [],
            description=data.DESCRIPTION,
            team_leaders=ptl # [PortfolioTeamLeaders(portfolio_id=data.PORTFOLIO.ID, team_lead_id=)]   # [session.get(User, tl) for tl in data.TEAM_LEADERS] if data.TEAM_LEADERS else [],
            created_by=sys_user.id,
            updated_by=sys_user.id,
            created_on=datetime.now(),
            updated_on=datetime.now(),
        )
        session.merge(portfolio)

        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()

    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[ProjectData], sys_user: User, session: Session) -> None:
    """
    Convert a list of ProjectData instances to a list of BaseModel instances.

    :param data: The list of ProjectData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_project_data(data: List[dict]) -> List[ProjectData]:
    """
    Convert a list of dictionaries to a list of ProjectData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of ProjectData instances.
    """
    return [create_project_data(d) for d in data]


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

    divisions = list(session.execute(select(Division)).scalars().all())
    logger.info(f"Retrieved {len(divisions)} divisions.")

    project_data = create_all_project_data(list(data))
    logger.info(f"Created {len(project_data)} Project data instances.")

    if not validate_all(project_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(project_data, sys_user, session, divisions)
    logger.info("Finished loading models.")
