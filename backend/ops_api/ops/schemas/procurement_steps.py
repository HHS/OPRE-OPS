from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass(kw_only=True)
class ProcurementStepRequest:
    # Should we include type to handle a generic list endpoint?
    type: Optional[str] = None
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass(kw_only=True)
class ProcurementStepResponse(ProcurementStepRequest):
    # Is it possible to move this to the parent and eliminate this class
    # and use schema constructor args like dump_only instead of separate schemas?
    id: int


@dataclass(kw_only=True)
class Attestation:
    is_complete: Optional[bool] = None
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None


@dataclass(kw_only=True)
class TargetDate:
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})


@dataclass(kw_only=True)
class AcquisitionPlanningResponse(ProcurementStepResponse, Attestation):
    pass


@dataclass(kw_only=True)
class AcquisitionPlanningRequest(ProcurementStepRequest, Attestation):
    pass


@dataclass(kw_only=True)
class AcquisitionPlanningRequestPost(AcquisitionPlanningRequest):
    agreement_id: int


@dataclass(kw_only=True)
class AcquisitionPlanningPatch(AcquisitionPlanningRequest):
    pass


@dataclass
class PreSolicitationResponse(ProcurementStepResponse, Attestation, TargetDate):
    pass


@dataclass
class SolicitationResponse(ProcurementStepResponse, Attestation, TargetDate):
    pass


@dataclass
class EvaluationResponse(ProcurementStepResponse, Attestation, TargetDate):
    pass


@dataclass
class PreAwardResponse(ProcurementStepResponse, Attestation, TargetDate):
    pass


@dataclass
class AwardResponse(ProcurementStepResponse, Attestation, TargetDate):
    vendor: Optional[str] = None
    vendor_type: Optional[str] = None
    financial_number: Optional[str] = None
