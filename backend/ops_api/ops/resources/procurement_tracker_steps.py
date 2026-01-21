"""API resources for procurement tracker steps."""

from flask import Response, current_app, request
from flask_jwt_extended import get_current_user
from loguru import logger

from models import BaseModel, OpsEventType, ProcurementTrackerStep
from models.utils import generate_events_update
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.procurement_tracker_steps import (
    ProcurementTrackerStepPatchRequestSchema,
    ProcurementTrackerStepResponseSchema,
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
