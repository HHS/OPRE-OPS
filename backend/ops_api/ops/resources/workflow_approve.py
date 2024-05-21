from datetime import date, datetime

import sqlalchemy as sa
from flask import Response, current_app, request
from flask_jwt_extended import current_user
from marshmallow import Schema, fields

from models.base import BaseModel
from models.cans import Agreement, BudgetLineItem, BudgetLineItemStatus
from models.notifications import Notification
from models.workflows import (
    Package,
    PackageSnapshot,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStepInstance,
    WorkflowStepStatus,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.utils.procurement_workflow_helper import create_procurement_workflow
from ops_api.ops.utils.response import make_response_with_headers

ENDPOINT_STRING = "/workflow-approve"


class WorkflowApprovalData(Schema):
    workflow_step_id: fields.Int(required=True)
    workflow_step_action: fields.Str(required=True)
    workflow_notes: fields.Str(required=False)

    def __init__(self, *args, **kwargs):
        self.workflow_step_id = kwargs.get("workflow_step_id")
        self.workflow_step_action = kwargs.get("workflow_step_action")
        self.workflow_notes = kwargs.get("workflow_notes")
        super().__init__(*args, **kwargs)


class WorkflowApprovalListApi(BaseItemAPI):
    def __init__(self, model: BaseModel):
        super().__init__(model)

    @is_authorized(PermissionType.PATCH, Permission.WORKFLOW)
    def post(self) -> Response:
        # TODO: Using a dataclass schema for ApprovalSubmissionData, load data from request.json

        workflow_step_id = request.json.get("workflow_step_id")
        workflow_step_action = request.json.get("workflow_step_action")
        workflow_notes = request.json.get("notes")

        workflow_step_instance = current_app.db_session.get(WorkflowStepInstance, workflow_step_id)
        if not workflow_step_instance:
            return make_response_with_headers({"message": f"No workflow step instance for {workflow_step_id=}"}, 400)
        if current_user.id not in workflow_step_instance.approvers["users"]:
            return make_response_with_headers({"message": "User is not an approver for this step"}, 401)
        # TODO: Create a better principal check for users/groups/roles

        if workflow_step_action == "APPROVE":
            # Update WorkflowStepInstance
            workflow_step_instance.status = WorkflowStepStatus.APPROVED
            workflow_step_instance.time_completed = datetime.now()
            workflow_step_instance.notes = workflow_notes
            workflow_step_instance.updated_by = current_user.id

            # If there are successor dependencies, update the workflow instance to the next step
            workflow_step_instance.workflow_instance.current_workflow_step_instance_id = (
                workflow_step_instance.successor_dependencies[0]
                if workflow_step_instance.successor_dependencies
                else None
            )
            current_app.db_session.add(workflow_step_instance)
            current_app.db_session.add(workflow_step_instance.workflow_instance)
            current_app.db_session.commit()

            create_approval_notification_for_submitter(workflow_step_instance)

            blis = update_blis(workflow_step_instance)
            agreement_id = blis[0].agreement_id if blis else None

            if (
                agreement_id is not None
                and workflow_step_instance.workflow_instance.workflow_status == WorkflowStepStatus.APPROVED
                and workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.PLANNED_TO_EXECUTING
            ):
                create_procurement_workflow(agreement_id)

            return make_response_with_headers(
                {
                    "message": "Workflow Status Accepted",
                    "id": workflow_step_instance.id,
                },
                200,
            )

        elif workflow_step_action == "REJECT":
            # Update WorkflowStepInstance
            workflow_step_instance.status = WorkflowStepStatus.REJECTED
            workflow_step_instance.time_completed = datetime.now()
            workflow_step_instance.notes = workflow_notes
            workflow_step_instance.updated_by = current_user.id

            # If there are successor dependencies, update the workflow instance to the next step
            workflow_step_instance.workflow_instance.current_workflow_step_instance_id = (
                workflow_step_instance.successor_dependencies[0]
                if workflow_step_instance.successor_dependencies
                else None
            )
            current_app.db_session.add(workflow_step_instance)
            current_app.db_session.add(workflow_step_instance.workflow_instance)
            current_app.db_session.commit()

            create_rejection_notification_for_submitter(workflow_step_instance)
            create_rejection_notification_for_project_officer(workflow_step_instance)
            return make_response_with_headers(
                {
                    "message": "Workflow Status Rejected",
                    "id": workflow_step_instance.id,
                },
                200,
            )
        elif workflow_step_action == "CHANGES":
            # TODO: Update WorkflowStepInstance
            pass
        else:
            raise ValueError(f"Invalid WorkflowAction: {workflow_step_action}")


def update_blis(workflow_step_instance: WorkflowStepInstance):
    if workflow_step_instance.workflow_instance.workflow_status == WorkflowStepStatus.APPROVED:
        # BLI
        package_blis = workflow_step_instance.package_entities["budget_line_item_ids"]
        blis = current_app.db_session.query(BudgetLineItem).filter(BudgetLineItem.id.in_(package_blis)).all()
        if workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.DRAFT_TO_PLANNED:
            for bli in blis:
                bli.status = BudgetLineItemStatus.PLANNED
        elif workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.PLANNED_TO_EXECUTING:
            for bli in blis:
                bli.status = BudgetLineItemStatus.IN_EXECUTION
        else:
            raise ValueError(f"Invalid WorkflowAction: {workflow_step_instance.workflow_instance.workflow_action}")
        current_app.db_session.add_all(blis)
        current_app.db_session.commit()
        return blis


def create_approval_notification_for_submitter(workflow_step_instance):
    if workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.DRAFT_TO_PLANNED:
        notification = Notification(
            title="Budget Lines Approved from Draft to Planned Status",
            message="The budget lines you sent to your Division Director were approved from draft to planned status. "
            "The amounts have been subtracted from the FY budget.",
            is_read=False,
            recipient_id=workflow_step_instance.created_by,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()
    elif workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.PLANNED_TO_EXECUTING:
        notification = Notification(
            title="Budget Lines Approved from Planned to Executing Status",
            message="The budget lines you sent to your Division Director were approved from planned to executing "
            "status.",
            is_read=False,
            recipient_id=workflow_step_instance.created_by,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()


def create_rejection_notification_for_submitter(workflow_step_instance):
    if workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.DRAFT_TO_PLANNED:
        message = "The budget lines you sent to your Division Director were declined from draft to planned status. "
        if workflow_step_instance.notes:
            message += (
                "Please review the notes below, edit and re-submit. "
                + "\n\\\n\\\nNotes: "
                + workflow_step_instance.notes
            )
        notification = Notification(
            title="Budget Lines Rejected from changing from Draft to Planned Status",
            message=message,
            is_read=False,
            recipient_id=workflow_step_instance.created_by,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()
    elif workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.PLANNED_TO_EXECUTING:
        message = "The budget lines you sent to your Division Director were declined from planned to executing status. "
        if workflow_step_instance.notes:
            message += (
                "Please review the notes below, edit and re-submit."
                + "\n\\\n\\\nNotes: "
                + workflow_step_instance.notes
            )
        notification = Notification(
            title="Budget Lines Declined from Planned to Executing Status",
            message=message,
            is_read=False,
            recipient_id=workflow_step_instance.created_by,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()


def create_rejection_notification_for_project_officer(workflow_step_instance: WorkflowStepInstance):
    submitter_id = workflow_step_instance.created_by
    # find project_officer_id
    results = current_app.db_session.execute(
        sa.select(Agreement)
        .join(BudgetLineItem, BudgetLineItem.agreement_id == Agreement.id)
        .join(PackageSnapshot, PackageSnapshot.bli_id == BudgetLineItem.id)
        .join(Package, Package.id == PackageSnapshot.package_id)
        .join(WorkflowInstance, WorkflowInstance.id == Package.workflow_instance_id)
        .join(WorkflowStepInstance, WorkflowStepInstance.workflow_instance_id == WorkflowInstance.id)
        .where(WorkflowStepInstance.id == workflow_step_instance.id)
    ).first()
    agreement = results[0] if len(results) > 0 else None
    project_officer_id = agreement.project_officer.id if agreement and agreement.project_officer else None
    # don't create a notification if there is not a project officer, or if it's the same as the submitter,
    if not project_officer_id or project_officer_id == submitter_id:
        return

    # TODO: make better messages, so it's clear what submission got rejected
    if workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.DRAFT_TO_PLANNED:
        message = "Budget lines sent to the Division Director were declined from draft to planned status. "
        if workflow_step_instance.notes:
            message += (
                "The notes below were sent to the submitter." + "\n\\\n\\\nNotes: " + workflow_step_instance.notes
            )
        notification = Notification(
            title="Budget Lines Rejected from changing from Draft to Planned Status",
            message=message,
            is_read=False,
            recipient_id=workflow_step_instance.created_by,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()
    elif workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.PLANNED_TO_EXECUTING:
        message = "The budget lines you sent to your Division Director were declined from planned to executing status. "
        if workflow_step_instance.notes:
            message += (
                "The notes below were sent to the submitter." + "\n\\\n\\\nNotes: " + workflow_step_instance.notes
            )
        notification = Notification(
            title="Budget Lines Declined from Planned to Executing Status",
            message=message,
            is_read=False,
            recipient_id=workflow_step_instance.created_by,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()
