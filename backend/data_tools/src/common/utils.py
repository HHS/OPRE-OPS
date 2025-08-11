import re
from typing import Optional, Type
from uuid import UUID

from data_tools.environment.azure import AzureConfig
from data_tools.environment.dev import DevConfig
from data_tools.environment.local import LocalConfig
from data_tools.environment.pytest import PytestConfig
from data_tools.environment.pytest_data_tools import PytestDataToolsConfig
from data_tools.environment.types import DataToolsConfig
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from models import (
    AABudgetLineItem,
    AgreementType,
    BudgetLineItem,
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


def convert_budget_line_item_type(id: int, new_type: AgreementType, session: Session) -> BudgetLineItem | None:
    """
    Converts a budget line item to a new type if it is not already of that type.
    This function retrieves the budget line item by its ID, checks if it already has the correct type,
    and if not, creates a new budget line item of the specified type, deletes the old one, and returns the new item.

    :param id: The ID of the budget line item to convert.
    :param new_type: The new type to convert the budget line item to.
    :param session: The SQLAlchemy session to use for database operations.
    :return: The newly created budget line item of the specified type, or None if the item already has the correct type or does not exist.
    :raises ValueError: If the session is not provided or if the budget line item does not exist.
    """
    if not session:
        raise ValueError("Session is required to convert budget line item type.")

    budget_line_item = session.get(BudgetLineItem, id)

    if not budget_line_item:
        logger.warning(f"No budget line item found for ID {id}.")
        return None

    # # Store the original values for the event details
    # original_values = {
    #     "id": budget_line_item.id,
    #     "budget_line_item_type": (
    #         budget_line_item.budget_line_item_type.name if budget_line_item.budget_line_item_type else None
    #     ),
    # }

    # Check if the budget line item already has the correct type
    if budget_line_item.budget_line_item_type == new_type:
        logger.warning(f"BudgetLineItem {id} already has the correct type: {new_type}")
        return None

    # if budget_line_item.agreement and budget_line_item.agreement.agreement_type != new_type:
    #     raise ValueError(
    #         f"BudgetLineItem with SYS_BUDGET_ID {id} has an agreement type of "
    #         f"{budget_line_item.agreement.agreement_type}, but the new type is {new_type}."
    #     )

    # Create a new budget line item with the correct type
    from sqlalchemy.inspection import inspect

    attrs = {c.key: getattr(budget_line_item, c.key) for c in inspect(BudgetLineItem).mapper.column_attrs}
    attrs["budget_line_item_type"] = new_type
    logger.info(f"new BL is of type {new_type} and of id {attrs['id']}")

    # Delete the old budget line item using the appropriate subclass and add the new one
    budget_line_item_class = get_bli_class_from_type(budget_line_item.budget_line_item_type)
    budget_line_item_to_delete = session.get(budget_line_item_class, id)
    logger.info(
        f"BL to delete is of type {budget_line_item_to_delete.budget_line_item_type} and ID {budget_line_item_to_delete.id}"
    )
    session.delete(budget_line_item_to_delete)
    session.commit()
    session.flush()

    new_budget_line_item = get_bli_class_from_type(new_type)(**attrs)
    session.add(new_budget_line_item)

    return new_budget_line_item
