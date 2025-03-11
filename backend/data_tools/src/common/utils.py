from typing import Optional
from uuid import UUID

from data_tools.environment.azure import AzureConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.pytest_data_tools import PytestDataToolsConfig
from data_tools.environment.types import DataToolsConfig
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import User

SYSTEM_ADMIN_OIDC_ID = "00000000-0000-1111-a111-000000000026"
SYSTEM_ADMIN_EMAIL = "system.admin@email.com"


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
        case "pytest_data_tools":
            config = PytestDataToolsConfig()
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

    return user
