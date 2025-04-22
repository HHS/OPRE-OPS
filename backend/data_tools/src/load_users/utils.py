from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Division, OpsEvent, OpsEventStatus, OpsEventType, Role, User, UserStatus


@dataclass
class UserData:
    """
    Dataclass to represent a User data row.
    """

    EMAIL: str
    SYS_USER_ID: Optional[int] = field(default=None)
    DIVISION: Optional[str] = field(default=None)
    STATUS: Optional[str] = field(default=None)
    ROLES: Optional[list[str]] = field(default=None)
    FIRST_NAME: Optional[str] = field(default=None)
    LAST_NAME: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.EMAIL:
            raise ValueError("EMAIL is required.")

        self.SYS_USER_ID = int(self.SYS_USER_ID) if self.SYS_USER_ID else None
        self.EMAIL = str(self.EMAIL)
        self.DIVISION = str(self.DIVISION)
        self.STATUS = str(self.STATUS)
        self.ROLES = [str(r).strip() for r in self.ROLES.split(",")] if self.ROLES else []
        self.FIRST_NAME = str(self.FIRST_NAME) if self.FIRST_NAME else None
        self.LAST_NAME = str(self.LAST_NAME) if self.LAST_NAME else None


def create_user_data(data: dict) -> UserData:
    """
    Convert a dictionary to a UserData dataclass instance.

    :param data: The dictionary to convert.

    :return: A UserData dataclass instance.
    """
    return UserData(**data)


def validate_data(data: UserData) -> bool:
    """
    Validate the data in a UserData instance.

    :param data: The UserData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.EMAIL is not None,
        ]
    )


def validate_all(data: List[UserData]) -> bool:
    """
    Validate a list of UserData instances.

    :param data: The list of UserData instances to validate.

    :return: A list of valid UserData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(
    data: UserData, sys_user: User, session: Session, roles: List[Role], divisions: List[Division]
) -> None:
    """
    Create and persist the User and UserRole models.

    :param data: The CanData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    """
    logger.debug(f"Creating models for {data}")

    try:
        if not data or not sys_user or not session or not roles or not divisions:
            raise ValueError(f"Arguments are invalid. {data}, {sys_user}, {session}, {roles}, {divisions}")

        existing_user = session.get(User, data.SYS_USER_ID)

        user = User(
            id=data.SYS_USER_ID if data.SYS_USER_ID else None,
            email=data.EMAIL,
            status=UserStatus[data.STATUS],
            created_by=sys_user.id,
        )

        user.roles = [r for r in roles if r.name in data.ROLES]
        division = next((d for d in divisions if d.abbreviation == data.DIVISION), None)
        user.division = division.id if division else None

        if (not existing_user and data.FIRST_NAME) or (
            existing_user and not existing_user.first_name and data.FIRST_NAME
        ):
            user.first_name = data.FIRST_NAME
        if (not existing_user and data.LAST_NAME) or (existing_user and not existing_user.last_name and data.LAST_NAME):
            user.last_name = data.LAST_NAME

        session.merge(user)
        session.commit()

        ops_event = OpsEvent(
            event_type=OpsEventType.CREATE_USER,
            event_status=OpsEventStatus.SUCCESS,
            created_by=sys_user.id,
            event_details={"user_id": user.id, "message": f"Upserted user {user.email}"},
        )
        session.add(ops_event)
        session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(
    data: List[UserData], sys_user: User, session: Session, roles: List[Role], divisions: List[Division]
) -> None:
    """
    Convert a list of UserData instances to a list of BaseModel instances.

    :param data: The list of UserData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.
    :param roles: The list of roles to use.
    :param divisions: The list of divisions to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session, roles, divisions)


def create_all_user_data(data: List[dict]) -> List[UserData]:
    """
    Convert a list of dictionaries to a list of UserData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of UserData instances.
    """
    return [create_user_data(d) for d in data]


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the CSV file and persist the models to the database.

    :param data: The data from the CSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.

    :return: None
    """
    roles = list(session.execute(select(Role)).scalars().all())
    logger.info(f"Retrieved {len(roles)} roles.")

    divisions = list(session.execute(select(Division)).scalars().all())
    logger.info(f"Retrieved {len(divisions)} divisions.")

    if not data or not roles or not divisions or not session or not sys_user:
        logger.error("No data to process. Exiting.")
        raise RuntimeError("No data to process.")

    user_data = create_all_user_data(list(data))
    logger.info(f"Created {len(user_data)} UserData instances.")

    if not validate_all(user_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(user_data, sys_user, session, roles, divisions)
    logger.info("Finished loading models.")
