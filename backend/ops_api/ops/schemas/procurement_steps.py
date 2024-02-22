from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class ProcurementStepResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class AcquisitionPlanningResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class AcquisitionPlanningPost:
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None


@dataclass
class AcquisitionPlanningPatch:
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None


@dataclass
class PreSolicitationResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class SolicitationResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class EvaluationResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class PreAwardResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    target_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None


@dataclass
class AwardResponse:
    id: int
    agreement_id: Optional[int] = None
    workflow_step_id: Optional[int] = None
    is_complete: Optional[bool] = None
    actual_date: Optional[datetime] = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    completed_by: Optional[int] = None
    updated_on: datetime = field(default=None, metadata={"format": "%Y-%m-%dT%H:%M:%S.%fZ"})
    created_by: Optional[int] = None
    vendor: Optional[str] = None
    vendor_type: Optional[str] = None
    financial_number: Optional[str] = None
