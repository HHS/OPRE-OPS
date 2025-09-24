import os
import re
from datetime import date, datetime
from decimal import Decimal
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
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session

from models import (
    AaAgreement,
    AABudgetLineItem,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    DirectAgreement,
    DirectObligationBudgetLineItem,
    GrantAgreement,
    GrantBudgetLineItem,
    IaaAgreement,
    IAABudgetLineItem,
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    ServicesComponent,
    User,
)
from models.utils import generate_events_update

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


def get_agreement_class_from_type(
    agreement_type: AgreementType,
) -> Type[DirectAgreement | IaaAgreement | AaAgreement | GrantAgreement | ContractAgreement]:
    """
    Returns the Agreement class based on the agreement type.
    """
    match agreement_type:
        case AgreementType.CONTRACT:
            return ContractAgreement
        case AgreementType.GRANT:
            return GrantAgreement
        case AgreementType.IAA:
            return IaaAgreement
        case AgreementType.AA:
            return AaAgreement
        case AgreementType.DIRECT_OBLIGATION:
            return DirectAgreement
        case _:
            raise ValueError(f"Unsupported agreement type: {agreement_type}")


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


def convert_budget_line_item_type(budget_line_id: int, new_type: AgreementType, session: Session) -> (
    tuple[
        DirectObligationBudgetLineItem
        | IAABudgetLineItem
        | AABudgetLineItem
        | GrantBudgetLineItem
        | ContractBudgetLineItem,
        type[DirectObligationBudgetLineItem] | None,
    ]
    | None
):
    """
    Converts a budget line item to a new type if it is not already of that type.
    This function retrieves the budget line item by its ID, checks if it already has the correct type,
    and if not, creates a new budget line item of the specified type, copies the attributes from the old item,
    and prepares to delete the old item.

    :param budget_line_id: The ID of the budget line item to convert.
    :param new_type: The new type to convert the budget line item to.
    :param session: The SQLAlchemy session to use for database operations.
    :return: A tuple containing the new budget line item and the old budget line item to be deleted,
    :raises ValueError: If the session is not provided or if the budget line item does not exist.
    """
    budget_line_item = session.get(BudgetLineItem, budget_line_id)

    if not budget_line_item:
        logger.warning(f"No budget line item found for ID {budget_line_id}.")
        return None

    # Check if the budget line item already has the correct type
    if budget_line_item.budget_line_item_type == new_type:
        logger.warning(f"BudgetLineItem {budget_line_id} already has the correct type: {new_type}")
        return None

    attrs = {c.key: getattr(budget_line_item, c.key) for c in inspect(BudgetLineItem).mapper.column_attrs}
    attrs["budget_line_item_type"] = new_type
    logger.info(f"new BL is of type {new_type} and of id {attrs['id']}")

    # Delete the old budget line item using the appropriate subclass and add the new one
    budget_line_item_class = get_bli_class_from_type(budget_line_item.budget_line_item_type)
    budget_line_item_to_delete = session.get(budget_line_item_class, budget_line_id)
    logger.info(
        f"BL to delete is of type {budget_line_item_to_delete.budget_line_item_type} and ID {budget_line_item_to_delete.id}"
    )

    new_budget_line_item = get_bli_class_from_type(new_type)(**attrs)

    return new_budget_line_item, budget_line_item_to_delete


def convert_master_budget_amount_string_to_date(budget_date: str) -> date | None:
    """
    Converts a string representation of a budget date to a date.  The following string formats are supported:
    - MM/DD/YYYY
    - MM-DD-YYYY
    - MM/DD/YY
    - MM-DD-YY
    - YYYY-MM-DD
    """
    if not budget_date:
        return None
    date_formats = ["%m/%d/%Y", "%m-%d-%Y", "%m/%d/%y", "%m-%d-%y", "%Y-%m-%d"]
    for date_format in date_formats:
        try:
            return datetime.strptime(budget_date, date_format).date()
        except ValueError:
            continue
    return None


def calculate_proc_fee_percentage(pro_fee_amount: Decimal, amount: Decimal) -> Optional[float | Decimal]:
    """
    Calculate the procurement shop fee (fractional) percentage.

    :param pro_fee_amount: The procurement shop fee amount.
    :param amount: The budget line item amount.

    :return: The calculated percentage or None if not applicable.
    """
    return round((pro_fee_amount / amount), 5) if amount and pro_fee_amount and amount != 0 else None


