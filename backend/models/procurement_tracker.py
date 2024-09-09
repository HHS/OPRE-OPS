from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from models import BaseModel


class ProcurementTracker(BaseModel):
    __tablename__ = "procurement_tracker"
    id = BaseModel.get_pk_column()
    agreement_id = Column(Integer, ForeignKey("agreement.id"))
    procurement_steps = relationship(
        "ProcurementStep",
        back_populates="procurement_tracker",
        foreign_keys="ProcurementStep.procurement_tracker_id",
    )
    current_step_id = Column(Integer, ForeignKey("procurement_step.id"), nullable=True)


class ProcurementStep(BaseModel):
    __tablename__ = "procurement_step"

    id = BaseModel.get_pk_column()
    agreement_id = Column(Integer, ForeignKey("agreement.id"))
    procurement_tracker_id = Column(Integer, ForeignKey("procurement_tracker.id"))
    procurement_tracker = relationship(
        "ProcurementTracker",
        back_populates="procurement_steps",
        foreign_keys=[procurement_tracker_id],
    )

    type = Column(String, nullable=False)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_step",
        "polymorphic_on": type,
    }


class Attestation(object):
    is_complete = Column(Boolean, nullable=False, default=False)
    actual_date = Column(Date, nullable=True)
    completed_by = Column(Integer, ForeignKey("ops_user.id"), nullable=True)
    notes = Column(String, nullable=True)


class TargetDate(object):
    target_date = Column(Date, nullable=True)


class AcquisitionPlanning(ProcurementStep, Attestation):
    __tablename__ = "procurement_acquisition_planning"
    id = Column(Integer, ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_acquisition_planning",
    }


class PreSolicitation(ProcurementStep, Attestation, TargetDate):
    __tablename__ = "procurement_pre_solicitation"
    id = Column(Integer, ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_pre_solicitation",
    }
    # documents = relationship("PreSolicitationDocument", backref="pre_solicitation")


class Solicitation(ProcurementStep, Attestation, TargetDate):
    __tablename__ = "procurement_solicitation"
    id = Column(Integer, ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_solicitation",
    }


class Evaluation(ProcurementStep, Attestation, TargetDate):
    __tablename__ = "procurement_evaluation"
    id = Column(Integer, ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_evaluation",
    }


class PreAward(ProcurementStep, Attestation, TargetDate):
    __tablename__ = "procurement_preaward"
    id = Column(Integer, ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_preaward",
    }


class Award(ProcurementStep, Attestation):
    __tablename__ = "procurement_award"
    id = Column(Integer, ForeignKey("procurement_step.id"), primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "procurement_award",
    }
    vendor = Column(String, nullable=True)
    vendor_type = Column(String, nullable=True)
    financial_number = Column(String, nullable=True)
