from flask import Response, current_app, request
from sqlalchemy import select

from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseListAPI
from ops_api.ops.utils.response import make_response_with_headers


class OpsDBHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self) -> Response:
        class_name = request.args.get("class_name", None)
        row_key = request.args.get("row_key", None)
        limit = request.args.get("limit", None)
        offset = request.args.get("offset", None)
        stmt = select(self.model)
        if class_name:
            stmt = stmt.where(self.model.class_name == class_name)
        if row_key:
            stmt = stmt.where(self.model.row_key == row_key)
        if limit:
            stmt = stmt.limit(int(limit))
        if offset:
            stmt = stmt.offset(int(limit))
        stmt = stmt.where(self.model.class_name != "UserSession").order_by(self.model.created_on.desc())

        item_list = [row[0] for row in current_app.db_session.execute(stmt).all()]

        if item_list:
            response = make_response_with_headers([item.to_dict() for item in item_list])
        else:
            response = make_response_with_headers({}, 404)
        return response
