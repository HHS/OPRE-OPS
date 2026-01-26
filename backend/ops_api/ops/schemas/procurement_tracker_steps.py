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
    # Acquisition planning related fields
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

    status = fields.Enum(ProcurementTrackerStepStatus, required=True, by_value=False)

    # Step-specific fields for Acquisition Planning step
    task_completed_by = fields.Integer(required=False, allow_none=True)
    date_completed = fields.Date(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True)


class ProcurementTrackerStepSchema(Schema):
    """Schema for procurement tracker step serialization."""

    class Meta:
        unknown = EXCLUDE

    # Base fields common to all steps

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


class ProcurementTrackerStepsQueryParametersSchema(PaginationListSchema):
    """Schema for GET /procurement-tracker-steps endpoint query parameters."""

    class Meta:
        unknown = EXCLUDE

    # Filtering parameters (all are lists since HTTP allows multiple values)
    agreement_id = fields.List(fields.Integer(), required=False)
