from flask import Response, current_app, request
from sqlalchemy import select
from typing_extensions import override

from models import (
    Agreement,
    AgreementOpsDbHistory,
    BudgetLineItem,
    BudgetLineItemChangeRequest,
    ChangeRequest,
    OpsDBHistory,
    OpsDBHistoryType,
)
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI, handle_api_error
from ops_api.ops.utils.api_helpers import get_all_class_names
from ops_api.ops.utils.response import make_response_with_headers

change_request_class_names = get_all_class_names(ChangeRequest)
# budget_line_item_change_request_class_names = get_all_class_names(BudgetLineItemChangeRequest)

# omit_change_details_for = ["description", "notes", "comments"]


def find_agreement_histories(agreement_id, limit=10, offset=0):
    stmt = select(OpsDBHistory).join(
        AgreementOpsDbHistory, OpsDBHistory.id == AgreementOpsDbHistory.ops_db_history_id, isouter=True
    )
    stmt = stmt.where(AgreementOpsDbHistory.agreement_id == agreement_id)
    stmt = stmt.where(
        OpsDBHistory.event_type.in_(
            [
                OpsDBHistoryType.NEW,
                OpsDBHistoryType.UPDATED,
                OpsDBHistoryType.DELETED,
            ]
        )
    )
    stmt = stmt.order_by(OpsDBHistory.created_on.desc())
    stmt = stmt.limit(limit)
    if offset:
        stmt = stmt.offset(int(offset))
    results = current_app.db_session.execute(stmt).all()
    return results


def build_agreement_history_dict(ops_db_hist: OpsDBHistory):
    created_by_user_full_name = ops_db_hist.created_by_user.full_name if ops_db_hist.created_by_user else None
    event_type = ops_db_hist.event_type.name
    changes = ops_db_hist.changes
    target_class_name = ops_db_hist.class_name
    target_display_name = ops_db_hist.event_details.get("display_name", None)
    if ops_db_hist.class_name in change_request_class_names:
        event_type = ops_db_hist.event_details.get("status", None)
        changes = ops_db_hist.event_details.get("requested_change_diff", None)
        target_class_name = (
            BudgetLineItem.__name__
            if ops_db_hist.class_name == BudgetLineItemChangeRequest.__name__
            else Agreement.__name__
        )
        target_display_name = ops_db_hist.event_details.get("requested_change_info", {}).get("target_display_name")

    d = ops_db_hist.to_dict()
    d["created_by_user_full_name"] = created_by_user_full_name
    d["event_type"] = event_type
    d["changes"] = changes
    d["target_display_name"] = target_display_name

    log_items = []
    # if Agreement or BLI and NEW or DELETE create single new log item (object scope
    if (
        ops_db_hist.event_type
        in [
            OpsDBHistoryType.NEW,
            OpsDBHistoryType.DELETED,
        ]
        and ops_db_hist.class_name not in change_request_class_names
    ):
        log_items.append(
            {
                "scope": "object",
                "event_class_name": ops_db_hist.class_name,
                "class_name": ops_db_hist.class_name,
                "target_class_name": target_class_name,
                "event_type": event_type,
                "created_by_user_full_name": created_by_user_full_name,
                "created_on": ops_db_hist.created_on.isoformat(),
            }
        )
    else:  # if UPDATED Agreement or BLI or a ChangeRequest create log items per property change
        for key, change in changes.items():
            log_item = {
                "scope": "property",
                "event_class_name": ops_db_hist.class_name,
                "target_class_name": target_class_name,
                "property_key": key,
                "event_type": event_type,
                "created_by_user_full_name": created_by_user_full_name,
                "created_on": ops_db_hist.created_on.isoformat(),
                "change": change,
            }
            # if "collection_of" in change:
            #     log_item["isCollection"] = True
            log_items.append(log_item)

    d["log_items"] = log_items
    # import json
    # print("\n\n~~~~history-dict~~~~\n\n", json.dumps(d, indent=2))
    return d


class AgreementHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.HISTORY)
    @handle_api_error
    def get(self, id: int) -> Response:
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        results = find_agreement_histories(id, limit, offset)
        if results:
            response = make_response_with_headers([build_agreement_history_dict(row[0]) for row in results])
        else:
            response = make_response_with_headers({}, 404)
        return response
