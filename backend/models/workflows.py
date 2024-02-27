"""Workflow models."""

from enum import Enum, auto

import sqlalchemy as sa
from models.base import BaseModel
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import object_session, relationship
from typing_extensions import Any, override


class WorkflowAction(Enum):
    DRAFT_TO_PLANNED = 1
    PLANNED_TO_EXECUTING = 2
    GENERIC = 3


class WorkflowStepType(Enum):
    APPROVAL = 1
    DOCUMENT_MGMT = 2
    VALIDATION = 3
    PROCUREMENT = 4
    ATTESTATION = 5


class WorkflowStepStatus(Enum):
    REVIEW = "In-Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CHANGES = "Changes Required"
    COMPLETE = "Complete"


class WorkflowTriggerType(Enum):
    CAN = auto()
    PROCUREMENT_SHOP = auto()
    AGREEMENT = auto()


class WorkflowTemplate(BaseModel):
    """Workflow structure without being tied to any specific real-world entity"""

    __tablename__ = "workflow_template"
    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    steps = relationship("WorkflowStepTemplate", backref="workflow_template")

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class WorkflowInstance(BaseModel):
    """Main Workflow model.
    It should be considered the top-level container for a workflows.
    TODO: determine if this should be locked to a CAN, or Procurement Shop, both or
          any other object that may require a workflow. For now, going to attempt a generic
          approach with `associated_id` and `associated_type` fields.
    """

    __tablename__ = "workflow_instance"

    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    associated_id = sa.Column(sa.Integer, nullable=False)
    associated_type = sa.Column(
        sa.Enum(WorkflowTriggerType), nullable=False
    )  # could use Enum based on the entities
    workflow_template_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_template.id"))
    steps = relationship("WorkflowStepInstance", backref="workflow_instance")
    workflow_action = sa.Column(sa.Enum(WorkflowAction), nullable=False)
    current_workflow_step_instance_id = sa.Column(sa.Integer, nullable=True)

    # REJECTED = "Rejected" (any --> Rejected)
    # CHANGES = "Changes Required" (any --> Changes Required)
    # REVIEW = "In-Review" (any --> In-Review)
    # APPROVED = "Approved" (all --> Approved)

    @property
    def workflow_status(self):
        status_order = [
            WorkflowStepStatus.REJECTED,
            WorkflowStepStatus.CHANGES,
            WorkflowStepStatus.REVIEW,
        ]
        return next(
            (
                status
                for status in status_order
                if any(item.status == status for item in self.steps)
            ),
            (
                WorkflowStepStatus.APPROVED
                if all(
                    item.status == WorkflowStepStatus.APPROVED for item in self.steps
                )
                else None
            ),
        )

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore[override]
        d: dict[str, Any] = super().to_dict()  # type: ignore[no-untyped-call]

        if isinstance(self.associated_type, str):
            self.associated_type = WorkflowTriggerType[self.associated_type]

        d.update(
            associated_type=self.associated_type.name if self.associated_type else None,
            workflow_status=self.workflow_status.name if self.workflow_status else None,
            workflow_action=self.workflow_action.name if self.workflow_action else None,
            # package_entities = self.package_entities
        )
        return d


class WorkflowStepTemplate(BaseModel):
    """Step structure belonging to a WorkflowTemplate"""

    __tablename__ = "workflow_step_template"

    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    workflow_template_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_template.id"))
    workflow_type = sa.Column(sa.Enum(WorkflowStepType), nullable=False)
    index = sa.Column(sa.Integer, nullable=False)
    step_approvers = relationship("StepApprovers", backref="workflow_step_template")

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore[override]
        d: dict[str, Any] = super().to_dict()  # type: ignore[no-untyped-call]

        d.update(
            workflow_type=self.workflow_type.name if self.workflow_type else None,
        )
        return d


