from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional


@dataclass(kw_only=True)
class ProcurementStepRequest:
    type: Optional[str] = None
    agreement_id: Optional[int] = None
    procurement_tracker_id: Optional[int] = None
    # From BaseModel
    display_name: Optional[str] = None
    created_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[str] = None
    # created_by_user: Optional[dict] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})


@dataclass(kw_only=True)
class ProcurementStepListQuery:
    agreement_id: Optional[int] = None


@dataclass(kw_only=True)
class ProcurementStepResponse(ProcurementStepRequest):
    # response includes ID even while request doesn't
    # Is it possible to move this to the parent (request) and eliminate this class
    # and use schema constructor args like dump_only instead of separate schemas?
    id: int


@dataclass(kw_only=True)
class Attestation:
    is_complete: Optional[bool] = None
    actual_date: Optional[date] = field(default=None, metadata={"format": "%Y-%m-%d"})
    completed_by: Optional[int] = None
    notes: Optional[str] = None


@dataclass(kw_only=True)
class TargetDate:
    target_date: Optional[date] = field(default=None, metadata={"format": "%Y-%m-%d"})


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
class PreSolicitationResponse(ProcurementStepResponse, Attestation, TargetDate):
    pass


@dataclass(kw_only=True)
class PreSolicitationRequest(ProcurementStepRequest, Attestation, TargetDate):
    pass


@dataclass(kw_only=True)
class SolicitationResponse(ProcurementStepResponse, Attestation, TargetDate):
    pass


@dataclass(kw_only=True)
class SolicitationRequest(ProcurementStepRequest, Attestation, TargetDate):
    pass


@dataclass(kw_only=True)
class EvaluationResponse(ProcurementStepResponse, Attestation, TargetDate):
    pass


@dataclass(kw_only=True)
class EvaluationRequest(ProcurementStepRequest, Attestation, TargetDate):
    pass


@dataclass(kw_only=True)
class PreAwardResponse(ProcurementStepResponse, Attestation, TargetDate):
    pass


@dataclass(kw_only=True)
class PreAwardRequest(ProcurementStepRequest, Attestation, TargetDate):
    pass


@dataclass(kw_only=True)
class AwardResponse(ProcurementStepResponse, Attestation):
    vendor: Optional[str] = None
    vendor_type: Optional[str] = None
    financial_number: Optional[str] = None


@dataclass(kw_only=True)
class AwardRequest(ProcurementStepRequest, Attestation):
    vendor: Optional[str] = None
    vendor_type: Optional[str] = None
    financial_number: Optional[str] = None
