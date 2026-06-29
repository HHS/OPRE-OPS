from dataclasses import asdict

from flask import Response, current_app, request
from loguru import logger

from models import Agreement, BaseModel, OpsEventType
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.agreement_edit_bundle import AgreementEditBundleRequestSchema
from ops_api.ops.services.agreement_edit_bundle import AgreementEditBundleService
from ops_api.ops.services.ops_service import ValidationError
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class AgreementEditBundleAPI(BaseItemAPI):
    """Atomically update an agreement plus its services components and budget line items.

    Route: ``PATCH /agreements/<int:id>/edit-bundle``

    The body is a single bundle (see ``AgreementEditBundleRequestSchema``) describing
    every change. The orchestrator applies them in one DB transaction; if any step fails,
    nothing is persisted. This replaces the prior client-side fan-out of separate
    PATCH/POST/DELETE calls in the review-flow edit page, which could leave the agreement
    in a partially-saved state.
    """

    def __init__(self, model: BaseModel = Agreement):
        super().__init__(model)
        self._request_schema = AgreementEditBundleRequestSchema()

    @is_authorized(PermissionType.PATCH, Permission.AGREEMENT)
    def patch(self, id: int) -> Response:
        with OpsEventHandler(OpsEventType.UPDATE_AGREEMENT) as meta:
            meta.metadata.update({"agreement_id": id, "via": "edit-bundle"})

            try:
                payload = self._request_schema.load(request.json or {})
            except Exception:
                logger.exception(f"Invalid edit-bundle payload for agreement_id={id}")
                raise

            service = AgreementEditBundleService(current_app.db_session)

            try:
                result = service.update(id, payload)
            except ValidationError as ve:
                error_details = ve.details if hasattr(ve, "details") else str(ve)
                meta.metadata.update(error_details if isinstance(error_details, dict) else {"error": error_details})
                raise

            meta.metadata.update({"bundle_result": asdict(result)})

            response_body = {"message": "Agreement edit bundle saved", "id": id, **asdict(result)}
            status_code = 202 if result.change_request_ids else 200
            return make_response_with_headers(response_body, status_code)
