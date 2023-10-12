"""Workflow models."""
from typing import Any, cast

from models.base import BaseModel
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Identity, Integer, String, Table, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import column_property, relationship
from typing_extensions import override


class WorkflowType(Enum):
    APPROVAL = 1
    DOCUMENT_MGMT = 2
    VALIDATION = 3

class WorkflowStatus(Enum):
    REVIEW = "In-Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CHANGES = "Changes Required"

class Workflow(BaseModel):
    """Main Workflow model.
       This is intended to be a one-to-one relationship between a CAN and a workflow.
       This effectively outlines the workflow for a CAN.
       It should be considered the top-level container for workflows.
       TODO: determine if this should be locked to a CAN, or Procurement Shop, both or
             any other object that may require a workflow.
    """
    __tablename__ = "workflow"
    id = Column(Integer, Identity(always=True, start=1, cycle=True), primary_key=True)
    name = Column(String, nullable=False)
    workflow_type = Column(Enum(WorkflowType), nullable=False)
    can_id = Column(Integer, ForeignKey("can.id"))

class WorkflowStep(BaseModel):
    """ Main Workflow Step model.
        This is intended to be a one-to-many relationship between workflows and workflow steps.
        This effectively outlines the steps in a workflow, and the order in which they are completed.
    """
    __tablename__ = "workflow_step"
    id = Column(Integer, Identity(always=True, start=1, cycle=True), primary_key=True)
    name = Column(String, nullable=False)
    workflow_id = Column(Integer, ForeignKey("workflow.id"))
    workflow = relationship("Workflow", backref="workflow_steps")
    workflow_type = Column(Enum(WorkflowType), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"))
    role_id = Column(Integer, ForeignKey("role.id"))
    step_approvers = relationship("StepApprovers", backref="step_approvers")
    index = Column(Integer, nullable=False)
    is_last_step = Column(Boolean, nullable=False)
    completed = Column(Boolean, nullable=False)
    status = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    time_completed = Column(DateTime, nullable=True)
    successor_dependencies = relationship(
        "WorkflowStepDependency",
        foreign_keys="WorkflowStepDependency.predecessor_step_id",
        backref="predecessor_step",
        cascade="all, delete-orphan"
    )
    predecessor_dependencies = relationship(
        "WorkflowStepDependency",
        foreign_keys="WorkflowStepDependency.successor_step_id",
        backref="successor_step",
        cascade="all, delete-orphan"
    )


class WorkflowStepDependency(BaseModel):
    """ Association model to handle multiple dependencies between WorkflowSteps. """

    __tablename__ = "workflow_step_dependency"
    predecessor_step_id = Column(Integer, ForeignKey("workflow_step.id"), primary_key=True)
    successor_step_id = Column(Integer, ForeignKey("workflow_step.id"), primary_key=True)
    predecessor_step = relationship("WorkflowStep", foreign_keys=[predecessor_step_id])
    successor_step = relationship("WorkflowStep", foreign_keys=[successor_step_id])

class StepApprovers(BaseModel):
    """ Step Approvers model.
        This is intended to be a many-to-many relationship between workflow steps and users.
        This effectively outlines who can approve a step in a workflow.
    """
    __tablename__ = "step_approvers"
    id = Column(Integer, Identity(always=True, start=1, cycle=True), primary_key=True)
    workflow_step_id = Column(Integer, ForeignKey("workflow_step.id"))
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    role_id = Column(Integer, ForeignKey("role.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("group.id"), nullable=True)
