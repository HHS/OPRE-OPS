from datetime import datetime

from flask import current_app

from models import BudgetLineItem, BudgetLineItemChangeRequest, ChangeRequest
from ops_api.ops.resources import budget_line_items


def approve_change_request(change_request_id: int, user_id: int) -> ChangeRequest:
    session = current_app.db_session
    change_request = session.get(ChangeRequest, change_request_id)
    change_request.approved_by_id = user_id
    change_request.approved_on = datetime.now()

    if isinstance(change_request, BudgetLineItemChangeRequest):
        print("~~~BudgetLineItemChangeRequest~~~")
        budget_line_item = session.get(BudgetLineItem, change_request.budget_line_item_id)
        budget_line_items.update_data(budget_line_item, change_request.requested_changes)
        session.add(budget_line_item)

    # if change_request.type == "budget_line_item_change_request":
    #     print("~~~budget_line_item_change_request~~~")

    session.add(change_request)
    session.commit()
    return change_request
