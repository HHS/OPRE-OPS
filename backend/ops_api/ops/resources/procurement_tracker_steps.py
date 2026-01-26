"""API resources for procurement tracker steps."""

from flask import Response, current_app, request
from flask_jwt_extended import get_current_user
from loguru import logger

from models import BaseModel, OpsEventType, ProcurementTrackerStep
from models.utils import generate_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI, BaseListAPI
from ops_api.ops.schemas.procurement_tracker_steps import (
    ProcurementTrackerStepPatchRequestSchema,
    ProcurementTrackerStepResponseSchema,
    ProcurementTrackerStepsQueryParametersSchema,
)
from ops_api.ops.services.procurement_tracker_steps import ProcurementTrackerStepService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class ProcurementTrackerStepItemAPI(BaseItemAPI):
    """
    GET /api/v1/procurement-tracker-steps/<id>
    PATCH /api/v1/procurement-tracker-steps/<id>

    Get or update details of a single procurement tracker step.
    """

    def __init__(self, model: BaseModel = ProcurementTrackerStep):
        super().__init__(model)
        self._response_schema = ProcurementTrackerStepResponseSchema()
        self._patch_schema = ProcurementTrackerStepPatchRequestSchema(partial=True)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        """Get a single procurement tracker step by ID."""
        with OpsEventHandler(OpsEventType.GET_AGREEMENT) as event_meta:
            service = ProcurementTrackerStepService(current_app.db_session)
            step = service.get(id)

            # Serialize response
            serialized_data = self._response_schema.dump(step)

            event_meta.metadata.update({"procurement_tracker_step_id": id})

            return make_response_with_headers(serialized_data)

    @error_simulator
    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    def patch(self, id: int) -> Response:
        """Update a procurement tracker step by ID."""
        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as event_meta:
            logger.debug(f"Patching procurement tracker step {id}")

            # Load and validate request data
            data = self._patch_schema.load(request.json)
            current_user = get_current_user()
            # Get the service and existing step
            service = ProcurementTrackerStepService(current_app.db_session)
            old_step = service.get(id)
            old_step_dict = old_step.to_dict()

            # Update the step
            updated_step, status_code = service.update(id, data, current_user)

            # Generate event updates
            events_update = generate_events_update(
                old_step_dict, updated_step.to_dict(), updated_step.procurement_tracker.agreement_id, current_user.id
            )

            event_meta.metadata.update(
                {"procurement_tracker_step_updates": events_update, "procurement_tracker_step": updated_step.to_dict()}
            )

            # Serialize and return response
            serialized_data = self._response_schema.dump(updated_step)
            logger.debug(f"Successfully patched procurement tracker step {id}")

            return make_response_with_headers(serialized_data, status_code)


class ProcurementTrackerStepListAPI(BaseListAPI):
    """
    GET /api/v1/procurement-tracker-steps

    List procurement tracker steps with pagination and filtering.
    """

    def __init__(self, model: BaseModel = ProcurementTrackerStep):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self) -> Response:
        """Get list of procurement tracker steps with optional filtering."""
        # Validate request parameters
        request_schema = ProcurementTrackerStepsQueryParametersSchema()
        data = request_schema.load(request.args.to_dict(flat=False))

        logger.debug("Beginning procurement tracker step queries")
        service = ProcurementTrackerStepService(current_app.db_session)
        procurement_tracker_steps, metadata = service.get_list(
            agreement_id=data.get("agreement_id"),
            limit=data.get("limit"),
            offset=data.get("offset"),
        )
        # Serialize response
        response_schema = ProcurementTrackerStepResponseSchema(many=True)
        serialized_data = response_schema.dump(procurement_tracker_steps)

        # Return wrapped response with metadata
        response_data = {
            "data": serialized_data,
            "count": metadata["count"],
            "limit": metadata["limit"],
            "offset": metadata["offset"],
        }

        return make_response_with_headers(response_data)
