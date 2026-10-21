"""API resources for "Edits That Require a Contract Modification" (Award & Modifications tab)."""

from typing import Type

from flask import Response, current_app

from models import Agreement, OpsEventType
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.contract_modification_edits import (
    ContractModificationEditSchema,
    StartContractModificationResponseSchema,
)
from ops_api.ops.services.contract_modification_edits import ContractModificationEditService
from ops_api.ops.utils.errors import error_simulator
from ops_api.ops.utils.events import OpsEventHandler
from ops_api.ops.utils.response import make_response_with_headers


class AgreementContractModificationEditsAPI(BaseItemAPI):
    """Pending edits on an Awarded agreement that require a contract modification."""

    def __init__(self, model: Type[BaseModel] = Agreement):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        """
        GET /agreements/<int:id>/contract-modification-edits/

        Returns the approved edits not yet attached to a started contract modification,
        latest per (budget line, field), oldest first, shaped as ``{"data": [ {edit}, ... ]}``.

        Raises:
            ResourceNotFoundError: The agreement doesn't exist (404).
            ValidationError: The agreement is not a Contract or AA agreement (400).
        """
        service = ContractModificationEditService(current_app.db_session)
        edits = service.get_pending_for_agreement(id)
        return make_response_with_headers({"data": ContractModificationEditSchema(many=True).dump(edits)})


class AgreementContractModificationsAPI(BaseItemAPI):
    """Start a contract modification for an agreement's pending edits."""

    # POST only: don't expose the GET inherited from BaseItemAPI, which returns the full
    # Agreement without the Permission.AGREEMENT check.
    methods = ["POST"]

    def __init__(self, model: Type[BaseModel] = Agreement):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.POST, Permission.AGREEMENT)
    def post(self, id: int) -> Response:
        """
        POST /agreements/<int:id>/contract-modifications/

        Creates a modification for the agreement and attaches every pending edit to it,
        removing them from the "Edits That Require a Contract Modification" list.

        Raises:
            ResourceNotFoundError: The agreement doesn't exist (404).
            AuthorizationError: The user is not associated with the agreement (403).
            ValidationError: No pending edits, not Awarded, not Contract/AA, or disabled (400).
        """
        with OpsEventHandler(OpsEventType.START_CONTRACT_MODIFICATION) as meta:
            service = ContractModificationEditService(current_app.db_session)
            agreement_mod, edits = service.start_modification(id)

            meta.metadata.update(
                {
                    "agreement_id": id,
                    "agreement_mod_id": agreement_mod.id,
                    "contract_modification_edit_ids": [edit.id for edit in edits],
                }
            )
            data = StartContractModificationResponseSchema().dump({"agreement_mod": agreement_mod, "edits": edits})
            return make_response_with_headers(data, 201)