class WorkflowStepInstance(BaseModel):
    """Specific instance of a WorkflowStepTemplate
    This is intended to be a one-to-many relationship between WorkflowsInstance and workflow steps.
    This effectively outlines the steps in a workflow, and the order in which they are completed.
    """

    __tablename__ = "workflow_step_instance"

    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    workflow_instance_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_instance.id"))
    workflow_step_template_id = sa.Column(
        sa.Integer, sa.ForeignKey("workflow_step_template.id")
    )
    workflow_step_template = relationship(
        "WorkflowStepTemplate", backref="workflow_step_instance"
    )
    status = sa.Column(sa.Enum(WorkflowStepStatus), nullable=False)
    notes = sa.Column(sa.String, nullable=True)
    time_started = sa.Column(sa.DateTime, nullable=True)
    time_completed = sa.Column(sa.DateTime, nullable=True)
    updated_by = sa.Column(sa.Integer, sa.ForeignKey("user.id"), nullable=True)
    successor_dependencies = relationship(
        "WorkflowStepDependency",
        foreign_keys="WorkflowStepDependency.predecessor_step_id",
        back_populates="predecessor_step",
        cascade="all, delete-orphan",
    )
    predecessor_dependencies = relationship(
        "WorkflowStepDependency",
        foreign_keys="WorkflowStepDependency.successor_step_id",
        back_populates="successor_step",
        cascade="all, delete-orphan",
    )

    @property
    def approvers(self):
        if self.workflow_step_template is None:
            return None
        return {
            "users": [
                approver.user_id
                for approver in self.workflow_step_template.step_approvers
                if approver.user_id is not None
            ],
            "groups": [
                approver.group_id
                for approver in self.workflow_step_template.step_approvers
                if approver.group_id is not None
            ],
            "roles": [
                approver.role_id
                for approver in self.workflow_step_template.step_approvers
                if approver.role_id is not None
            ],
        }

    @property
    def package_entities(self):
        if object_session(self) is None:
            return None
        results = (
            object_session(self)
            .execute(
                sa.select(PackageSnapshot.bli_id, Package.notes)
                .join(Package, Package.id == PackageSnapshot.package_id)
                .join(
                    WorkflowInstance,
                    Package.workflow_instance_id == WorkflowInstance.id,
                )
                .join(
                    WorkflowStepInstance,
                    WorkflowInstance.id == WorkflowStepInstance.workflow_instance_id,
                )
                .where(WorkflowInstance.id == self.id)
            )
            .all()
        )
        bli_ids = [row[0] for row in results]
        notes = results[0][1] if len(results) > 0 else None
        return {"budget_line_item_ids": bli_ids, "notes": notes}

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore[override]
        d: dict[str, Any] = super().to_dict()  # type: ignore[no-untyped-call]

        d.update(
            status=self.status.name if self.status else None,
            # TODO: format for these times?
            time_started=str(self.time_started) if self.time_started else None,
            time_completed=str(self.time_completed) if self.time_completed else None,
            package_entities=self.package_entities,
            approvers=self.approvers,
        )
        return d


class WorkflowStepDependency(BaseModel):
    """Association model to handle multiple dependencies between WorkflowStepInstances"""

    __tablename__ = "workflow_step_dependency"
    predecessor_step_id = sa.Column(
        sa.Integer, sa.ForeignKey("workflow_step_instance.id"), primary_key=True
    )
    successor_step_id = sa.Column(
        sa.Integer, sa.ForeignKey("workflow_step_instance.id"), primary_key=True
    )
    predecessor_step = relationship(
        "WorkflowStepInstance",
        foreign_keys=[predecessor_step_id],
        overlaps="predecessor_step_instance,successor_dependencies",
    )
    successor_step = relationship(
        "WorkflowStepInstance",
        foreign_keys=[successor_step_id],
        back_populates="predecessor_dependencies",
    )


class StepApprovers(BaseModel):
    """Step Approvers model for WorkflowStepTemplates"""

    __tablename__ = "step_approvers"
    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    workflow_step_template_id = sa.Column(
        sa.Integer, sa.ForeignKey("workflow_step_template.id")
    )
    user_id = sa.Column(sa.Integer, sa.ForeignKey("user.id"), nullable=True)
    role_id = sa.Column(sa.Integer, sa.ForeignKey("role.id"), nullable=True)
    group_id = sa.Column(sa.Integer, sa.ForeignKey("group.id"), nullable=True)


