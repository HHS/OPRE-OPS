from flask import Response, current_app, request
from sqlalchemy import select
from typing_extensions import override

from models import AgreementOpsDbHistory, ChangeRequest, OpsDBHistory, OpsDBHistoryType
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI, handle_api_error
from ops_api.ops.utils.api_helpers import convert_code_for_display, get_property_label
from ops_api.ops.utils.response import make_response_with_headers


# TODO: move to utility module
def get_all_subclasses(cls):
    all_subclasses = []
    for subclass in cls.__subclasses__():
        all_subclasses.append(subclass)
        all_subclasses.extend(get_all_subclasses(subclass))
    return all_subclasses


change_request_classes = get_all_subclasses(ChangeRequest) + [ChangeRequest]
change_request_class_names = [cls.__name__ for cls in change_request_classes]

relations = {
    "procurement_shop_id": {"eventKey": "procurement_shop"},
    "product_service_code_id": {"eventKey": "product_service_code"},
    "project_id": {"eventKey": "project"},
    "can_id": {"eventKey": "can"},
    "project_officer": {},
}

omit_change_details_for = ["description", "notes", "comments"]


def find_object_title(ops_db_hist: OpsDBHistory):
    return ops_db_hist.event_details["display_name"]


def objects_to_names(objects):
    return [obj["display_name"] for obj in objects]


def prepare_changes(ops_db_hist: OpsDBHistory):
    raw_changes = ops_db_hist.changes
    prepared_changes = []

    for key, change in raw_changes.items():
        # hiding changes with proc_shop_fee_percentage which seem confusing since it's changed by system
        if key in ["proc_shop_fee_percentage"]:
            continue
        prepared_change = {
            "key": key,
            "propertyLabel": get_property_label(ops_db_hist.class_name, key),
            "createdOn": ops_db_hist.created_on.isoformat(),
            "createdByName": ops_db_hist.created_by_user.full_name if ops_db_hist.created_by_user else None,
        }
        if "collection_of" in change:
            prepared_change["isCollection"] = True
            prepared_change["propertyLabel"] = get_property_label(ops_db_hist.class_name, key + "_item")
            prepared_change["added"] = objects_to_names(change["added"])
            prepared_change["deleted"] = objects_to_names(change["deleted"])
        elif key in relations:
            prepared_change["isRelation"] = True
            event_key = relations[key]["eventKey"]
            if event_key:
                prepared_change["propertyLabel"] = get_property_label(ops_db_hist.class_name, event_key)
                prepared_change["to"] = (
                    ops_db_hist.event_details[event_key] if event_key in ops_db_hist.event_details else None
                )
            else:
                prepared_change["toId"] = change["new"]
            prepared_change["fromId"] = change["old"]
        else:
            if key not in omit_change_details_for:
                prepared_change["from"] = change["old"]
                prepared_change["to"] = change["new"]
        prepared_changes.append(prepared_change)

    return prepared_changes


def event_log_title(ops_db_hist: OpsDBHistory):
    class_name = convert_code_for_display("baseClassNameLabels", ops_db_hist.class_name)
    if ops_db_hist.event_type == OpsDBHistoryType.NEW:
        return f"{class_name} Created"
    elif ops_db_hist.event_type == OpsDBHistoryType.UPDATED:
        return f"{class_name} Updated"
    elif ops_db_hist.event_type == OpsDBHistoryType.DELETED:
        return f"{class_name} Deleted"
    return f"{class_name} {ops_db_hist.event_type}"


def event_log_message(ops_db_hist: OpsDBHistory):
    class_label = convert_code_for_display("baseClassNameLabels", ops_db_hist.class_name)
    created_by_name = ops_db_hist.created_by_user.full_name if ops_db_hist.created_by_user else None
    object_display_name = ops_db_hist.event_details.get("display_name", "Unknown")
    if ops_db_hist.event_type == OpsDBHistoryType.NEW:
        if ops_db_hist.class_name == "BudgetLineItem":
            return f"{object_display_name} created by {created_by_name}"
        else:
            return f"{class_label} created by {created_by_name}"
    elif ops_db_hist.event_type == OpsDBHistoryType.UPDATED:
        return f"{class_label} updated by {created_by_name}"
    elif ops_db_hist.event_type == OpsDBHistoryType.DELETED:
        if ops_db_hist.class_name == "BudgetLineItem":
            return f"{object_display_name} deleted by {created_by_name}"
        else:
            return f"{class_label} deleted by {created_by_name}"
    else:
        return f"{class_label} {ops_db_hist.event_type} by {created_by_name}"


def property_log_title(ops_db_hist: OpsDBHistory, change: dict):
    title = f"{change['propertyLabel']} Edited"
    if ops_db_hist.class_name == "BudgetLineItem":
        title = "Budget Line " + title
    return title


def property_log_message(ops_db_hist: OpsDBHistory, change: dict):
    msg = f"{change['propertyLabel']} changed"
    if ops_db_hist.class_name == "BudgetLineItem":
        if change["key"] != "line_description":
            msg = f"{find_object_title(ops_db_hist)} {change['propertyLabel']} changed"
        else:
            msg = f"{change['propertyLabel']} changed"
    rendered_from = change.get("from", None)
    rendered_to = change.get("to", None)
    msg += f" from {rendered_from} to {rendered_to}"
    msg += f" by {ops_db_hist.created_by_user.full_name if ops_db_hist.created_by_user else None}"
    return msg


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
    log_items = []
    d = ops_db_hist.to_dict()
    if ops_db_hist.class_name in change_request_class_names:
        requested_change_diff = ops_db_hist.event_details.get("requested_change_diff", None)
        d["changes"] = requested_change_diff
        d["event_type"] = "UPDATED"  # "UPDATED-REQUEST"
    else:
        # if ops_db_hist.event_type == OpsDBHistoryType.NEW:
        pass
    # TODO: eliminate join to User if possible
    d["created_by_user_full_name"] = ops_db_hist.created_by_user.full_name if ops_db_hist.created_by_user else None
    # d["event_type"] = "UPDATED"

    if ops_db_hist.event_type == OpsDBHistoryType.UPDATED:
        pass

    # if Agreement or BLI and NEW or DELETE create single new log item
    # if ops_db_hist.class_name in ["Agreement", "BudgetLineItem"] and ops_db_hist.event_type in [
    if ops_db_hist.event_type in [
        OpsDBHistoryType.NEW,
        OpsDBHistoryType.DELETED,
    ]:
        log_items.append(
            {
                "title": event_log_title(ops_db_hist),
                "message": event_log_message(ops_db_hist),
                "created_on": ops_db_hist.created_on.isoformat(),
            }
        )
    elif ops_db_hist.event_type in [OpsDBHistoryType.UPDATED]:
        prepared_changes = prepare_changes(ops_db_hist)
        for change in prepared_changes:
            log_items.append(
                {
                    "title": property_log_title(ops_db_hist, change),
                    "message": property_log_message(ops_db_hist, change),
                    "created_on": ops_db_hist.created_on.isoformat(),
                }
            )

    d["log_items"] = log_items

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
