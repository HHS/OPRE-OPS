"""Schemas for procurement tracker endpoints."""

from marshmallow import EXCLUDE, Schema, fields

from models.procurement_tracker import (
    ProcurementTrackerStatus,
    ProcurementTrackerType,
)
from ops_api.ops.schemas.pagination import PaginationListSchema
from ops_api.ops.schemas.procurement_tracker_steps import ProcurementTrackerStepSchema


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
