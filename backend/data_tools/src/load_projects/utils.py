from csv import DictReader
from dataclasses import dataclass, field
from typing import List, Optional

from loguru import logger
from sqlalchemy.orm import Session

from models import AdministrativeAndSupportProject, ProjectType, ResearchProject, User


@dataclass
class ProjectData:
    """
    Dataclass to represent a Project data row.
    """

    PROJECT_TITLE: str
    PROJECT_TYPE: str
    SYS_PROJECT_ID: Optional[int] = field(default=None)
    PROJECT_SHORT_TITLE: Optional[str] = field(default=None)
    PROJECT_DESCRIPTION: Optional[str] = field(default=None)

    def __post_init__(self):
        if not self.PROJECT_TITLE or not self.PROJECT_TYPE:
            raise ValueError("Project title and type are required.")

        self.SYS_PROJECT_ID = int(self.SYS_PROJECT_ID) if self.SYS_PROJECT_ID else None
        self.PROJECT_TITLE = str(self.PROJECT_TITLE)
        self.PROJECT_TYPE = str(self.PROJECT_TYPE)
        self.PROJECT_SHORT_TITLE = str(self.PROJECT_SHORT_TITLE) if self.PROJECT_SHORT_TITLE else None
        self.PROJECT_DESCRIPTION = str(self.PROJECT_DESCRIPTION) if self.PROJECT_DESCRIPTION else None


def create_project_data(data: dict) -> ProjectData:
    """
    Convert a dictionary to a ProjectData dataclass instance.

    :param data: The dictionary to convert.

    :return: A ProjectData dataclass instance.
    """
    return ProjectData(**data)


def validate_data(data: ProjectData) -> bool:
    """
    Validate the data in a ProjectData instance.

    :param data: The ProjectData instance to validate.

    :return: True if the data is valid, False otherwise.
    """
    return all(
        [
            data.PROJECT_TITLE is not None,
            data.PROJECT_TYPE is not None,
        ]
    )


def validate_all(data: List[ProjectData]) -> bool:
    """
    Validate a list of ProjectData instances.

    :param data: The list of ProjectData instances to validate.

    :return: A list of valid ProjectData instances.
    """
    return sum(1 for d in data if validate_data(d)) == len(data)


def create_models(data: ProjectData, sys_user: User, session: Session) -> None:
    """
    Create and persist the Project model.

    :param data: The ProjectData instance to convert.
    :param sys_user: The system user to use.
    :param session: The database session to use.

    :return: A list of BaseModel instances.
    """
    logger.debug(f"Creating models for {data}")

    try:
        if data.PROJECT_TYPE == "RESEARCH":
            project = ResearchProject(
                id=data.SYS_PROJECT_ID,
                project_type=ProjectType.RESEARCH,
                title=data.PROJECT_TITLE,
                short_title=data.PROJECT_SHORT_TITLE,
                description=data.PROJECT_DESCRIPTION,
                created_by=sys_user.id,
            )
        else:
            project = AdministrativeAndSupportProject(
                id=data.SYS_PROJECT_ID,
                project_type=ProjectType.ADMINISTRATIVE_AND_SUPPORT,
                title=data.PROJECT_TITLE,
                short_title=data.PROJECT_SHORT_TITLE,
                description=data.PROJECT_DESCRIPTION,
                created_by=sys_user.id,
            )
        session.merge(project)
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

    project_data = create_all_project_data(list(data))
    logger.info(f"Created {len(project_data)} Project data instances.")

    if not validate_all(project_data):
        logger.error("Validation failed. Exiting.")
        raise RuntimeError("Validation failed.")

    logger.info("Data validation passed.")

    create_all_models(project_data, sys_user, session)
    logger.info("Finished loading models.")
