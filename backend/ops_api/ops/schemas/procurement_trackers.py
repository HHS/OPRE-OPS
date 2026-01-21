"""Schemas for procurement tracker endpoints."""

from marshmallow import EXCLUDE, Schema, fields, post_dump

from models.procurement_tracker import (
    ProcurementTrackerStatus,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
    ProcurementTrackerType,
)
from ops_api.ops.schemas.pagination import PaginationListSchema


class ProcurementTrackerStepSchema(Schema):
    """Schema for procurement tracker step serialization."""

    class Meta:
        unknown = EXCLUDE

    # Base fields common to all steps
    id = fields.Integer(required=True)
    procurement_tracker_id = fields.Integer(required=True)
    step_number = fields.Integer(required=True)
    step_type = fields.Enum(ProcurementTrackerStepType, required=True)
    status = fields.Enum(ProcurementTrackerStepStatus, required=True)
    step_start_date = fields.Date(allow_none=True)
    step_completed_date = fields.Date(allow_none=True)

    # ACQUISITION_PLANNING-specific fields (use prefixed names from model, rename in output)
    acquisition_planning_task_completed_by = fields.Integer(
        allow_none=True, data_key="task_completed_by", attribute="acquisition_planning_task_completed_by"
    )
    acquisition_planning_date_completed = fields.Date(
        allow_none=True, data_key="date_completed", attribute="acquisition_planning_date_completed"
    )
    acquisition_planning_notes = fields.String(
        allow_none=True, data_key="notes", attribute="acquisition_planning_notes"
    )

    @post_dump
    def remove_none_acquisition_fields(self, data, **kwargs):
        """
        Remove ACQUISITION_PLANNING-specific fields for non-ACQUISITION_PLANNING steps.

        For ACQUISITION_PLANNING steps, keep these fields even if None.
        For other step types, remove these fields entirely.
        """
        acquisition_fields = ["task_completed_by", "date_completed", "notes"]

        # Only remove fields if this is NOT an ACQUISITION_PLANNING step
        if data.get("step_type") != "ACQUISITION_PLANNING":
            for field in acquisition_fields:
                data.pop(field, None)

        return data


class ProcurementTrackerResponseSchema(Schema):
    """Schema for procurement tracker response."""

    class Meta:
        unknown = EXCLUDE

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    status = fields.Enum(ProcurementTrackerStatus, required=True)
    procurement_action = fields.Integer(allow_none=True)
    tracker_type = fields.Enum(ProcurementTrackerType, required=True)
    active_step_number = fields.Integer(allow_none=True)

    # Nested steps
    steps = fields.List(fields.Nested(ProcurementTrackerStepSchema), allow_none=True)


class QueryParametersSchema(PaginationListSchema):
    """Schema for GET /procurement-trackers endpoint query parameters."""

    class Meta:
        unknown = EXCLUDE

    # Filtering parameters (all are lists since HTTP allows multiple values)
    agreement_id = fields.List(fields.Integer(), required=False)
