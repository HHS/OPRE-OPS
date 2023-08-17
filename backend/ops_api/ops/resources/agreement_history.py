from flask import Response, current_app, request

from models import OpsDBHistory, OpsDBHistoryType, User
from models.base import BaseModel
from ops_api.ops.base_views import BaseListAPI, handle_sql_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy import select, and_
from typing_extensions import override


def build_change_summary(ops_db_hist: OpsDBHistory, user: User):
    user_full_name = user.full_name if user else "Unknown"
    return f"{ops_db_hist.class_name} {ops_db_hist.event_type.name} by {user_full_name}"


def build_change_messages(ops_db_hist: OpsDBHistory):
    change_messages = []
    changes = ops_db_hist.changes
    if changes:
        for key, hist in changes.items():
            hist_added = hist['added'] if 'added' in hist else None
            hist_deleted = hist['deleted'] if 'deleted' in hist else None
            print(f"{key=}, {hist_added=}, {hist_deleted=}")
            if not hist_added and not hist_deleted:
                continue
            if key in ["team_members", "support_contacts"]:
                users_added = [u.get("full_name", "Unknown") for u in hist_added] if hist_added else None
                users_deleted = [u.get("full_name", "Unknown") for u in hist_deleted] if hist_deleted else None
                msg = f"{key} changed"
                if users_added:
                    msg += f", added {users_added}"
                if users_deleted:
                    msg += f", removed {users_deleted}"
                change_messages.append(msg)
            else:
                old_val = hist_deleted[0] if hist_deleted else None
                new_val = hist_added[0] if hist_added else None
                msg = f"{key} changed from \"{old_val}\" to \"{new_val}\""
                change_messages.append(msg)
    return change_messages


def build_agreement_history_dict(ops_db_hist: OpsDBHistory, user: User):
    d = ops_db_hist.to_dict()
    d["created_by_user_full_name"] = user.full_name if user else None
    d["change_summary"] = build_change_summary(ops_db_hist, user)
    d["change_messages"] = build_change_messages(ops_db_hist)
    return d


class AgreementHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self, id: int) -> Response:
        print(f"agreement_history.get:{id}")
        class_name = request.args.get("class_name", None)
        row_key = request.args.get("row_key", None)
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        with handle_sql_error():
            stmt = select(OpsDBHistory).join(OpsDBHistory.created_by_user, isouter=True).add_columns(User)
            stmt = stmt.where(and_(
                OpsDBHistory.agreement_id == id,
                OpsDBHistory.event_type.in_([OpsDBHistoryType.NEW, OpsDBHistoryType.UPDATED, OpsDBHistoryType.DELETED])
            ))

            stmt = stmt.limit(limit)
            if offset:
                stmt = stmt.offset(int(limit))
            stmt = stmt.order_by(OpsDBHistory.created_on.desc())

            results = current_app.db_session.execute(stmt).all()
            if results:
                response = make_response_with_headers([build_agreement_history_dict(row[0], row[1]) for row in results])
            else:
                response = make_response_with_headers({}, 404)
            return response
