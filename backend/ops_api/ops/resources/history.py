from typing_extensions import override
from flask import current_app, Response, request
from models.base import BaseModel
from ops_api.ops.base_views import BaseListAPI, handle_sql_error
from ops_api.ops.utils.auth import is_authorized, PermissionType, Permission
from ops_api.ops.utils.response import make_response_with_headers
from sqlalchemy import select


class OpsDBHistoryListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.GET, Permission.HISTORY)
    def get(self) -> Response:
        class_name = request.args.get("class_name", None)
        row_key = request.args.get("row_key", None)
        with handle_sql_error():
            stmt = select(self.model)
            if class_name:
                stmt = stmt.where(self.model.class_name == class_name)
            if row_key:
                stmt = stmt.where(self.model.row_key == row_key)
            stmt = stmt.order_by(self.model.created_on.desc())

            item_list = [row[0] for row in current_app.db_session.execute(stmt).all()]

            if item_list:
                response = make_response_with_headers([item.to_dict() for item in item_list])
            else:
                response = make_response_with_headers({}, 404)
            return response
