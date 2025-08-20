from typing import Any

from flask import current_app
from sqlalchemy import inspect

from models import CAN, AgreementType, BudgetLineItem, BudgetLineItemStatus, Division, Portfolio


def get_division_for_budget_line_item(bli_id: int):
    division = (
        current_app.db_session.query(Division)
        .join(Portfolio, Division.id == Portfolio.division_id)
        .join(CAN, Portfolio.id == CAN.portfolio_id)
        .join(BudgetLineItem, CAN.id == BudgetLineItem.can_id)
        .filter(BudgetLineItem.id == bli_id)
        .one_or_none()
    )
    return division


def convert_BLI_status_name_to_pretty_string(status_name):
    if status_name == "DRAFT":
        return BudgetLineItemStatus.DRAFT.__str__()
    elif status_name == "PLANNED":
        return BudgetLineItemStatus.PLANNED.__str__()
    elif status_name == "IN_EXECUTION":
        return BudgetLineItemStatus.IN_EXECUTION.__str__()
    elif status_name == "OBLIGATED":
        return BudgetLineItemStatus.OBLIGATED.__str__()
    else:
        return BudgetLineItemStatus.DRAFT.__str__()


def update_data(budget_line_item: BudgetLineItem, data: dict[str, Any]) -> None:
    for item in data:
        if item in [c_attr.key for c_attr in inspect(budget_line_item).mapper.column_attrs]:
            setattr(budget_line_item, item, data[item])


def create_budget_line_item_instance(agreement_type: AgreementType, data: dict[str, Any]) -> BudgetLineItem:
    """
    Create a specific BudgetLineItem instance based on the agreement type using the factory pattern.

    Args:
        agreement_type: The type of agreement
        data: Dictionary containing the data for the budget line item

    Returns:
        A BudgetLineItem instance of the appropriate subclass

    Raises:
        ValueError: If the agreement type is not supported
    """
    # Automatically build factories by inspecting subclasses of BudgetLineItem
    budget_line_item_factories = {}
    for subclass in BudgetLineItem.__subclasses__():
        # Get the polymorphic identity from the __mapper_args__ if it exists
        if hasattr(subclass, "__mapper_args__") and "polymorphic_identity" in subclass.__mapper_args__:
            identity = subclass.__mapper_args__["polymorphic_identity"]
            if isinstance(identity, AgreementType):
                budget_line_item_factories[identity] = subclass

    factory = budget_line_item_factories.get(agreement_type)
    if not factory:
        raise ValueError(f"Unsupported agreement type: {agreement_type}")

    return factory(**data)
