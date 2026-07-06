"""Unit tests for ProcurementTrackerStepResponseSchema serialization.

Verifies that AWARD-step-specific fields (award_amount, award_date,
contract_number, vendor_id, vendor) survive Marshmallow serialization,
and that the patch schema accepts obligated_date.
"""

from datetime import date

from models.procurement_tracker import ProcurementTrackerStepStatus, ProcurementTrackerStepType
from ops_api.ops.schemas.procurement_tracker_steps import (
    ProcurementTrackerStepPatchRequestSchema,
    ProcurementTrackerStepResponseSchema,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _award_step_dict(**overrides):
    """Minimal AWARD step dict as produced by DefaultProcurementTrackerStep.to_dict()."""
    base = {
        "id": 42,
        "procurement_tracker_id": 7,
        "step_number": 6,
        "step_class": "default_step",
        "step_type": ProcurementTrackerStepType.AWARD,
        "status": ProcurementTrackerStepStatus.ACTIVE,
        "step_start_date": date(2024, 1, 1),
        "step_completed_date": None,
        "display_name": "Award",
        "created_on": None,
        "updated_on": None,
        # approval fields already mapped from prefixed columns by to_dict()
        "approval_requested": True,
        "approval_requested_date": date(2024, 6, 1),
        "approval_requested_by": 503,
        "requestor_notes": "Please review",
        "approval_status": None,
        "approval_responded_by": None,
        "approval_responded_date": None,
        "reviewer_notes": None,
        # award-specific fields (already mapped by to_dict())
        "vendor_id": 10,
        "vendor": {"id": 10, "name": "Acme Corp", "duns": "123456789", "vendor_type": "SMALL_BUSINESS"},
        "contract_number": "GS-123-456",
        "award_amount": 1500000.0,
        "award_date": date(2024, 9, 30),
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# ProcurementTrackerStepResponseSchema — AWARD step serialization
# ---------------------------------------------------------------------------


class TestAwardStepResponseSchema:
    """AWARD step fields must survive Marshmallow serialization."""

    def test_award_amount_is_serialized(self):
        data = _award_step_dict()
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "award_amount" in result
        assert result["award_amount"] == 1500000.0

    def test_award_date_is_serialized(self):
        data = _award_step_dict()
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "award_date" in result
        assert result["award_date"] == "2024-09-30"

    def test_contract_number_is_serialized(self):
        data = _award_step_dict()
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "contract_number" in result
        assert result["contract_number"] == "GS-123-456"

    def test_vendor_id_is_serialized(self):
        data = _award_step_dict()
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "vendor_id" in result
        assert result["vendor_id"] == 10

    def test_vendor_dict_is_serialized(self):
        data = _award_step_dict()
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "vendor" in result
        assert result["vendor"]["name"] == "Acme Corp"

    def test_approval_requested_by_is_serialized(self):
        """Approval_requested_by was already working — ensure not broken."""
        data = _award_step_dict()
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert result["approval_requested_by"] == 503

    def test_none_award_amount_preserved_in_preserve_keys(self):
        """award_amount=None should still be present (preserve_keys)."""
        data = _award_step_dict(award_amount=None)
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "award_amount" in result
        assert result["award_amount"] is None

    def test_none_award_date_preserved_in_preserve_keys(self):
        data = _award_step_dict(award_date=None)
        result = ProcurementTrackerStepResponseSchema().dump(data)
        # award_date is in preserve_keys so it must survive even as None
        assert "award_date" in result
        assert result["award_date"] is None

    def test_none_contract_number_preserved_in_preserve_keys(self):
        data = _award_step_dict(contract_number=None)
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "contract_number" in result
        assert result["contract_number"] is None

    def test_none_vendor_id_preserved_in_preserve_keys(self):
        data = _award_step_dict(vendor_id=None)
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "vendor_id" in result
        assert result["vendor_id"] is None

    def test_pre_award_step_does_not_include_award_fields(self):
        """PRE_AWARD steps must NOT get award_amount/award_date/contract_number/vendor_id."""
        data = {
            "id": 5,
            "procurement_tracker_id": 7,
            "step_number": 5,
            "step_class": "default_step",
            "step_type": ProcurementTrackerStepType.PRE_AWARD,
            "status": ProcurementTrackerStepStatus.ACTIVE,
            "step_start_date": date(2024, 1, 1),
            "step_completed_date": None,
            "display_name": "Pre-Award",
            "created_on": None,
            "updated_on": None,
            "approval_requested": True,
            "approval_requested_by": 503,
            "approval_status": None,
            "reviewer_notes": None,
            "requestor_notes": None,
            "approval_requested_date": None,
            "approval_responded_by": None,
            "approval_responded_date": None,
        }
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert "award_amount" not in result
        assert "award_date" not in result
        assert "contract_number" not in result
        assert "vendor_id" not in result


# ---------------------------------------------------------------------------
# ProcurementTrackerStepPatchRequestSchema — obligated_date field
# ---------------------------------------------------------------------------


class TestPatchSchemaObligatedDate:
    """PATCH schema must accept obligated_date (partial=True mirrors how the resource uses it)."""

    def test_obligated_date_accepted(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        result = schema.load({"obligated_date": "2024-09-30"})
        assert result["obligated_date"] == date(2024, 9, 30)

    def test_obligated_date_allows_none(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        result = schema.load({"obligated_date": None})
        assert result.get("obligated_date") is None

    def test_obligated_date_not_required(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        # Should load without obligated_date
        result = schema.load({"approval_status": "APPROVED"})
        assert "obligated_date" not in result or result.get("obligated_date") is None
