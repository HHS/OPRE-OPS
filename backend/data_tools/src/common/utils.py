import re
from typing import Optional, Type
from uuid import UUID

from data_tools.environment.azure import AzureConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.pytest_data_tools import PytestDataToolsConfig
from data_tools.environment.types import DataToolsConfig
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    AABudgetLineItem,
    AgreementType,
    ContractBudgetLineItem,
    DirectObligationBudgetLineItem,
    GrantBudgetLineItem,
    IAABudgetLineItem,
    User,
)

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


def get_cig_type_mapping() -> dict[str, AgreementType]:
    """
    Returns a mapping of CIG_TYPE to AgreementType.
    """
    return {
        "contract": AgreementType.CONTRACT,
        "grant": AgreementType.GRANT,
        "grants": AgreementType.GRANT,
        "direct obligation": AgreementType.DIRECT_OBLIGATION,
        "do": AgreementType.DIRECT_OBLIGATION,
        "iaa": AgreementType.IAA,
        "aa": AgreementType.AA,
    }


def get_bli_class_from_type(
    agreement_type: AgreementType,
) -> Type[
    DirectObligationBudgetLineItem | IAABudgetLineItem | AABudgetLineItem | GrantBudgetLineItem | ContractBudgetLineItem
]:
    """
    Returns the BudgetLineItem class based on the agreement type.
    """
    match agreement_type:
        case AgreementType.CONTRACT:
            return ContractBudgetLineItem
        case AgreementType.GRANT:
            return GrantBudgetLineItem
        case AgreementType.IAA:
            return IAABudgetLineItem
        case AgreementType.AA:
            return AABudgetLineItem
        case AgreementType.DIRECT_OBLIGATION:
            return DirectObligationBudgetLineItem
        case _:
            raise ValueError(f"Unsupported budget line item type: {agreement_type}")


def convert_master_budget_amount_string_to_float(
    budget_amount: str,
) -> float | None:
    """
    Converts a string representation of a budget amount to a float.
    """
    if not budget_amount:
        return None

    try:
        # Remove $, commas, spaces, and negative signs
        cleaned_amount = re.sub(r"[$,\s-]", "", budget_amount)
        return float(cleaned_amount)
    except ValueError:
        return None
