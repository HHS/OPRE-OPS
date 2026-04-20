"""Schemas for procurement tracker steps."""

from marshmallow import EXCLUDE, Schema, fields, post_dump, pre_dump, validate

from models.procurement_tracker import (
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)
from ops_api.ops.schemas.pagination import PaginationListSchema


class NestedAgreementSchema(Schema):
    """Minimal agreement schema for nested responses."""

    id = fields.Integer(required=True)
    name = fields.String(allow_none=True)
    display_name = fields.String(dump_only=True)


class NestedProcurementTrackerSchema(Schema):
    """Minimal procurement tracker schema for nested responses."""

    id = fields.Integer(required=True)
    agreement_id = fields.Integer(required=True)
    agreement = fields.Nested(NestedAgreementSchema, allow_none=True)


class ProcurementTrackerStepNotificationSchema(Schema):
    """Minimal step schema for notification responses.

    Includes only the fields needed to display pre-award approval notifications
    in the frontend without keyword matching on titles.
    """

    id = fields.Integer(required=True)
    step_type = fields.Enum(ProcurementTrackerStepType, required=True, by_value=False)
    approval_status = fields.String(allow_none=True)
    approval_requested = fields.Boolean(allow_none=True)

    @pre_dump
    def map_pre_award_fields(self, data, **kwargs):
        """Map pre-award prefixed fields to generic API names."""
        if hasattr(data, "pre_award_approval_status"):
            return {
                "id": data.id,
                "step_type": data.step_type,
                "approval_status": data.pre_award_approval_status,
                "approval_requested": data.pre_award_approval_requested,
            }
        return data


