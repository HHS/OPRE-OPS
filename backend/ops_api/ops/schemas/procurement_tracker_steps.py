"""Schemas for procurement tracker steps."""

from marshmallow import EXCLUDE, Schema, fields, post_dump, pre_dump

from models.procurement_tracker import (
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)
from ops_api.ops.schemas.pagination import PaginationListSchema


class ProcurementTrackerStepResponseSchema(Schema):
    """Schema for procurement tracker step responses.

    Note: Step-specific fields come pre-mapped from the model's to_dict() method,
    which converts prefixed database column names (e.g., acquisition_planning_task_completed_by)
    to generic API field names (e.g., task_completed_by) based on step_type.
    """

    id = fields.Integer(required=True)
    procurement_tracker_id = fields.Integer(required=True)
    step_number = fields.Integer(required=True)
    step_class = fields.String(required=True)
    step_type = fields.Enum(ProcurementTrackerStepType, required=True, by_value=False)
    status = fields.Enum(ProcurementTrackerStepStatus, required=True, by_value=False)
    step_start_date = fields.Date(allow_none=True)
    step_completed_date = fields.Date(allow_none=True)

    # Step-specific fields - these come pre-mapped from model's to_dict()
    # Shared by ACQUISITION_PLANNING and PRE_SOLICITATION
    task_completed_by = fields.Integer(allow_none=True)
    date_completed = fields.Date(allow_none=True)
    notes = fields.String(allow_none=True)

    # PRE_SOLICITATION-specific
    target_completion_date = fields.Date(allow_none=True)
    draft_solicitation_date = fields.Date(allow_none=True)

    # BaseModel fields
    display_name = fields.String(dump_only=True)
    created_on = fields.DateTime(dump_only=True)
    updated_on = fields.DateTime(dump_only=True)

    @pre_dump
    def map_step_specific_fields(self, obj, **_kwargs):
        """
        Map step-specific prefixed fields to generic API field names.

        Returns a dict with properly mapped fields while preserving enum types.
        """
        # If it's already a dict (from to_dict()), return as-is
        if isinstance(obj, dict):
            return obj

        # Import here to avoid circular imports
        from models.procurement_tracker import ProcurementTrackerStepType

        # Create a dict with all base fields
        data = {
            "id": obj.id,
            "procurement_tracker_id": obj.procurement_tracker_id,
            "step_number": obj.step_number,
            "step_class": obj.step_class,
            "step_type": obj.step_type,  # Keep as enum
            "status": obj.status,  # Keep as enum
            "step_start_date": obj.step_start_date,
            "step_completed_date": obj.step_completed_date,
            "display_name": obj.display_name,
            "created_on": obj.created_on,
            "updated_on": obj.updated_on,
        }

        # Map step-specific fields based on step type
        if obj.step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING:
            data["task_completed_by"] = obj.acquisition_planning_task_completed_by
            data["date_completed"] = obj.acquisition_planning_date_completed
            data["notes"] = obj.acquisition_planning_notes

        elif obj.step_type == ProcurementTrackerStepType.PRE_SOLICITATION:
            data["task_completed_by"] = obj.pre_solicitation_task_completed_by
            data["date_completed"] = obj.pre_solicitation_date_completed
            data["notes"] = obj.pre_solicitation_notes
            data["target_completion_date"] = obj.pre_solicitation_target_completion_date
            data["draft_solicitation_date"] = obj.pre_solicitation_draft_solicitation_date

        return data

    @post_dump
    def remove_none_values(self, data, **_kwargs):
        """Remove None values and inappropriate fields based on step_type.

        For ACQUISITION_PLANNING and PRE_SOLICITATION steps, keep step-specific keys even when None
        so that clients can reliably render/edit those fields.
        """
        step_type = data.get("step_type")

        # Determine which fields to preserve even if None, and remove inappropriate fields
        if step_type in ("ACQUISITION_PLANNING", ProcurementTrackerStepType.ACQUISITION_PLANNING):
            preserve_keys = {"task_completed_by", "date_completed", "notes"}
            # Remove PRE_SOLICITATION-only fields
            data.pop("target_completion_date", None)
            data.pop("draft_solicitation_date", None)
        elif step_type in ("PRE_SOLICITATION", ProcurementTrackerStepType.PRE_SOLICITATION):
            preserve_keys = {
                "target_completion_date",
                "task_completed_by",
                "date_completed",
                "notes",
                "draft_solicitation_date",
            }
        else:
            preserve_keys = set()
            # Remove all step-specific fields for other step types
            for field in [
                "task_completed_by",
                "date_completed",
                "notes",
                "target_completion_date",
                "draft_solicitation_date",
            ]:
                data.pop(field, None)

        return {key: value for key, value in data.items() if value is not None or key in preserve_keys}


class ProcurementTrackerStepPatchRequestSchema(Schema):
    """Schema for PATCH requests to update procurement tracker steps."""

    status = fields.Enum(ProcurementTrackerStepStatus, required=True, by_value=False)

    # Fields shared by Acquistion Planning and Pre-Solicitation steps
    task_completed_by = fields.Integer(required=False, allow_none=True)
    date_completed = fields.Date(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True)

    # Pre-solicitation specific fields
    target_completion_date = fields.Date(required=False, allow_none=True)
    draft_solicitation_date = fields.Date(required=False, allow_none=True)


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

    # PRE_SOLICITATION-specific fields (use prefixed names from model, rename in output)
    pre_solicitation_target_completion_date = fields.Date(
        allow_none=True, data_key="target_completion_date", attribute="pre_solicitation_target_completion_date"
    )
    pre_solicitation_task_completed_by = fields.Integer(
        allow_none=True, data_key="task_completed_by", attribute="pre_solicitation_task_completed_by"
    )
    pre_solicitation_date_completed = fields.Date(
        allow_none=True, data_key="date_completed", attribute="pre_solicitation_date_completed"
    )
    pre_solicitation_notes = fields.String(allow_none=True, data_key="notes", attribute="pre_solicitation_notes")
    pre_solicitation_draft_solicitation_date = fields.Date(
        allow_none=True, data_key="draft_solicitation_date", attribute="pre_solicitation_draft_solicitation_date"
    )

    @post_dump
    def remove_none_step_specific_fields(self, data, **_kwargs):
        """
        Remove step-specific fields for steps that don't use them.

        For ACQUISITION_PLANNING steps, keep acquisition planning fields even if None.
        For PRE_SOLICITATION steps, keep pre-solicitation fields even if None.
        For other step types, remove all step-specific fields entirely.
        """
        step_type = data.get("step_type")
        acquisition_fields = ["task_completed_by", "date_completed", "notes"]
        pre_solicitation_fields = [
            "target_completion_date",
            "task_completed_by",
            "date_completed",
            "notes",
            "draft_solicitation_date",
        ]

        if step_type == "ACQUISITION_PLANNING":
            # Remove pre-solicitation fields, keep acquisition fields
            for field in ["target_completion_date", "draft_solicitation_date"]:
                data.pop(field, None)
        elif step_type == "PRE_SOLICITATION":
            # Keep pre-solicitation fields, they're already there with correct keys
            pass
        else:
            # Remove all step-specific fields for other step types
            for field in set(acquisition_fields + pre_solicitation_fields):
                data.pop(field, None)

        return data


class ProcurementTrackerStepsQueryParametersSchema(PaginationListSchema):
    """Schema for GET /procurement-tracker-steps endpoint query parameters."""

    class Meta:
        unknown = EXCLUDE

    # Filtering parameters (all are lists since HTTP allows multiple values)
    agreement_id = fields.List(fields.Integer(), required=False)
