from flask import Response, current_app, request
from sqlalchemy import select
from typing_extensions import override

from models import AgreementOpsDbHistory, ChangeRequest, OpsDBHistory, OpsDBHistoryType, User
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI, handle_api_error
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


def find_agreement_histories(agreement_id, limit=10, offset=0):
    stmt = (
        select(OpsDBHistory, User)
        .join(User, OpsDBHistory.created_by == User.id, isouter=True)
        .join(AgreementOpsDbHistory, OpsDBHistory.id == AgreementOpsDbHistory.ops_db_history_id, isouter=True)
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


def build_agreement_history_dict(ops_db_hist: OpsDBHistory, user: User):
    d = ops_db_hist.to_dict()
    if ops_db_hist.class_name in change_request_class_names:
        requested_change_diff = ops_db_hist.event_details.get("requested_change_diff", None)
        d["changes"] = requested_change_diff
    # TODO: eliminate join to User if possible
    d["created_by_user_full_name"] = user.full_name if user else None
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
            response = make_response_with_headers([build_agreement_history_dict(row[0], row[1]) for row in results])
        else:
            response = make_response_with_headers({}, 404)
        return response