class ProcurementTrackerStepResponseSchema(Schema):
    """Schema for procurement tracker step responses.

    Note: Step-specific fields come pre-mapped from the model's to_dict() method,
    which converts prefixed database column names (e.g., acquisition_planning_task_completed_by)
    to generic API field names (e.g., task_completed_by) based on step_type.
    """

    id = fields.Integer(required=True)
    procurement_tracker_id = fields.Integer(required=True)
    procurement_tracker = fields.Nested(NestedProcurementTrackerSchema, allow_none=True)
    step_number = fields.Integer(required=True)
    step_class = fields.String(required=True)
    step_type = fields.Enum(ProcurementTrackerStepType, required=True, by_value=False)
    status = fields.Enum(ProcurementTrackerStepStatus, required=True, by_value=False)
    step_start_date = fields.Date(allow_none=True)
    step_completed_date = fields.Date(allow_none=True)

    # Step-specific fields - these come pre-mapped from model's to_dict()
    # Shared by ACQUISITION_PLANNING, PRE_SOLICITATION, and SOLICITATION
    task_completed_by = fields.Integer(allow_none=True)
    date_completed = fields.Date(allow_none=True)
    notes = fields.String(allow_none=True)

    # PRE_SOLICITATION-specific
    target_completion_date = fields.Date(allow_none=True)
    draft_solicitation_date = fields.Date(allow_none=True)

    # SOLICITATION-specific
    solicitation_period_start_date = fields.Date(allow_none=True)
    solicitation_period_end_date = fields.Date(allow_none=True)

    # PRE_AWARD approval request fields
    approval_requested = fields.Boolean(allow_none=True)
    approval_requested_date = fields.Date(allow_none=True)
    approval_requested_by = fields.Integer(allow_none=True)
    requestor_notes = fields.String(allow_none=True)

    # PRE_AWARD approval response fields
    approval_status = fields.String(allow_none=True, validate=validate.OneOf(["APPROVED", "DECLINED", "PENDING"]))
    approval_responded_by = fields.Integer(allow_none=True)
    approval_responded_date = fields.Date(allow_none=True)
    reviewer_notes = fields.String(allow_none=True)

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
            "procurement_tracker": obj.procurement_tracker if hasattr(obj, "procurement_tracker") else None,
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
        # Use getattr() with None default for backward compatibility with test data
        if obj.step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING:
            data["task_completed_by"] = getattr(obj, "acquisition_planning_task_completed_by", None)
            data["date_completed"] = getattr(obj, "acquisition_planning_date_completed", None)
            data["notes"] = getattr(obj, "acquisition_planning_notes", None)

        elif obj.step_type == ProcurementTrackerStepType.PRE_SOLICITATION:
            data["task_completed_by"] = getattr(obj, "pre_solicitation_task_completed_by", None)
            data["date_completed"] = getattr(obj, "pre_solicitation_date_completed", None)
            data["notes"] = getattr(obj, "pre_solicitation_notes", None)
            data["target_completion_date"] = getattr(obj, "pre_solicitation_target_completion_date", None)
            data["draft_solicitation_date"] = getattr(obj, "pre_solicitation_draft_solicitation_date", None)

        elif obj.step_type == ProcurementTrackerStepType.SOLICITATION:
            data["task_completed_by"] = getattr(obj, "solicitation_task_completed_by", None)
            data["date_completed"] = getattr(obj, "solicitation_date_completed", None)
            data["notes"] = getattr(obj, "solicitation_notes", None)
            data["solicitation_period_start_date"] = getattr(obj, "solicitation_period_start_date", None)
            data["solicitation_period_end_date"] = getattr(obj, "solicitation_period_end_date", None)

        elif obj.step_type == ProcurementTrackerStepType.EVALUATION:
            data["task_completed_by"] = getattr(obj, "evaluation_task_completed_by", None)
            data["date_completed"] = getattr(obj, "evaluation_date_completed", None)
            data["notes"] = getattr(obj, "evaluation_notes", None)
            data["target_completion_date"] = getattr(obj, "evaluation_target_completion_date", None)

        elif obj.step_type == ProcurementTrackerStepType.PRE_AWARD:
            data["task_completed_by"] = getattr(obj, "pre_award_task_completed_by", None)
            data["date_completed"] = getattr(obj, "pre_award_date_completed", None)
            data["notes"] = getattr(obj, "pre_award_notes", None)
            data["target_completion_date"] = getattr(obj, "pre_award_target_completion_date", None)
            data["approval_requested"] = getattr(obj, "pre_award_approval_requested", None)
            data["approval_requested_date"] = getattr(obj, "pre_award_approval_requested_date", None)
            data["approval_requested_by"] = getattr(obj, "pre_award_approval_requested_by", None)
            data["requestor_notes"] = getattr(obj, "pre_award_requestor_notes", None)
            data["approval_status"] = getattr(obj, "pre_award_approval_status", None)
            data["approval_responded_by"] = getattr(obj, "pre_award_approval_responded_by", None)
            data["approval_responded_date"] = getattr(obj, "pre_award_approval_responded_date", None)
            data["reviewer_notes"] = getattr(obj, "pre_award_approval_reviewer_notes", None)

        return data

    @post_dump
    def remove_none_values(self, data, **_kwargs):
        """Remove None values and inappropriate fields based on step_type.

        For ACQUISITION_PLANNING, PRE_SOLICITATION, and SOLICITATION steps, keep step-specific keys even when None
        so that clients can reliably render/edit those fields.
        """
        step_type = data.get("step_type")

        # Base fields that should always be present even if None
        base_fields = {
            "id",
            "procurement_tracker_id",
            "step_number",
            "step_type",
            "status",
            "step_start_date",
            "step_completed_date",
        }

        # Determine which fields to preserve even if None, and remove inappropriate fields
        if step_type in ("ACQUISITION_PLANNING", ProcurementTrackerStepType.ACQUISITION_PLANNING):
            preserve_keys = base_fields | {"task_completed_by", "date_completed", "notes"}
            # Remove PRE_SOLICITATION-only fields
            data.pop("target_completion_date", None)
            data.pop("draft_solicitation_date", None)
            # Remove SOLICITATION-only fields
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
        elif step_type in ("PRE_SOLICITATION", ProcurementTrackerStepType.PRE_SOLICITATION):
            preserve_keys = base_fields | {
                "target_completion_date",
                "task_completed_by",
                "date_completed",
                "notes",
                "draft_solicitation_date",
            }
            # Remove SOLICITATION-only fields
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
        elif step_type in ("SOLICITATION", ProcurementTrackerStepType.SOLICITATION):
            preserve_keys = base_fields | {
                "task_completed_by",
                "date_completed",
                "notes",
                "solicitation_period_start_date",
                "solicitation_period_end_date",
            }
            # Remove PRE_SOLICITATION-only fields
            data.pop("target_completion_date", None)
            data.pop("draft_solicitation_date", None)
        elif step_type in ("EVALUATION", ProcurementTrackerStepType.EVALUATION):
            preserve_keys = base_fields | {
                "target_completion_date",
                "task_completed_by",
                "date_completed",
                "notes",
            }
            # Remove PRE_SOLICITATION-only fields
            data.pop("draft_solicitation_date", None)
            # Remove SOLICITATION-only fields
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
        elif step_type in ("PRE_AWARD", ProcurementTrackerStepType.PRE_AWARD):
            preserve_keys = base_fields | {
                "target_completion_date",
                "task_completed_by",
                "date_completed",
                "notes",
                "approval_requested",
                "approval_requested_date",
                "approval_requested_by",
                "requestor_notes",
                "approval_status",
                "approval_responded_by",
                "approval_responded_date",
                "reviewer_notes",
            }
            # Remove PRE_SOLICITATION-only fields
            data.pop("draft_solicitation_date", None)
            # Remove SOLICITATION-only fields
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
        else:
            preserve_keys = base_fields
            # Remove all step-specific fields for other step types
            for field in [
                "task_completed_by",
                "date_completed",
                "notes",
                "target_completion_date",
                "draft_solicitation_date",
                "solicitation_period_start_date",
                "solicitation_period_end_date",
                "approval_requested",
                "approval_requested_date",
                "approval_requested_by",
                "requestor_notes",
                "approval_status",
                "approval_responded_by",
                "approval_responded_date",
                "reviewer_notes",
            ]:
                data.pop(field, None)

        return {key: value for key, value in data.items() if value is not None or key in preserve_keys}


