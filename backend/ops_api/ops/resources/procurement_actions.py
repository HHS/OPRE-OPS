"""API resources for procurement actions."""

from flask import Response, current_app, request
from loguru import logger

from models import BaseModel, OpsEventType, ProcurementAction
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.procurement_actions import (
    ProcurementActionListResponseSchema,
    ProcurementActionRequestSchema,
    ProcurementActionResponseSchema,
)
from ops_api.ops.services.procurement_actions import ProcurementActionService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class ProcurementActionItemAPI(BaseItemAPI):
    """
    GET /api/v1/procurement-actions/<id>

    Get details of a single procurement action.
    """

    def __init__(self, model: BaseModel = ProcurementAction):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        """Get a single procurement action by ID."""
        with OpsEventHandler(OpsEventType.GET_AGREEMENT) as event_meta:
            service = ProcurementActionService(current_app.db_session)
            procurement_action = service.get(id)

            # Serialize response
            schema = ProcurementActionResponseSchema()
            serialized_data = schema.dump(procurement_action)

            event_meta.metadata.update({"procurement_action_id": id})

            return make_response_with_headers(serialized_data)


class ProcurementActionListAPI(BaseListAPI):
    """
    GET /api/v1/procurement-actions

    List procurement actions with pagination and filtering.
    """

    def __init__(self, model: BaseModel = ProcurementAction):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        """Get list of procurement actions with optional filtering."""
        with OpsEventHandler(OpsEventType.GET_AGREEMENT) as event_meta:
            # Validate request parameters
            request_schema = ProcurementActionRequestSchema()
            data = request_schema.load(request.args.to_dict(flat=False))

            logger.debug("Beginning procurement action queries")
            service = ProcurementActionService(current_app.db_session)
            procurement_actions, metadata = service.get_list(
                agreement_id=data.get("agreement_id"),
                budget_line_item_id=data.get("budget_line_item_id"),
                status=data.get("status"),
                award_type=data.get("award_type"),
                procurement_shop_id=data.get("procurement_shop_id"),
                limit=data.get("limit"),
                offset=data.get("offset"),
            )
            logger.debug("Procurement action queries complete")

            logger.debug("Serializing results")
            # Serialize response
            response_schema = ProcurementActionListResponseSchema(many=True)
            serialized_data = response_schema.dump(procurement_actions)
            logger.debug("Serialization complete")

            event_meta.metadata.update(
                {
                    "procurement_action_ids": [pa.id for pa in procurement_actions],
                    "count": metadata["count"],
                    "limit": metadata["limit"],
                    "offset": metadata["offset"],
                }
            )

            # Return wrapped response with metadata
            response_data = {
                "data": serialized_data,
                "count": metadata["count"],
                "limit": metadata["limit"],
                "offset": metadata["offset"],
            }

            return make_response_with_headers(response_data)
