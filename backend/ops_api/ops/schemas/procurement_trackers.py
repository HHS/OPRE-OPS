"""Schemas for procurement tracker endpoints."""

from marshmallow import EXCLUDE, Schema, fields
from sqlalchemy.orm import object_session

from models.procurement_action import ProcurementAction
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
    status = fields.Enum(ProcurementTrackerStatus, required=True, by_value=True)
    procurement_action = fields.Integer(allow_none=True)
    tracker_type = fields.Enum(ProcurementTrackerType, required=True, by_value=True)
    active_step_number = fields.Integer(allow_none=True)

    created_on = fields.DateTime(allow_none=True)

    # The procurement cycle this tracker belongs to (OPS-6513): the initial award or a
    # contract mod. Lets the frontend pick the most recent mod's tracker, and label trackers.
    award_type = fields.Method("get_award_type", allow_none=True)
    agreement_mod_id = fields.Method("get_agreement_mod_id", allow_none=True)
    mod_type = fields.Method("get_mod_type", allow_none=True)
    mod_number = fields.Method("get_mod_number", allow_none=True)
    budget_line_item_ids = fields.Method("get_budget_line_item_ids")

    # Nested steps
    steps = fields.List(fields.Nested(ProcurementTrackerStepSchema), allow_none=True)

    @staticmethod
    def _action(obj) -> ProcurementAction | None:
        # session.get() hits the identity map after the first lookup, so the fields below
        # share one load per tracker.
        session = object_session(obj)
        if obj.procurement_action is None or session is None:
            return None
        return session.get(ProcurementAction, obj.procurement_action)

    def get_award_type(self, obj):
        action = self._action(obj)
        return action.award_type.name if action and action.award_type else None

    def get_agreement_mod_id(self, obj):
        action = self._action(obj)
        return action.agreement_mod_id if action else None

    def get_mod_type(self, obj):
        action = self._action(obj)
        return (
            action.agreement_mod.mod_type.name
            if action and action.agreement_mod and action.agreement_mod.mod_type
            else None
        )

    def get_mod_number(self, obj):
        action = self._action(obj)
        return action.mod_number if action else None

    def get_budget_line_item_ids(self, obj):
        action = self._action(obj)
        return sorted(bli.id for bli in action.budget_line_items) if action else []


class QueryParametersSchema(PaginationListSchema):
    """Schema for GET /procurement-trackers endpoint query parameters."""

    class Meta:
        unknown = EXCLUDE

    # Filtering parameters (all are lists since HTTP allows multiple values)
    agreement_id = fields.List(fields.Integer(), required=False)
