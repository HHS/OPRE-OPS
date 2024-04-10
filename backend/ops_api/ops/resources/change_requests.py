import copy
from datetime import datetime

from flask import current_app

from models import BudgetLineItem, BudgetLineItemChangeRequest, BudgetLineItemStatus, ChangeRequest
from ops_api.ops.resources import budget_line_items
from ops_api.ops.utils.api_helpers import convert_date_strings_to_dates


def approve_change_request(change_request_id: int, user_id: int) -> ChangeRequest:
    session = current_app.db_session
    change_request = session.get(ChangeRequest, change_request_id)
    change_request.approved_by_id = user_id
    change_request.approved_on = datetime.now()

    if isinstance(change_request, BudgetLineItemChangeRequest):
        print("~~~BudgetLineItemChangeRequest~~~")
        budget_line_item = session.get(BudgetLineItem, change_request.budget_line_item_id)
        # need to copy to avoid changing the original data in the change request and triggering and update
        data = copy.deepcopy(change_request.requested_changes)
        # why do we load then dump, then convert strings back to dates? could we not just load?
        # for now, we need to convert date strings to dates before updating the data
        data = convert_date_strings_to_dates(data)
        data["status"] = BudgetLineItemStatus[data["status"]]
        data.pop("created_on", None)
        data.pop("updated_on", None)
        print(f"~~~data~~~\n{data}")
        budget_line_items.update_data(budget_line_item, data)
        session.add(budget_line_item)

    # if change_request.type == "budget_line_item_change_request":
    #     print("~~~budget_line_item_change_request~~~")

    session.add(change_request)
    session.commit()
    return change_request


# TODO: approval endpoint