def commit_or_rollback(session: Session):
    """
    Commits the current transaction if there are no errors, otherwise rolls back the transaction.

    :param session: The SQLAlchemy session to use for database operations.
    """
    try:
        if os.getenv("DRY_RUN"):
            logger.info("Dry run enabled. Rolling back transaction.")
            session.rollback()
        else:
            session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Transaction failed and was rolled back: {e}")
        raise


def get_bli_status(status: str) -> Optional[BudgetLineItemStatus]:
    """
    Map the status string to the appropriate BudgetLineItemStatus.

    :param status: The status string to map.

    :return: The mapped BudgetLineItemStatus or None if not applicable.
    """
    status_mapping = {
        "obl": BudgetLineItemStatus.OBLIGATED,
        "obligated": BudgetLineItemStatus.OBLIGATED,
        "com": BudgetLineItemStatus.IN_EXECUTION,
        "in_execution": BudgetLineItemStatus.IN_EXECUTION,
        "executing": BudgetLineItemStatus.IN_EXECUTION,
        "planned": BudgetLineItemStatus.PLANNED,
        "draft": BudgetLineItemStatus.DRAFT,
    }

    if status:
        if status.lower().startswith("opre"):
            status = BudgetLineItemStatus.PLANNED
        elif status.lower().startswith("psc"):
            status = BudgetLineItemStatus.IN_EXECUTION
        else:
            status = status_mapping.get(status.lower(), None)
    else:
        status = None
        logger.warning(f"No BudgetLineItemStatus conversion for {status}")

    return status


def get_sc(
    sc_name: str,
    agreement_id: int,
    agreement_class: type[ContractAgreement | GrantAgreement | AaAgreement | IaaAgreement | DirectAgreement],
    session: Session,
    sys_user: User,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ServicesComponent | None:
    """
    Get or create a ServicesComponent based on the provided sc_name and agreement_id.
    :param sc_name: Services Component name.
    :param agreement_id:  Agreement ID.
    :param agreement_class:  Agreement type model.
    :param session:  SQLAlchemy session.
    :param sys_user:  System user performing the operation.
    :param start_date:  Start date.
    :param end_date:  End date.
    :return:
    """
    regex_obj = re.match(r"^(O|OT|OY|OS|OP)?(?:SC)?\s*(\d+)((?:\.\d+)*)(\w*)$", sc_name or "")

    agreement = session.get(agreement_class, agreement_id)

    if not regex_obj or not agreement:
        return None

    is_optional = True if regex_obj.group(1) else False
    sc_number = int(regex_obj.group(2)) if regex_obj.group(2) else None
    sub_component_label = sc_name if regex_obj.group(3) else None

    # check for any trailing alpha characters for the sub_component_label
    if not sub_component_label:
        try:
            sub_component_label = sc_name if regex_obj.group(4) else None
        except IndexError:
            sub_component_label = None

    sc = session.execute(
        select(ServicesComponent)
        .where(ServicesComponent.number == sc_number)
        .where(ServicesComponent.optional == is_optional)
        .where(ServicesComponent.sub_component == sub_component_label)
        .where(ServicesComponent.agreement_id == agreement_id)
    ).scalar_one_or_none()

    original_sc = sc.to_dict() if sc else None
    if not sc:
        sc = ServicesComponent(
            number=sc_number,
            optional=is_optional,
            sub_component=sub_component_label,
            agreement_id=agreement_id,
            description=sc_name,
            period_start=start_date,
            period_end=end_date,
        )
        session.add(
            OpsEvent(
                event_type=OpsEventType.CREATE_SERVICES_COMPONENT,
                event_status=OpsEventStatus.SUCCESS,
                created_by=sys_user.id,
                event_details={
                    "new_sc": sc.to_dict(),
                },
            )
        )
    else:
        sc.period_start = start_date
        sc.period_end = end_date
        update_sc = sc.to_dict()
        updates = generate_events_update(original_sc, update_sc, sc.id, sys_user.id)
        session.add(
            OpsEvent(
                event_type=OpsEventType.UPDATE_SERVICES_COMPONENT,
                event_status=OpsEventStatus.SUCCESS,
                created_by=sys_user.id,
                event_details={
                    "services_component_updates": updates,
                },
            )
        )
    return sc
