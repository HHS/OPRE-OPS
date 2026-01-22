"""Schemas for procurement tracker steps."""

from marshmallow import EXCLUDE, Schema, fields, post_dump

from models.procurement_tracker import (
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)
from ops_api.ops.schemas.pagination import PaginationListSchema


class ProcurementTrackerStepResponseSchema(Schema):
    """Schema for procurement tracker step responses."""

    id = fields.Integer(required=True)
    procurement_tracker_id = fields.Integer(required=True)
    step_number = fields.Integer(required=True)
    step_class = fields.String(required=True)
    step_type = fields.Enum(ProcurementTrackerStepType, required=True, by_value=False)
    status = fields.Enum(ProcurementTrackerStepStatus, required=True, by_value=False)
    step_start_date = fields.Date(allow_none=True)
    step_completed_date = fields.Date(allow_none=True)

    # Step-specific fields (conditionally included based on step_type)
    task_completed_by = fields.Integer(allow_none=True)
    date_completed = fields.Date(allow_none=True)
    notes = fields.String(allow_none=True)

    # BaseModel fields
    display_name = fields.String(dump_only=True)
    created_on = fields.DateTime(dump_only=True)
    updated_on = fields.DateTime(dump_only=True)

    @post_dump
    def remove_none_values(self, data, **kwargs):
        """Remove None values from the output."""
        return {key: value for key, value in data.items() if value is not None}


class ProcurementTrackerStepPatchRequestSchema(Schema):
    """Schema for PATCH requests to update procurement tracker steps."""

    id = fields.Integer(required=True)
    procurement_tracker_id = fields.Integer(required=True)
    step_number = fields.Integer(required=True)
    step_type = fields.Enum(ProcurementTrackerStepType, required=True, by_value=False)
    status = fields.Enum(ProcurementTrackerStepStatus, required=True, by_value=False)
    step_start_date = fields.Date(required=False, allow_none=True)
    step_completed_date = fields.Date(required=False, allow_none=True)

    # Step-specific fields for Acquisition Planning step
    task_completed_by = fields.Integer(required=False, allow_none=True)
    date_completed = fields.Date(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True)


class QueryParametersSchema(PaginationListSchema):
    """Schema for GET /procurement-tracker-steps endpoint query parameters."""

    class Meta:
        unknown = EXCLUDE

    # Filtering parameters (all are lists since HTTP allows multiple values)
    agreement_id = fields.List(fields.Integer(), required=False)
