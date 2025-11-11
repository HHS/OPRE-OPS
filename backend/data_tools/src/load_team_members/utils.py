from csv import DictReader
from dataclasses import dataclass
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from data_tools.src.common.utils import get_cig_type_mapping
from models import Agreement, AgreementType, OpsEvent, OpsEventStatus, OpsEventType, User


@dataclass
class TeamMemberData:
    """
    Dataclass to represent a Agreement Team Member data row.
    """

    MAPS_ID: Optional[int] = None
    CIG_TYPE: Optional[str] = None
    TITLE: Optional[str] = None
    DIVISION: Optional[str] = None
    PO: Optional[str] = None
    ALTERNATE_PO: Optional[str] = None
    TEAM_MEMBERS: Optional[list[str]] = None
    NOTES: Optional[str] = None

    def __post_init__(self):
        if (not self.TITLE or not self.CIG_TYPE) and (not self.MAPS_ID or not self.CIG_TYPE):
            raise ValueError("Either MAPS_ID or TITLE and CIG_TYPE must be provided.")

        self.MAPS_ID = int(self.MAPS_ID) if self.MAPS_ID else None
        self.CIG_TYPE = str(self.CIG_TYPE).strip() if self.CIG_TYPE else None
        self.TITLE = str(self.TITLE) if self.TITLE else None
        self.DIVISION = str(self.DIVISION) if self.DIVISION else None
        self.PO = str(self.PO).strip() if self.PO else None
        self.ALTERNATE_PO = str(self.ALTERNATE_PO).strip() if self.ALTERNATE_PO else None
        self.TEAM_MEMBERS = [str(m).strip() for m in self.TEAM_MEMBERS.split(",")] if self.TEAM_MEMBERS else []
        self.NOTES = str(self.NOTES) if self.NOTES else None


def create_team_member_data(data: dict) -> TeamMemberData:
    """
    Convert a dictionary to a TeamMemberData dataclass instance.

    :param data: The dictionary to convert.

    :return: A TeamMemberData dataclass instance.
    """
    return TeamMemberData(**data)


def validate_data(data: TeamMemberData) -> bool:
    """
    Validate the data in a TeamMemberData instance.

    :param data: The TeamMemberData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    # Either MAPS_ID or TITLE should be present
    return (data.MAPS_ID is not None and data.CIG_TYPE is not None) or (
        data.TITLE is not None and data.CIG_TYPE is not None
    )


def validate_all(data: List[TeamMemberData]) -> bool:
    """
    Validate a list of TeamMemberData instances.

    :param data: The list of TeamMemberData instances to validate.

    :return: True if all data is valid, False otherwise.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: TeamMemberData, sys_user: User, session: Session) -> None:
    """
    Create and persist team member associations to agreements.

    :param data: The TeamMemberData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    """
    logger.debug(f"Creating team member associations for {data}")

    if not data or not sys_user or not session:
        raise ValueError(f"Arguments are invalid. {data}, {sys_user}, {session}")

    agreement = None
    if data.MAPS_ID and data.CIG_TYPE:
        agreement = session.execute(
            select(Agreement)
            .where(Agreement.maps_sys_id == data.MAPS_ID)
            .where(Agreement.agreement_type == get_cig_type_mapping()[data.CIG_TYPE])
        ).scalar_one_or_none()
    elif data.TITLE and data.CIG_TYPE:
        agreement = session.execute(
            select(Agreement)
            .where(Agreement.name == data.TITLE)
            .where(Agreement.agreement_type == get_cig_type_mapping()[data.CIG_TYPE])
        ).scalar_one_or_none()

    if not agreement:
        logger.warning(f"Agreement not found for MAPS_ID {data.MAPS_ID}, TITLE {data.TITLE}, CIG_TYPE {data.CIG_TYPE}")
        return

    # Set project officer if provided
    if data.PO:
        po_user = session.execute(select(User).where(User.email.ilike(data.PO))).scalar_one_or_none()

        if po_user:
            agreement.project_officer_id = po_user.id
        else:
            logger.warning(f"Project officer with email {data.PO} not found")

    # Set alternate project officer if provided
    if data.ALTERNATE_PO:
        alt_po_user = session.execute(select(User).where(User.email.ilike(data.ALTERNATE_PO))).scalar_one_or_none()

        if alt_po_user:
            agreement.alternate_project_officer_id = alt_po_user.id
        else:
            logger.warning(f"Alternate project officer with email {data.ALTERNATE_PO} not found")

    # Clear existing team members to rebuild
    agreement.team_members = []

    # Add team members
    for member_email in data.TEAM_MEMBERS:
        if not member_email.strip():
            continue

        user = session.execute(select(User).where(User.email.ilike(member_email))).scalar_one_or_none()

        if user:
            agreement.team_members.append(user)
        else:
            logger.warning(f"Team member with email {member_email} not found")

    session.merge(agreement)

    ops_event = OpsEvent(
        event_type=OpsEventType.UPDATE_AGREEMENT,
        event_status=OpsEventStatus.SUCCESS,
        created_by=sys_user.id,
        event_details={"agreement_id": agreement.id, "message": f"Updated agreement team for {agreement.name}"},
    )
    session.add(ops_event)
    session.commit()


def create_all_models(data: List[TeamMemberData], sys_user: User, session: Session) -> None:
    """
    Process a list of TeamMemberData instances.

    :param data: The list of TeamMemberData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_team_member_data(data: List[dict]) -> List[TeamMemberData]:
    """
    Convert a list of dictionaries to a list of TeamMemberData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of TeamMemberData instances.
    """
    return [create_team_member_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV/TSV file and persist the models to the database.

    :param data: The data from the CSV/TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.

    :return: None
    """
    if not data or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    team_member_data = create_all_team_member_data(list(data))
    logger.info(f"Created {len(team_member_data)} TeamMemberData instances.")

    if not validate_all(team_member_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(team_member_data, sys_user, session)
    logger.info("Finished loading team member associations.")
