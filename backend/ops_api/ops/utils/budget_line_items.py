from flask import current_app

from models import CAN, BudgetLineItem, Division, Portfolio


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
