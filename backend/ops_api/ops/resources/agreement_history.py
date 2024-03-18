from flask import Response, current_app, request
from sqlalchemy import Integer, and_, or_, select
from typing_extensions import override

from models import Agreement, OpsDBHistory, OpsDBHistoryType, User
from models.base import BaseModel
from ops_api.ops.base_views import BaseListAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers


def build_agreement_history_dict(ops_db_hist: OpsDBHistory, user: User):
    d = ops_db_hist.to_dict()
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
        class_names = [cls.__name__ for cls in Agreement.__subclasses__()] + [Agreement.__class__.__name__]
        stmt = select(OpsDBHistory).join(OpsDBHistory.created_by_user, isouter=True).add_columns(User)
        stmt = stmt.where(
            and_(
                or_(
                    and_(
                        OpsDBHistory.event_details["id"].astext.cast(Integer) == id,
                        OpsDBHistory.class_name.in_(class_names),
                    ),
                    OpsDBHistory.event_details["agreement_id"].astext.cast(Integer) == id,
                ),
                OpsDBHistory.event_type.in_(
                    [
                        OpsDBHistoryType.NEW,
                        OpsDBHistoryType.UPDATED,
                        OpsDBHistoryType.DELETED,
                    ]
                ),
            )
        )
        stmt = stmt.order_by(OpsDBHistory.created_on.desc())
        stmt = stmt.limit(limit)
        if offset:
            stmt = stmt.offset(int(offset))

        results = current_app.db_session.execute(stmt).all()
        if results:
            response = make_response_with_headers([build_agreement_history_dict(row[0], row[1]) for row in results])
        else:
            response = make_response_with_headers({}, 404)
        return response
