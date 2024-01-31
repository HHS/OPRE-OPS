from datetime import date

import marshmallow_dataclass as mmdc
from flask import Response, current_app, request
from flask_jwt_extended import verify_jwt_in_request
from models import OpsEventType, ServicesComponent
from models.base import BaseModel
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI, handle_api_error
from ops_api.ops.resources.services_component_schemas import (
    PATCHRequestBody,
    POSTRequestBody,
    QueryParameters,
    ServicesComponentItemResponse,
)
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from sqlalchemy import select
from typing_extensions import override

ENDPOINT_STRING = "/services-components"


# TODO: Permissions (stop using Permission.BUDGET_LINE_ITEM)
class ServicesComponentItemAPI(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._response_schema = mmdc.class_schema(ServicesComponentItemResponse)()
        self._put_schema = mmdc.class_schema(POSTRequestBody)()
        self._patch_schema = mmdc.class_schema(PATCHRequestBody)()


class ServicesComponentListAPI(BaseListAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)
        self._post_schema = mmdc.class_schema(POSTRequestBody)()
        self._get_schema = mmdc.class_schema(QueryParameters)()
        self._response_schema = mmdc.class_schema(ServicesComponentItemResponse)()
        self._response_schema_collection = mmdc.class_schema(ServicesComponentItemResponse)(many=True)

    @override
    @is_authorized(PermissionType.GET, Permission.BUDGET_LINE_ITEM)
    @handle_api_error
    def get(self) -> Response:
        data = self._get_schema.dump(self._get_schema.load(request.args))

        stmt = select(self.model)
        if data.get("contract_agreement_id"):
            stmt = stmt.where(self.model.contract_agreement_id == data.get("contract_agreement_id"))

        result = current_app.db_session.execute(stmt).all()
        response = make_response_with_headers(self._response_schema_collection.dump([sc[0] for sc in result]))

        return response

    @override
    @is_authorized(PermissionType.POST, Permission.BUDGET_LINE_ITEM)
    @handle_api_error
    def post(self) -> Response:
        message_prefix = f"POST to {ENDPOINT_STRING}"
        with OpsEventHandler(OpsEventType.CREATE_BLI) as meta:
            self._post_schema.context["method"] = "POST"

            data = self._post_schema.dump(self._post_schema.load(request.json))
            data["period_start"] = date.fromisoformat(data["period_start"]) if data.get("period_start") else None
            data["period_end"] = date.fromisoformat(data["period_end"]) if data.get("period_end") else None

            new_sc = ServicesComponent(**data)

            token = verify_jwt_in_request()
            user = get_user_from_token(token[1])
            new_sc.created_by = user.id

            current_app.db_session.add(new_sc)
            current_app.db_session.commit()

            new_sc_dict = self._response_schema.dump(new_sc)
            meta.metadata.update({"new_sc": new_sc_dict})
            current_app.logger.info(f"{message_prefix}: New BLI created: {new_sc_dict}")

            return make_response_with_headers(new_sc_dict, 201)