class Package(BaseModel):
    """Base package, used for sending groups of things around in a workflow"""

    __tablename__ = "package"

    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    submitter_id = sa.Column(sa.Integer, sa.ForeignKey("user.id"))
    workflow_instance_id = sa.Column(
        sa.Integer, sa.ForeignKey("workflow_instance.id"), nullable=True
    )
    notes = sa.Column(sa.String, nullable=True)
    package_snapshots = relationship("PackageSnapshot", backref="package")

    @BaseModel.display_name.getter
    def display_name(self):
        return f"Package-{self.id}"


class PackageSnapshot(BaseModel):
    __tablename__ = "package_snapshot"
    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    # make package_id a read-only field
    package_id = sa.Column(sa.Integer, sa.ForeignKey("package.id"), nullable=True)
    version = sa.Column(sa.Integer, nullable=True)
    # TODO: What should we do when we delete an Agreement (or a BLI)?
    # This CASCADE fixes the existing Agreement delete, but leaves behind empty workflows
    object_type = sa.Column(sa.String, nullable=True)
    object_id = sa.Column(sa.Integer, nullable=True)
    bli_id = sa.Column(
        sa.Integer,
        sa.ForeignKey("budget_line_item.id", ondelete="CASCADE"),
        nullable=True,
    )


# class Procurement(BaseModel):
#     __tablename__ = "procurement"

#     id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
#     workflow_step_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_step_instance.id"))
#     target_date = sa.Column(sa.DateTime, nullable=True)
#     is_complete = sa.Column(sa.Boolean, nullable=False, default=False)
#     actual_date = sa.Column(sa.DateTime, nullable=True)
#     completed_by = sa.Column(sa.Integer, sa.ForeignKey("user.id"), nullable=True)
#     notes = sa.Column(sa.String, nullable=True)
#     documents = relationship("ProcurementDocument", backref="procurement") # todo: need to figure out what to do with Docs


class ProcurementStep(BaseModel):
    __tablename__ = "procurement_step"

    id = sa.Column(sa.Integer, sa.Identity(), primary_key=True)
    agreement_id = sa.Column(sa.Integer, sa.ForeignKey("agreement.id"))
    # TODO: Q: should this be named workflow_step_instance_id (or alternatively leave off _instance in all FKs)
    workflow_step_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_step_instance.id"))

    type = sa.Column(sa.String, nullable=False)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_step",
        "polymorphic_on": type,
    }


class Attestation(object):
    is_complete = sa.Column(sa.Boolean, nullable=False, default=False)
    actual_date = sa.Column(sa.Date, nullable=True)
    completed_by = sa.Column(sa.Integer, sa.ForeignKey("user.id"), nullable=True)
    notes = sa.Column(sa.String, nullable=True)


class TargetDate(object):
    target_date = sa.Column(sa.Date, nullable=True)


class AcquisitionPlanning(ProcurementStep, Attestation):
    __tablename__ = "procurement_acquisition_planning"
    id = sa.Column(sa.Integer, sa.ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_acquisition_planning",
    }


class PreSolicitation(ProcurementStep, Attestation, TargetDate):
    __tablename__ = "procurement_pre_solicitation"
    id = sa.Column(sa.Integer, sa.ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_pre_solicitation",
    }
    # documents = relationship("PreSolicitationDocument", backref="pre_solicitation")


class Solicitation(ProcurementStep, Attestation, TargetDate):
    __tablename__ = "procurement_solicitation"
    id = sa.Column(sa.Integer, sa.ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_solicitation",
    }


class Evaluation(ProcurementStep, Attestation, TargetDate):
    __tablename__ = "procurement_evaluation"
    id = sa.Column(sa.Integer, sa.ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_evaluation",
    }


class PreAward(ProcurementStep, Attestation, TargetDate):
    __tablename__ = "procurement_preaward"
    id = sa.Column(sa.Integer, sa.ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_preaward",
    }


class Award(ProcurementStep, Attestation):
    __tablename__ = "procurement_award"
    id = sa.Column(sa.Integer, sa.ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_award",
    }
    vendor = sa.Column(sa.String, nullable=True)
    vendor_type = sa.Column(sa.String, nullable=True)
    financial_number = sa.Column(sa.String, nullable=True)
