from flask import Response, current_app, request
from sqlalchemy import select

from models import (
    Agreement,
    AgreementChangeRequest,
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
from ops_api.ops.base_views import BaseListAPI
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


def find_target_display_name(ops_db_hist: OpsDBHistory):
    if ops_db_hist.class_name in change_request_class_names:
        requested_change_info = ops_db_hist.event_details.get("requested_change_info", None)
        if requested_change_info and "target_display_name" in requested_change_info:
            return requested_change_info.get("target_display_name")
        else:
            if ops_db_hist.class_name == BudgetLineItemChangeRequest.__name__:
                return f"BL {ops_db_hist.event_details.get('budget_line_item_id')}"
            elif ops_db_hist.class_name == AgreementChangeRequest.__name__:
                return f"Agreement#{ops_db_hist.event_details.get('agreement_id')}"
    return ops_db_hist.event_details.get("display_name", None)


def build_agreement_history_dict(ops_db_hist: OpsDBHistory):
    created_by_user_full_name = ops_db_hist.created_by_user.full_name if ops_db_hist.created_by_user else None
    event_type = ops_db_hist.event_type.name
    changes = ops_db_hist.changes
    target_class_name = ops_db_hist.class_name
    target_display_name = find_target_display_name(ops_db_hist)
    if ops_db_hist.class_name in change_request_class_names:
        event_type = ops_db_hist.event_details.get("status", None)
        changes = ops_db_hist.event_details.get("requested_change_diff", None)
        target_class_name = (
            BudgetLineItem.__name__
            if ops_db_hist.class_name == BudgetLineItemChangeRequest.__name__
            else Agreement.__name__
        )

    # TODO: After reworking the UI to use log_items, include just what's needed instead of the full to_dict()
    d = ops_db_hist.to_dict()
    d["created_by_user_full_name"] = created_by_user_full_name
    d["event_type"] = event_type
    d["changes"] = changes
    d["target_display_name"] = target_display_name

    # break down changes into log items which can be used to render a history log in the UI
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
                "scope": "OBJECT",
                "event_class_name": ops_db_hist.class_name,
                "target_class_name": target_class_name,
                "target_display_name": target_display_name,
                "event_type": event_type,
                "created_by_user_full_name": created_by_user_full_name,
                "created_on": ops_db_hist.created_on.isoformat(),
            }
        )
    elif changes:  # if UPDATED or a ChangeRequest create log items per property change and per collection item change
        for key, change in changes.items():
            # hiding changes with proc_shop_fee_percentage which seem confusing since it's changed by system
            if key == "proc_shop_fee_percentage":
                continue
            if "collection_of" in change:
                for deleted_item in change["added"]:
                    log_item = {
                        "scope": "PROPERTY_COLLECTION_ITEM",
                        "event_class_name": ops_db_hist.class_name,
                        "target_class_name": target_class_name,
                        "target_display_name": target_display_name,
                        "property_key": key,
                        "event_type": event_type,
                        "created_by_user_full_name": created_by_user_full_name,
                        "created_on": ops_db_hist.created_on.isoformat(),
                        "change": {"added": deleted_item},
                    }
                    log_items.append(log_item)
                for deleted_item in change["deleted"]:
                    log_item = {
                        "scope": "PROPERTY_COLLECTION_ITEM",
                        "event_class_name": ops_db_hist.class_name,
                        "target_class_name": target_class_name,
                        "target_display_name": target_display_name,
                        "property_key": key,
                        "event_type": event_type,
                        "created_by_user_full_name": created_by_user_full_name,
                        "created_on": ops_db_hist.created_on.isoformat(),
                        "change": {"deleted": deleted_item},
                    }
                    log_items.append(log_item)
            else:
                log_item = {
                    "scope": "PROPERTY",
                    "event_class_name": ops_db_hist.class_name,
                    "target_class_name": target_class_name,
                    "target_display_name": target_display_name,
                    "property_key": key,
                    "event_type": event_type,
                    "created_by_user_full_name": created_by_user_full_name,
                    "created_on": ops_db_hist.created_on.isoformat(),
                    "change": change,
                }
                log_items.append(log_item)
    d["log_items"] = log_items
    return d


class AgreementHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self, id: int) -> Response:
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        results = find_agreement_histories(id, limit, offset)
        if results:
            response = make_response_with_headers([build_agreement_history_dict(row[0]) for row in results])
        else:
            response = make_response_with_headers({}, 404)
        return response
