from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from models import Role, User


@dataclass
class RoleData:
    """
    Dataclass to represent a Role data row.
    """

    ROLE_NAME: str
    ROLE_ID: Optional[int] = field(default=None)
    PERMISSIONS: Optional[list[str]] = field(default=None)

    def __post_init__(self):
        if not self.ROLE_NAME:
            raise ValueError("Role title and type are required.")

        self.ROLE_ID = int(self.ROLE_ID) if self.ROLE_ID else None
        self.ROLE_NAME = str(self.ROLE_NAME)
        self.PERMISSIONS = [str(p).strip() for p in self.PERMISSIONS.split(",")] if self.PERMISSIONS else []


def create_role_data(data: dict) -> RoleData:
    """
    Convert a dictionary to a RoleData dataclass instance.

    :param data: The dictionary to convert.

    :return: A RoleData dataclass instance.
    """
    return RoleData(**data)


def validate_data(data: RoleData) -> bool:
    """
    Validate the data in a RoleData instance.

    :param data: The RoleData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.ROLE_NAME is not None,
        ]
    )


def validate_all(data: List[RoleData]) -> bool:
    """
    Validate a list of RoleData instances.

    :param data: The list of RoleData instances to validate.

    :return: A list of valid RoleData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: RoleData, sys_user: User, session: Session) -> None:
    """
    Create and persist the Role model.

    :param data: The RoleData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    try:
        role = Role(
            id=data.ROLE_ID,
            name=data.ROLE_NAME,
            permissions=[p for p in RoleData.PERMISSIONS],
            created_by=sys_user.id,
        )
        session.merge(role)
        session.commit()
    except Exception as e:
        logger.error(f"Error creating models for {data}")
        raise e


def create_all_models(data: List[RoleData], sys_user: User, session: Session) -> None:
    """
    Convert a list of RoleData instances to a list of BaseModel instances.

    :param data: The list of RoleData instances to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    for d in data:
        create_models(d, sys_user, session)


def create_all_role_data(data: List[dict]) -> List[RoleData]:
    """
    Convert a list of dictionaries to a list of RoleData instances.

    :param data: The list of dictionaries to convert.

    :return: A list of RoleData instances.
    """
    return [create_role_data(d) for d in data]


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

    role_data = create_all_role_data(list(data))
    logger.info(f"Created {len(role_data)} Role data instances.")

    if not validate_all(role_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(role_data, sys_user, session)
    logger.info("Finished loading models.")
