from flask import current_app

from models import CAN, BudgetLineItem, BudgetLineItemStatus, Division, Portfolio


def get_division_for_budget_line_item(bli_id: int):
    division = (
        current_app.db_session.query(Division)
        .join(Portfolio, Division.id == Portfolio.division_id)
        .join(CAN, Portfolio.id == CAN.managing_portfolio_id)
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
