"""Workflow models."""
from enum import Enum
from typing import Any, ClassVar, Optional, cast

import sqlalchemy as sa
from models.base import BaseModel
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import InstrumentedAttribute, relationship, with_polymorphic
from typing_extensions import override


class WorkflowType(Enum):
    APPROVAL = 1
    DOCUMENT_MGMT = 2
    VALIDATION = 3
    PROCUREMENT = 4

class WorkflowStatus(Enum):
    REVIEW = "In-Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CHANGES = "Changes Required"


class WorkflowTriggerType(Enum):
    CAN = 1
    PROCUREMENT_SHOP = 2


class PackageType(Enum):
    BLI = 1


class WorkflowTemplate(BaseModel):
    """ Workflow structure without being tied to any specific real-world entity """
    __tablename__ = "workflow_template"
    id = sa.Column(sa.Integer, sa.Identity(always=True, start=1, cycle=True), primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    steps = relationship("WorkflowStepTemplate", backref="workflow_template")


class WorkflowInstance(BaseModel):
    """Main Workflow model.
       It should be considered the top-level container for a workflows.
       TODO: determine if this should be locked to a CAN, or Procurement Shop, both or
             any other object that may require a workflow. For now, going to attempt a generic
             approach with `associated_id` and `associated_type` fields.
    """
    __tablename__ = "workflow_instance"
    id = sa.Column(sa.Integer, sa.Identity(always=True, start=1, cycle=True), primary_key=True)
    associated_id = sa.Column(sa.Integer, nullable=False)
    associated_type = sa.Column(sa.Enum(WorkflowTriggerType), nullable=False)  # could use Enum based on the entities
    workflow_template_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_template.id"))
    steps = relationship("WorkflowStepInstance", backref="workflow_instance")
    #prop
    # overall_status - calculated
    # current_step - calculated based on status of steps


class WorkflowStepTemplate(BaseModel):
    """ Step structure belonging to a WorkflowTemplate """
    __tablename__ = "workflow_step_template"
    id = sa.Column(sa.Integer, sa.Identity(always=True, start=1, cycle=True), primary_key=True)
    name = sa.Column(sa.String, nullable=False)
    workflow_template_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_template.id"))
    workflow_type = sa.Column(sa.Enum(WorkflowType), nullable=False)
    index = sa.Column(sa.Integer, nullable=False)
    step_approvers = relationship("StepApprovers", backref="step_template")


class WorkflowStepInstance(BaseModel):
    """ Specific instance of a WorkflowStepTemplate
        This is intended to be a one-to-many relationship between WorkflowsInstance and workflow steps.
        This effectively outlines the steps in a workflow, and the order in which they are completed.
    """
    __tablename__ = "workflow_step_instance"
    id = sa.Column(sa.Integer, sa.Identity(always=True, start=1, cycle=True), primary_key=True)
    workflow_instance_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_instance.id"))
    workflow_step_template_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_step_template.id"))
    status = sa.Column(sa.Enum(WorkflowStatus), nullable=False)
    notes = sa.Column(sa.String, nullable=True)
    time_started = sa.Column(sa.DateTime, nullable=True)
    time_completed = sa.Column(sa.DateTime, nullable=True)
    successor_dependencies = relationship(
        "WorkflowStepDependency",
        foreign_keys="WorkflowStepDependency.predecessor_step_id",
        back_populates="predecessor_step",
        cascade="all, delete-orphan"
    )
    predecessor_dependencies = relationship(
        "WorkflowStepDependency",
        foreign_keys="WorkflowStepDependency.successor_step_id",
        back_populates="successor_step",
        cascade="all, delete-orphan"
    )

class Package(BaseModel):
    """Base package, used for sending groups of things around in a workflow
    """

    _subclasses: ClassVar[dict[Optional[PackageType], type["Package"]]] = {}

    __tablename__ = "package"

    id = sa.Column(sa.Integer, sa.Identity(always=True, start=1, cycle=True), primary_key=True)
    submitter_id = (sa.Integer, sa.ForeignKey("user.id"))
    current_workflow_step_instance_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_step_instance.id"))
    notes = sa.Column(sa.String, nullable=True)
    package_type = sa.Column(sa.Enum(PackageType), nullable=False)
    package_snapshots = relationship("PackageSnapshot", backref="package")

    @BaseModel.display_name.getter
    def display_name(self):
        return f"{self.package_type}-Package-{self.id}"

    __mapper_args__: dict[str, str | PackageType] = {
        "polymorphic_identity": "package",
        "polymorphic_on": "package_type",
    }

    def __init_subclass__(cls, package_type: PackageType, **kwargs: Any) -> None:
        cls._subclasses[package_type] = cls
        super().__init_subclass__(**kwargs)

    # @classmethod
    # def get_polymorphic(cls, package_type: PackageType) -> type["Package"]:
    #     return cast(type[Package], cls._subclasses[package_type])


    @classmethod
    def get_polymorphic(cls) -> "Package":
        return with_polymorphic(Package, list(cls._subclasses.values()))

    @classmethod
    def get_class_field(cls, field_name: str) -> InstrumentedAttribute:
        if field_name in set(Package.columns):
            table_class = Package
        else:
            for subclass in cls._subclasses.values():
                if field_name in set(subclass.columns):
                    table_class = subclass
                    break
            else:
                raise ValueError(f"Column name does not exist for packages: {field_name}")
        return getattr(table_class, field_name)

    @classmethod
    def get_class(cls, package_type: Optional[PackageType] = None) -> type["Package"]:
        try:
            return cls._subclasses[package_type]
        except KeyError:
            return Package

    @override
    def to_dict(self) -> dict[str, Any]:  # type: ignore[override]
        d: dict[str, Any] = super().to_dict()  # type: ignore[no-untyped-call]

        if isinstance(self.package_type, str):
            self.package_type = PackageType(self.package_type)

        d.update(
            package_type=self.package_type.name if self.package_type else None,
        )
        return d

class BliPackage(Package, package_type=PackageType.BLI):
    """Budget Line Item Package
    """
    __tablename__ = "bli_package"
    id = sa.Column(sa.Integer, sa.ForeignKey("package.id"), primary_key=True)
    bli_package_snapshots = relationship("BliPackageSnapshot", backref="bli_package")

    __mapper_args__ = {
        "polymorphic_identity": PackageType.BLI,
    }


class PackageSnapshot(BaseModel):
    __tablename__ = "package_snapshot"
    id = sa.Column(sa.Integer, sa.Identity(always=True, start=1, cycle=True), primary_key=True)
    package_id = sa.Column(sa.Integer, sa.ForeignKey("package.id"), nullable=False)
    version = sa.Column(sa.Integer, nullable=True)


class BliPackageSnapshot(PackageSnapshot):
    __tablename__ = "bli_package_snapshot"
    id = sa.Column(sa.Integer, sa.ForeignKey("package_snapshot.id"), primary_key=True)
    #bli_package_id = sa.Column(sa.Integer, sa.ForeignKey("bli_package.id"))
    #bli_version_id = sa.Column(sa.Integer, sa.ForeignKey("budget_line_item_version.id"), nullable=True)
    bli_id = sa.Column(sa.Integer, sa.ForeignKey("budget_line_item.id"), nullable=False)


class WorkflowStepDependency(BaseModel):
    """ Association model to handle multiple dependencies between WorkflowStepInstances """
    __tablename__ = "workflow_step_dependency"
    predecessor_step_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_step_instance.id"), primary_key=True)
    successor_step_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_step_instance.id"), primary_key=True)
    predecessor_step = relationship(
        "WorkflowStepInstance",
        foreign_keys=[predecessor_step_id],
        overlaps="predecessor_step_instance,successor_dependencies"
    )
    successor_step = relationship(
        "WorkflowStepInstance",
        foreign_keys=[successor_step_id],
        back_populates="predecessor_dependencies"
    )


class StepApprovers(BaseModel):
    """ Step Approvers model for WorkflowStepTemplates """
    __tablename__ = "step_approvers"
    id = sa.Column(sa.Integer, sa.Identity(always=True, start=1, cycle=True), primary_key=True)
    workflow_step_template_id = sa.Column(sa.Integer, sa.ForeignKey("workflow_step_template.id"))
    user_id = sa.Column(sa.Integer, sa.ForeignKey("users.id"), nullable=True)
    role_id = sa.Column(sa.Integer, sa.ForeignKey("roles.id"), nullable=True)
    group_id = sa.Column(sa.Integer, sa.ForeignKey("groups.id"), nullable=True)
