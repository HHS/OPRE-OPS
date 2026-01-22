"""API resources for procurement trackers."""

from flask import Response, current_app, request
from loguru import logger

from models import BaseModel, ProcurementTracker
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.procurement_trackers import (
    ProcurementTrackerResponseSchema,
    QueryParametersSchema,
)
from ops_api.ops.services.procurement_trackers import ProcurementTrackerService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.response import make_response_with_headers


class ProcurementTrackerItemAPI(BaseItemAPI):
    """
    GET /api/v1/procurement-trackers/<id>

    Get details of a single procurement tracker.
    """

    def __init__(self, model: BaseModel = ProcurementTracker):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        """Get a single procurement tracker by ID."""
        service = ProcurementTrackerService(current_app.db_session)
        procurement_tracker = service.get(id)

        # Serialize response
        schema = ProcurementTrackerResponseSchema()
        serialized_data = schema.dump(procurement_tracker)

        return make_response_with_headers(serialized_data)


class ProcurementTrackerListAPI(BaseListAPI):
    """
    GET /api/v1/procurement-trackers

    List procurement trackers with pagination and filtering.
    """

    def __init__(self, model: BaseModel = ProcurementTracker):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        """Get list of procurement trackers with optional filtering."""
        # Validate request parameters
        request_schema = QueryParametersSchema()
        data = request_schema.load(request.args.to_dict(flat=False))

        logger.debug("Beginning procurement tracker queries")
        service = ProcurementTrackerService(current_app.db_session)
        procurement_trackers, metadata = service.get_list(
            agreement_id=data.get("agreement_id"),
            limit=data.get("limit"),
            offset=data.get("offset"),
        )
        logger.debug("Procurement tracker queries complete")

        logger.debug("Serializing results")
        # Serialize response
        response_schema = ProcurementTrackerResponseSchema(many=True)
        serialized_data = response_schema.dump(procurement_trackers)
        logger.debug("Serialization complete")

        # Return wrapped response with metadata
        response_data = {
            "data": serialized_data,
            "count": metadata["count"],
            "limit": metadata["limit"],
            "offset": metadata["offset"],
        }

        return make_response_with_headers(response_data)
