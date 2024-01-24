from datetime import date, datetime

from flask import Response, current_app, request
from flask_jwt_extended import verify_jwt_in_request
from marshmallow import Schema, fields
from models.base import BaseModel
from models.cans import BudgetLineItem, BudgetLineItemStatus
from models.notifications import Notification
from models.workflows import WorkflowAction, WorkflowStatus, WorkflowStepInstance
from ops_api.ops.base_views import BaseItemAPI, handle_api_error
from ops_api.ops.utils.auth import Permission, PermissionType, is_authorized
from ops_api.ops.utils.response import make_response_with_headers
from ops_api.ops.utils.user import get_user_from_token
from typing_extensions import override

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

    @override
    @is_authorized(PermissionType.PATCH, Permission.WORKFLOW)
    @handle_api_error
    def post(self) -> Response:
        # TODO: Using a dataclass schema for ApprovalSubmissionData, load data from request.json

        workflow_step_id = request.json.get("workflow_step_id")
        workflow_step_action = request.json.get("workflow_step_action")
        workflow_notes = request.json.get("workflow_notes")

        token = verify_jwt_in_request()
        user = get_user_from_token(token[1])

        workflow_step_instance = current_app.db_session.get(WorkflowStepInstance, workflow_step_id)
        if user.id not in workflow_step_instance.approvers["users"]:
            return make_response_with_headers({"message": "User is not an approver for this step"}, 401)
        # TODO: Create a better principal check for users/groups/roles

        if workflow_step_action == "APPROVE":
            # Update WorkflowStepInstance
            workflow_step_instance.status = WorkflowStatus.APPROVED
            workflow_step_instance.time_completed = datetime.now()
            workflow_step_instance.notes = workflow_notes
            workflow_step_instance.updated_by = user.id

            # If there are successor dependencies, update the workflow instance to the next step
            workflow_step_instance.workflow_instance.current_workflow_step_instance_id = (
                workflow_step_instance.successor_dependencies[0]
                if workflow_step_instance.successor_dependencies
                else None
            )
            current_app.db_session.add(workflow_step_instance)
            current_app.db_session.commit()

            create_approval_notification_for_submitter(workflow_step_instance)

            update_blis(workflow_step_instance)

            return make_response_with_headers(
                {
                    "message": "Workflow Status Accepted",
                    "id": workflow_step_instance.id,
                },
                200,
            )

        elif workflow_step_action == "REJECT":
            # Update WorkflowStepInstance
            workflow_step_instance.status = WorkflowStatus.REJECTED
            workflow_step_instance.time_completed = datetime.now()
            workflow_step_instance.notes = workflow_notes
            workflow_step_instance.updated_by = user.id

            # If there are successor dependencies, update the workflow instance to the next step
            workflow_step_instance.workflow_instance.current_workflow_step_instance_id = (
                workflow_step_instance.successor_dependencies[0]
                if workflow_step_instance.successor_dependencies
                else None
            )
            current_app.db_session.add(workflow_step_instance)
            current_app.db_session.commit()

            create_rejection_notification_for_submitter(workflow_step_instance)
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
    if workflow_step_instance.workflow_instance.workflow_status == WorkflowStatus.APPROVED:
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
        notification = Notification(
            title="Budget Lines Rejected from changing from Draft to Planned Status",
            message="The budget lines you sent to your Division Director were rejected from changing from draft to "
            "planned status.",
            is_read=False,
            recipient_id=workflow_step_instance.created_by,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()
    elif workflow_step_instance.workflow_instance.workflow_action == WorkflowAction.PLANNED_TO_EXECUTING:
        notification = Notification(
            title="Budget Lines rejected from changing from Planned to Executing Status",
            message="The budget lines you sent to your Division Director were rejected from changing from planned "
            "to executing status.",
            is_read=False,
            recipient_id=workflow_step_instance.created_by,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
        current_app.db_session.commit()
