import copy
from datetime import datetime

import marshmallow_dataclass as mmdc
from flask import current_app

from models import BudgetLineItem, BudgetLineItemChangeRequest, ChangeRequest
from ops_api.ops.resources import budget_line_items
from ops_api.ops.resources.budget_line_items import validate_and_prepare_change_data
from ops_api.ops.schemas.budget_line_items import PATCHRequestBody


def approve_change_request(change_request_id: int, user_id: int) -> ChangeRequest:
    session = current_app.db_session
    change_request = session.get(ChangeRequest, change_request_id)
    change_request.reviewed_by_id = user_id
    change_request.reviewed_on = datetime.now()

    if isinstance(change_request, BudgetLineItemChangeRequest):
        print("~~~BudgetLineItemChangeRequest~~~")
        budget_line_item = session.get(BudgetLineItem, change_request.budget_line_item_id)
        # need to copy to avoid changing the original data in the ChangeRequest and triggering an update
        data = copy.deepcopy(change_request.requested_changes)
        print(f"~~~data~~~\n{data}")
        schema = mmdc.class_schema(PATCHRequestBody)()
        schema.context["id"] = change_request.budget_line_item_id
        schema.context["method"] = "PATCH"

        change_data = validate_and_prepare_change_data(
            data,
            budget_line_item,
            schema,
            ["id", "status", "agreement_id"],
            partial=False,
        )

        budget_line_items.update_data(budget_line_item, change_data)
        session.add(budget_line_item)

    # if change_request.type == "budget_line_item_change_request":
    #     print("~~~budget_line_item_change_request~~~")

    session.add(change_request)
    session.commit()
    return change_request


# TODO: approval endpoint
