from dataclasses import dataclass
from datetime import date, datetime

from flask import Response, current_app, request
from flask_jwt_extended import verify_jwt_in_request
from marshmallow import Schema, ValidationError, fields
from models.base import BaseModel
from models.cans import AgreementReason, BudgetLineItem
from models.notifications import Notification
from models.workflows import (
    Package,
    PackageSnapshot,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStatus,
    WorkflowStepInstance,
    WorkflowTriggerType,
)
from ops_api.ops.base_views import BaseItemAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from typing_extensions import override

ENDPOINT_STRING = "/workflow-submit"


@dataclass
class WorkflowSubmissionData(Schema):
    budget_line_item_ids: fields.List(fields.Int(), required=True)
    submitter_id: fields.Int(required=False)

    def __init__(self, *args, **kwargs):
        self.budget_line_item_ids = kwargs.get("budget_line_item_ids")
        self.submitter_id = kwargs.get("submitter_id")
        super().__init__(*args, **kwargs)


class WorkflowSubmisionListApi(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @override
    @is_authorized(PermissionType.POST, Permission.BLI_PACKAGE)
    @handle_api_error
    def post(self) -> Response:
        current_app.logger.info(f"********** /approve Request: {request.json}")

        # TODO: Using a dataclass schema for ApprovalSubmissionData, load data from request.json

        budget_line_item_ids = request.json.get("budget_line_item_ids", [])
        submission_notes = request.json.get("notes")
        # Capture the use-case for this package (DRAFT_TO_PLANNED or PLANNED_TO_EXECUTED)
        workflow_action = request.json.get("workflow_action")
        # Create new Package
        new_package = Package()

        if submitter_id := request.json.get("submitter_id"):
            new_package.submitter_id = submitter_id

        token = verify_jwt_in_request()
        user = get_user_from_token(token[1])
        new_package.created_by = user.id
        new_package.submitter_id = user.id
        new_package.notes = submission_notes
        agreement_id = None
        # Create PackageSnapshot
        # Handle budget_line_item IDs and create PackageSnapshot records
        for bli_id in budget_line_item_ids:
            bli = current_app.db_session.get(BudgetLineItem, bli_id)

            if bli:
                validate_bli(bli)
                agreement_id = bli.agreement_id
                new_package.package_snapshots.append(
                    PackageSnapshot(
                        bli_id=bli.id,
                        version=None,
                    )
                )
            else:
                raise ValueError(f"BudgetLineItem with ID {bli_id} does not exist.")

        # WIP: Create WorkflowInstance and WorkflowStepInstance
        workflow_instance = WorkflowInstance()
        workflow_instance.workflow_template_id = 1  # We know this is a basic approval template
        workflow_instance.created_by = user.id
        workflow_instance.workflow_action = WorkflowAction[workflow_action]

        #  In order to know which workflow to follow, ie: who to send the approval request to,
        #  we need to know which CAN the BLIs are associated with. This is the associated_id,
        #  and the associated_type will be "CAN".
        #  TODO: this should step over the `bli_cans` list and create a workflow step instance for each CAN,
        #  but for now, going to assume the first BLI CAN is all we need, to ensure the process works.
        workflow_instance.associated_id = 1  # bli_cans[0]
        workflow_instance.associated_type = WorkflowTriggerType.CAN

        workflow_step_instance = WorkflowStepInstance(
            workflow_step_template_id=2,
            status=WorkflowStatus.REVIEW,
            notes=submission_notes,
            created_by=user.id,
            time_started=datetime.now(),
            successor_dependencies=[],
            predecessor_dependencies=[],
        )
        current_app.logger.info(f"Workflow Step Instance: {workflow_step_instance}")

        workflow_instance.steps.append(workflow_step_instance)

        # WIP: commit our new workflow instance
        current_app.db_session.add(workflow_instance)
        current_app.db_session.commit()

        # updated the current step in the bli package to the first step in the workflow
        new_package.workflow_id = workflow_instance.id

        # commit our new bli package
        current_app.db_session.add(new_package)
        current_app.db_session.commit()

        new_package_dict = new_package.to_dict()
        current_app.logger.info(f"POST to {ENDPOINT_STRING}: New Bli Package created: {new_package_dict}")

        # Create a notification for the approvers
        notification = Notification(
            title="Approval Request",
            message=f"""An Agreement Approval Request has been submitted.
Please review and approve. LINK to Agreement: {agreement_id}""",
            is_read=False,
            recipient_id=23,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()

        return make_response_with_headers({"message": "Bli Package created", "id": new_package.id}, 201)


def validate_bli(bli: BudgetLineItem):  # noqa: C901
    if bli is None:
        raise ValueError("bli is a required argument")

    # Validate Agreement
    if bli.agreement_id is None:
        raise ValidationError({"_schema": ["BLI must have an Agreement when status is not DRAFT"]})
    if not bli.agreement.project_id:
        raise ValidationError("BLI's Agreement must have a Project when status is not DRAFT")
    if not bli.agreement.description:
        raise ValidationError("BLI's Agreement must have a Description when status is not DRAFT")
    if not bli.agreement.product_service_code_id:
        raise ValidationError("BLI's Agreement must have a ProductServiceCode when status is not DRAFT")
    if not bli.agreement.procurement_shop_id:
        raise ValidationError("BLI's Agreement must have a ProcurementShop when status is not DRAFT")
    if not bli.agreement.agreement_reason:
        raise ValidationError("BLI's Agreement must have an AgreementReason when status is not DRAFT")
    if bli.agreement.agreement_reason == AgreementReason.NEW_REQ and bli.agreement.incumbent_id:
        raise ValidationError("BLI's Agreement cannot have an Incumbent if it has an Agreement Reason of NEW_REQ")
    if (
        bli.agreement.agreement_reason == AgreementReason.RECOMPETE
        or bli.agreement.agreement_reason == AgreementReason.LOGICAL_FOLLOW_ON
    ) and not bli.agreement.incumbent_id:
        raise ValidationError(
            "BLI's Agreement must have an Incumbent if it has an Agreement Reason of RECOMPETE or LOGICAL_FOLLOW_ON"
        )
    if bli and bli.agreement_id and not bli.agreement.project_officer:
        raise ValidationError("BLI's Agreement must have a ProjectOfficer when status is not DRAFT")

    # Validate BLI
    if bli.line_description is None:
        raise ValidationError({"_schema": ["BLI must valid a valid Description when status is not DRAFT"]})
    if not bli.date_needed:
        raise ValidationError({"_schema": ["BLI must valid a valid Need By Date when status is not DRAFT"]})
    today = date.today()
    if bli.date_needed <= today:
        raise ValidationError("BLI must valid a Need By Date in the future when status is not DRAFT")
    if not bli.can_id:
        raise ValidationError("BLI must have a valid CAN when status is not DRAFT")
    if bli.amount is None:
        raise ValidationError("BLI must have a valid Amount when status is not DRAFT")
    if bli.amount <= 0:
        raise ValidationError("BLI must be a valid Amount (greater than zero) when status is not DRAFT")
    return
