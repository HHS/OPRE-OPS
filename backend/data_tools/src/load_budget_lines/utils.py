from csv import DictReader

from loguru import logger
from sqlalchemy.orm import Session

from models import User


def transform(data: DictReader, session: Session, sys_user: User) -> None:
    """
    Transform the data from the TSV file and persist the models to the database.

    :param data: The data from the TSV file.
    :param session: The database session to use.
    :param sys_user: The system user to use.

    :return: None
    """
    logger.info("transform triggered")