class ProcurementTrackerStepPatchRequestSchema(Schema):
    """Schema for PATCH requests to update procurement tracker steps."""

    status = fields.Enum(ProcurementTrackerStepStatus, required=True, by_value=False)

    # Fields shared by Acquisition Planning, Pre-Solicitation, Solicitation, and Evaluation steps
    task_completed_by = fields.Integer(required=False, allow_none=True)
    date_completed = fields.Date(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True)

    # Pre-solicitation specific fields
    target_completion_date = fields.Date(required=False, allow_none=True)
    draft_solicitation_date = fields.Date(required=False, allow_none=True)

    # Solicitation specific fields
    solicitation_period_start_date = fields.Date(required=False, allow_none=True)
    solicitation_period_end_date = fields.Date(required=False, allow_none=True)

    # Pre-Award approval request fields
    approval_requested = fields.Boolean(required=False, allow_none=True)
    approval_requested_date = fields.Date(required=False, allow_none=True)
    # approval_requested_by is server-controlled and derived from current_user - not accepted from client
    requestor_notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=150))

    # Pre-Award approval response fields
    approval_status = fields.String(required=False, allow_none=True, validate=validate.OneOf(["APPROVED", "DECLINED"]))
    # approval_responded_by and approval_responded_date are server-controlled - not accepted from client
    reviewer_notes = fields.String(required=False, allow_none=True, validate=validate.Length(max=150))


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

    # Generic field names that will be mapped from step-specific fields
    task_completed_by = fields.Integer(allow_none=True)
    date_completed = fields.Date(allow_none=True)
    notes = fields.String(allow_none=True)
    target_completion_date = fields.Date(allow_none=True)
    draft_solicitation_date = fields.Date(allow_none=True)
    solicitation_period_start_date = fields.Date(allow_none=True)
    solicitation_period_end_date = fields.Date(allow_none=True)

    # PRE_AWARD approval request fields
    approval_requested = fields.Boolean(allow_none=True)
    approval_requested_date = fields.Date(allow_none=True)
    approval_requested_by = fields.Integer(allow_none=True)
    requestor_notes = fields.String(allow_none=True)

    # PRE_AWARD approval response fields
    approval_status = fields.String(allow_none=True)
    approval_responded_by = fields.Integer(allow_none=True)
    approval_responded_date = fields.Date(allow_none=True)
    reviewer_notes = fields.String(allow_none=True)

    @pre_dump
    def map_step_specific_fields(self, obj, **_kwargs):
        """
        Map step-specific prefixed fields to generic API field names.

        Returns a dict with properly mapped fields while preserving enum types.
        """
        # If it's already a dict, return as-is
        if isinstance(obj, dict):
            return obj

        # Import here to avoid circular imports
        from models.procurement_tracker import ProcurementTrackerStepType

        # Create a dict with all base fields
        data = {
            "id": obj.id,
            "procurement_tracker_id": obj.procurement_tracker_id,
            "step_number": obj.step_number,
            "step_type": obj.step_type,  # Keep as enum
            "status": obj.status,  # Keep as enum
            "step_start_date": obj.step_start_date,
            "step_completed_date": obj.step_completed_date,
        }

        # Map step-specific fields based on step type
        # Use getattr() with None default for backward compatibility with test data
        if obj.step_type == ProcurementTrackerStepType.ACQUISITION_PLANNING:
            data["task_completed_by"] = getattr(obj, "acquisition_planning_task_completed_by", None)
            data["date_completed"] = getattr(obj, "acquisition_planning_date_completed", None)
            data["notes"] = getattr(obj, "acquisition_planning_notes", None)

        elif obj.step_type == ProcurementTrackerStepType.PRE_SOLICITATION:
            data["task_completed_by"] = getattr(obj, "pre_solicitation_task_completed_by", None)
            data["date_completed"] = getattr(obj, "pre_solicitation_date_completed", None)
            data["notes"] = getattr(obj, "pre_solicitation_notes", None)
            data["target_completion_date"] = getattr(obj, "pre_solicitation_target_completion_date", None)
            data["draft_solicitation_date"] = getattr(obj, "pre_solicitation_draft_solicitation_date", None)

        elif obj.step_type == ProcurementTrackerStepType.SOLICITATION:
            data["task_completed_by"] = getattr(obj, "solicitation_task_completed_by", None)
            data["date_completed"] = getattr(obj, "solicitation_date_completed", None)
            data["notes"] = getattr(obj, "solicitation_notes", None)
            data["solicitation_period_start_date"] = getattr(obj, "solicitation_period_start_date", None)
            data["solicitation_period_end_date"] = getattr(obj, "solicitation_period_end_date", None)

        elif obj.step_type == ProcurementTrackerStepType.EVALUATION:
            data["task_completed_by"] = getattr(obj, "evaluation_task_completed_by", None)
            data["date_completed"] = getattr(obj, "evaluation_date_completed", None)
            data["notes"] = getattr(obj, "evaluation_notes", None)
            data["target_completion_date"] = getattr(obj, "evaluation_target_completion_date", None)

        elif obj.step_type == ProcurementTrackerStepType.PRE_AWARD:
            data["task_completed_by"] = getattr(obj, "pre_award_task_completed_by", None)
            data["date_completed"] = getattr(obj, "pre_award_date_completed", None)
            data["notes"] = getattr(obj, "pre_award_notes", None)
            data["target_completion_date"] = getattr(obj, "pre_award_target_completion_date", None)
            data["approval_requested"] = getattr(obj, "pre_award_approval_requested", None)
            data["approval_requested_date"] = getattr(obj, "pre_award_approval_requested_date", None)
            data["approval_requested_by"] = getattr(obj, "pre_award_approval_requested_by", None)
            data["requestor_notes"] = getattr(obj, "pre_award_requestor_notes", None)
            data["approval_status"] = getattr(obj, "pre_award_approval_status", None)
            data["approval_responded_by"] = getattr(obj, "pre_award_approval_responded_by", None)
            data["approval_responded_date"] = getattr(obj, "pre_award_approval_responded_date", None)
            data["reviewer_notes"] = getattr(obj, "pre_award_approval_reviewer_notes", None)

        return data

    @post_dump
    def remove_none_step_specific_fields(self, data, **_kwargs):
        """
        Remove step-specific fields for steps that don't use them.

        For ACQUISITION_PLANNING steps, keep acquisition planning fields even if None.
        For PRE_SOLICITATION steps, keep pre-solicitation fields even if None.
        For SOLICITATION steps, keep solicitation fields even if None.
        For other step types, remove all step-specific fields entirely.
        """
        step_type = data.get("step_type")
        acquisition_fields = {"task_completed_by", "date_completed", "notes"}
        pre_solicitation_fields = {
            "target_completion_date",
            "task_completed_by",
            "date_completed",
            "notes",
            "draft_solicitation_date",
        }
        solicitation_fields = {
            "task_completed_by",
            "date_completed",
            "notes",
            "solicitation_period_start_date",
            "solicitation_period_end_date",
        }

        # Base fields that should always be present even if None
        base_fields = {
            "id",
            "procurement_tracker_id",
            "step_number",
            "step_type",
            "status",
            "step_start_date",
            "step_completed_date",
        }

        # Determine which fields to preserve even if None, and remove inappropriate fields
        if step_type in ("ACQUISITION_PLANNING", ProcurementTrackerStepType.ACQUISITION_PLANNING):
            preserve_keys = base_fields | acquisition_fields
            # Remove PRE_SOLICITATION-only fields
            data.pop("target_completion_date", None)
            data.pop("draft_solicitation_date", None)
            # Remove SOLICITATION-only fields
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
        elif step_type in ("PRE_SOLICITATION", ProcurementTrackerStepType.PRE_SOLICITATION):
            preserve_keys = base_fields | pre_solicitation_fields
            # Remove SOLICITATION-only fields
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
        elif step_type in ("SOLICITATION", ProcurementTrackerStepType.SOLICITATION):
            preserve_keys = base_fields | solicitation_fields
            # Remove PRE_SOLICITATION-only fields
            data.pop("target_completion_date", None)
            data.pop("draft_solicitation_date", None)
        elif step_type in ("EVALUATION", ProcurementTrackerStepType.EVALUATION):
            evaluation_fields = {
                "target_completion_date",
                "task_completed_by",
                "date_completed",
                "notes",
            }
            preserve_keys = base_fields | evaluation_fields
            # Remove PRE_SOLICITATION-only fields
            data.pop("draft_solicitation_date", None)
            # Remove SOLICITATION-only fields
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
        elif step_type in ("PRE_AWARD", ProcurementTrackerStepType.PRE_AWARD):
            pre_award_fields = {
                "target_completion_date",
                "task_completed_by",
                "date_completed",
                "notes",
                "approval_requested",
                "approval_requested_date",
                "approval_requested_by",
                "requestor_notes",
                "approval_status",
                "approval_responded_by",
                "approval_responded_date",
                "reviewer_notes",
            }
            preserve_keys = base_fields | pre_award_fields
            # Remove PRE_SOLICITATION-only fields
            data.pop("draft_solicitation_date", None)
            # Remove SOLICITATION-only fields
            data.pop("solicitation_period_start_date", None)
            data.pop("solicitation_period_end_date", None)
        else:
            preserve_keys = base_fields
            # Remove all step-specific fields for other step types
            for field in [
                "task_completed_by",
                "date_completed",
                "notes",
                "target_completion_date",
                "draft_solicitation_date",
                "solicitation_period_start_date",
                "solicitation_period_end_date",
                "approval_requested",
                "approval_requested_date",
                "approval_requested_by",
                "requestor_notes",
                "approval_status",
                "approval_responded_by",
                "approval_responded_date",
                "reviewer_notes",
            ]:
                data.pop(field, None)

        # Remove None values except for preserved fields
        return {key: value for key, value in data.items() if value is not None or key in preserve_keys}


class ProcurementTrackerStepsQueryParametersSchema(PaginationListSchema):
    """Schema for GET /procurement-tracker-steps endpoint query parameters."""

    class Meta:
        unknown = EXCLUDE

    # Filtering parameters (all are lists since HTTP allows multiple values)
    agreement_id = fields.List(fields.Integer(), required=False)
