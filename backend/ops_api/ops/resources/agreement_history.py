from flask import Response, current_app, request

from models import OpsDBHistory, User
from models.base import BaseModel
from ops_api.ops.base_views import BaseListAPI, handle_sql_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy import select
from typing_extensions import override


def build_change_summary(ops_db_hist: OpsDBHistory, user: User):
    return f"{ops_db_hist.class_name} {ops_db_hist.event_type.name} by {user.full_name}"


def build_change_messages(ops_db_hist: OpsDBHistory):
    change_messages = []
    changes = ops_db_hist.hist_changes
    if changes:
        for key, hist in changes.items():
            hist_added = hist['added']
            hist_deleted = hist['deleted']
            print(f"{key=}, {hist_added=}, {hist_deleted=}")
            if not hist_added and not hist_deleted:
                continue
            if key in ["team_members", "support_contacts"]:
                users_added = [u["full_name"] for u in hist_added]
                users_deleted = [u["full_name"] for u in hist_deleted]
                msg = f"{key} changed"
                if users_added:
                    msg += f", added {users_added}"
                if users_deleted:
                    msg += f", removed {users_deleted}"
                change_messages.append(msg)
            else:
                msg = f"{key} changed from \"{hist['deleted'][0]}\" to \"{hist['added'][0]}\""
                change_messages.append(msg)
    return change_messages


def build_agreement_history_dict(ops_db_hist: OpsDBHistory, user: User):
    d = ops_db_hist.to_dict()
    d["created_by_user_full_name"] = user.full_name
    d["change_summary"] = build_change_summary(ops_db_hist, user)
    d["change_messages"] = build_change_messages(ops_db_hist)
    return d


class AgreementHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self, id: int) -> Response:
        class_name = request.args.get("class_name", None)
        row_key = request.args.get("row_key", None)
        limit = request.args.get("limit", 10, type=int)
        offset = request.args.get("offset", 0, type=int)
        with handle_sql_error():
            stmt = select(OpsDBHistory).join(OpsDBHistory.created_by_user).add_columns(User)
            # stmt = stmt.where(OpsDBHistory.class_name == "ContractAgreement")
            stmt = stmt.where(OpsDBHistory.agreement_id == id)

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
