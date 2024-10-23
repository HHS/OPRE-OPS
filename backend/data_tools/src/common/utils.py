from typing import Optional
from uuid import UUID

import data_tools.src.common.db as db_module
import sqlalchemy
from data_tools.environment.azure import AzureConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.types import DataToolsConfig
from sqlalchemy import Engine, select
from sqlalchemy.orm import Session

from models import BaseModel, User

SYSTEM_ADMIN_OIDC_ID = "00000000-0000-1111-a111-000000000026"
SYSTEM_ADMIN_EMAIL = "system.admin@email.com"

def init_db(
    config: DataToolsConfig, db: Optional[Engine] = None
) -> tuple[sqlalchemy.engine.Engine, sqlalchemy.MetaData]:
    if not db:
        _, engine = db_module.init_db(config.db_connection_string)
    else:
        engine = db
    return engine, BaseModel.metadata


def get_config(environment_name: Optional[str] = None) -> DataToolsConfig:
    match environment_name:
        case "azure":
            config = AzureConfig()
        case "dev":
            config = DevConfig()
        case "local":
            config = LocalConfig()
        case "pytest":
            config = PytestConfig()
        case _:
            config = DevConfig()
    return config

def get_or_create_sys_user(session: Session) -> User:
    """
    Get or create the system user.

    Args:
        session: SQLAlchemy session object
    Returns:
        None
    """
    user = session.execute(select(User).where(User.oidc_id == SYSTEM_ADMIN_OIDC_ID)).scalar_one_or_none()

    if not user:
        user = User(email=SYSTEM_ADMIN_EMAIL, oidc_id=UUID(SYSTEM_ADMIN_OIDC_ID))
        session.add(user)
        session.commit()

    return user
