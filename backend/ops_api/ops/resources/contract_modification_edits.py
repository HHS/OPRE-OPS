"""API resources for contract modifications on Awarded agreements (Award & Modifications tab)."""

from typing import Type

from flask import Response, current_app, request

from models import Agreement, ContractModificationRequest, OpsEventType
from models.base import BaseModel
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.contract_modification_edits import (
    ContractModificationEditSchema,
    ContractModificationRequestSchema,
    ReviewContractModificationRequestSchema,
    SubmitContractModificationRequestSchema,
)
from ops_api.ops.services.contract_modification_edits import ContractModificationEditService
from ops_api.ops.services.contract_modification_requests import ContractModificationRequestService
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

        Returns the approved edits not yet attached to a contract modification, latest per
        (budget line, field), oldest first, shaped as ``{"data": [ {edit}, ... ]}``. Edits in
        the contract modification that is in review have ``in_review`` true.

        Raises:
            ResourceNotFoundError: The agreement doesn't exist (404).
            ValidationError: The agreement is not a Contract or AA agreement (400).
        """
        edits = ContractModificationEditService(current_app.db_session).get_pending_for_agreement(id)
        in_review_ids = ContractModificationRequestService(current_app.db_session).get_in_review_edit_ids(id)
        data = ContractModificationEditSchema(many=True).dump(edits)
        for edit in data:
            edit["in_review"] = edit["id"] in in_review_ids
        return make_response_with_headers({"data": data})


class AgreementContractModificationsAPI(BaseItemAPI):
    """An agreement's contract modification requests."""

    def __init__(self, model: Type[BaseModel] = Agreement):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.GET, Permission.AGREEMENT)
    def get(self, id: int) -> Response:
        """
        GET /agreements/<int:id>/contract-modifications/

        Returns the agreement's contract modification requests, newest first, shaped as
        ``{"data": [ {request}, ... ]}``.
        """
        requests = ContractModificationRequestService(current_app.db_session).get_for_agreement(id)
        return make_response_with_headers({"data": ContractModificationRequestSchema(many=True).dump(requests)})

    @error_simulator
    @is_authorized(PermissionType.POST, Permission.AGREEMENT)
    def post(self, id: int) -> Response:
        """
        POST /agreements/<int:id>/contract-modifications/

        Sends the agreement's pending edits, plus the selected Planned budget lines to execute,
        to the Division Director for approval.

        Raises:
            ResourceNotFoundError: The agreement doesn't exist (404).
            AuthorizationError: The user is not associated with the agreement (403).
            ValidationError: A modification is already in review, nothing to modify, an
                ineligible budget line, not Awarded, not Contract/AA, or disabled (400).
        """
        with OpsEventHandler(OpsEventType.START_CONTRACT_MODIFICATION) as meta:
            payload = SubmitContractModificationRequestSchema().load(request.json or {})
            mod_request = ContractModificationRequestService(current_app.db_session).submit(
                id,
                budget_line_item_ids=payload["budget_line_item_ids"],
                requestor_notes=payload["requestor_notes"],
            )

            data = ContractModificationRequestSchema().dump(mod_request)
            meta.metadata.update(
                {
                    "agreement_id": id,
                    "contract_modification_request_id": mod_request.id,
                    "contract_modification_edit_ids": [edit["id"] for edit in data["edits"]],
                    "budget_line_item_ids": data["budget_line_item_ids"],
                }
            )
            return make_response_with_headers(data, 201)


class ContractModificationRequestItemAPI(BaseItemAPI):
    """Division Director review of a contract modification request."""

    # PATCH only: the inherited GET has no agreement-level permission check.
    methods = ["PATCH"]

    def __init__(self, model: Type[BaseModel] = ContractModificationRequest):
        super().__init__(model)

    @error_simulator
    @is_authorized(PermissionType.PATCH, Permission.CHANGE_REQUEST)
    def patch(self, id: int) -> Response:
        """
        PATCH /contract-modification-requests/<int:id>/

        Body: ``{"action": "APPROVE" | "DECLINE", "reviewer_notes": str | null}``. Approval
        creates the modification, attaches the edits and executes the selected budget lines.

        Raises:
            ResourceNotFoundError: The request doesn't exist (404).
            AuthorizationError: The user is not a Division Director for the agreement (403).
            ValidationError: Already reviewed, a budget line is no longer Planned, or disabled (400).
        """
        with OpsEventHandler(OpsEventType.REVIEW_CONTRACT_MODIFICATION) as meta:
            payload = ReviewContractModificationRequestSchema().load(request.json or {})
            mod_request = ContractModificationRequestService(current_app.db_session).review(
                id, payload["action"], payload["reviewer_notes"]
            )

            data = ContractModificationRequestSchema().dump(mod_request)
            meta.metadata.update(
                {
                    "agreement_id": mod_request.agreement_id,
                    "contract_modification_request_id": mod_request.id,
                    "status": mod_request.status.name,
                    "agreement_mod_id": mod_request.agreement_mod_id,
                    "contract_modification_edit_ids": [edit["id"] for edit in data["edits"]],
                    "budget_line_item_ids": data["budget_line_item_ids"],
                    "reviewer_notes": mod_request.reviewer_notes,
                }
            )
            return make_response_with_headers(data, 200)
