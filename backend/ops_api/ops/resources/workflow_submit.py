from dataclasses import dataclass
from datetime import date, datetime

from flask import Response, current_app, request
from flask_jwt_extended import current_user
from marshmallow import EXCLUDE, Schema, fields

from models.base import BaseModel
from models.cans import BudgetLineItem, BudgetLineItemStatus
from models.notifications import Notification
from models.workflows import (
    Package,
    PackageSnapshot,
    WorkflowAction,
    WorkflowInstance,
    WorkflowStepInstance,
    WorkflowStepStatus,
    WorkflowTriggerType,
)
from ops_api.ops.auth.auth_types import Permission, PermissionType
from ops_api.ops.auth.decorators import is_authorized
from ops_api.ops.base_views import BaseItemAPI
from ops_api.ops.schemas.budget_line_items import PATCHRequestBodySchema
from ops_api.ops.utils.response import make_response_with_headers

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

    @is_authorized(PermissionType.POST, Permission.BLI_PACKAGE)
    def post(self) -> Response:
        current_app.logger.info(f"********** /approve Request: {request.json}")

        # TODO: Using a dataclass schema for ApprovalSubmissionData, load data from request.json

        budget_line_item_ids = request.json.get("budget_line_item_ids", [])
        submission_notes = request.json.get("notes")
        # Capture the use-case for this package (DRAFT_TO_PLANNED or PLANNED_TO_EXECUTED)
        requested_workflow_action = request.json.get("workflow_action")
        workflow_action = WorkflowAction[requested_workflow_action]
        target_bli_status = (
            BudgetLineItemStatus.PLANNED
            if workflow_action == WorkflowAction.DRAFT_TO_PLANNED
            else BudgetLineItemStatus.IN_EXECUTION if workflow_action == WorkflowAction.PLANNED_TO_EXECUTING else None
        )
        # Create new Package
        new_package = Package()

        if submitter_id := request.json.get("submitter_id"):
            new_package.submitter_id = submitter_id

        new_package.submitter_id = current_user.id
        new_package.notes = submission_notes
        agreement_id = None
        # Create PackageSnapshot
        # Handle budget_line_item IDs and create PackageSnapshot records
        for bli_id in budget_line_item_ids:
            bli = current_app.db_session.get(BudgetLineItem, bli_id)

            if bli:
                pending_changes = {"status": target_bli_status.name}
                validate_bli(bli, pending_changes)
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
        workflow_instance.workflow_action = workflow_action

        #  In order to know which workflow to follow, ie: who to send the approval request to,
        #  we need to know which CAN the BLIs are associated with. This is the associated_id,
        #  and the associated_type will be "CAN".
        #  TODO: this should step over the `bli_cans` list and create a workflow step instance for each CAN,
        #  but for now, going to assume the first BLI CAN is all we need, to ensure the process works.
        workflow_instance.associated_id = 1  # bli_cans[0]
        workflow_instance.associated_type = WorkflowTriggerType.CAN

        workflow_step_instance = WorkflowStepInstance(
            workflow_step_template_id=2,
            status=WorkflowStepStatus.REVIEW,
            time_started=datetime.now(),
            successor_dependencies=[],
            predecessor_dependencies=[],
        )
        current_app.logger.info(f"Workflow Step Instance: {workflow_step_instance}")

        workflow_instance.steps.append(workflow_step_instance)

        # WIP: commit our new workflow instance
        current_app.db_session.add(workflow_instance)
        current_app.db_session.commit()
        workflow_instance.current_workflow_step_instance_id = workflow_step_instance.id
        current_app.db_session.add(workflow_instance)
        current_app.db_session.commit()

        # updated the current step in the bli package to the first step in the workflow
        new_package.workflow_instance_id = workflow_instance.id

        # commit our new bli package
        current_app.db_session.add(new_package)
        current_app.db_session.commit()

        new_package_dict = new_package.to_dict()
        current_app.logger.info(f"POST to {ENDPOINT_STRING}: New Bli Package created: {new_package_dict}")

        create_notification_for_division_directors(agreement_id, workflow_step_instance, budget_line_item_ids)

        return make_response_with_headers({"message": "Bli Package created", "id": new_package.id}, 201)


def validate_bli(bli: BudgetLineItem, pending_changes: dict):
    if bli is None:
        raise ValueError("bli is a required argument")
    schema = PATCHRequestBodySchema()
    schema.context["id"] = bli.id
    schema.context["method"] = "PATCH"
    # validate
    schema.dump(schema.load(pending_changes, unknown=EXCLUDE))
    return


def create_notification_for_division_directors(agreement_id, workflow_step_instance, budget_line_item_ids):
    # TODO: get division director IDs
    # There's currently no data in division.division_director_id
    #
    # SQL test query
    # select distinct division.division_director_id
    # from ops.budget_line_item
    # join ops.can on budget_line_item.can_id = can.id
    # join ops.portfolio on can.managing_portfolio_id = portfolio.id
    # join ops.division on portfolio.division_id = division.id
    # where budget_line_item.id in (1,2)
    #
    # import sqlalchemy as sa
    # from models import Division, Portfolio
    # from models.cans import CAN
    # results = current_app.db_session.execute(
    #     sa.select(Division.division_director_id)
    #     .join(Portfolio, Division.id == Portfolio.division_id)
    #     .join(CAN, Portfolio.can_id == CAN.id)
    #     .join(BudgetLineItem, CAN.id == BudgetLineItem.can_id)
    #     .where(BudgetLineItem.in_(budget_line_item_ids))
    # ).all()
    division_director_ids = [520, 522]
    fe_url = current_app.config.get("OPS_FRONTEND_URL")
    approve_url = f"{fe_url}/agreements/approve/{agreement_id}?stepId={workflow_step_instance.id}"
    for division_director_id in division_director_ids:
        notification = Notification(
            title="Approval Request",
            # NOTE: approve_url only renders as plain text in default react-markdown
            message=f"An Agreement Approval Request has been submitted. "
            f"Please review and approve. \n\\\n\\[Link]({approve_url})",
            is_read=False,
            recipient_id=division_director_id,
            expires=date(2031, 12, 31),
        )
        current_app.db_session.add(notification)
    current_app.db_session.commit()
