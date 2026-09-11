"""Unit tests for ProcurementTrackerStepResponseSchema serialization.

Verifies that AWARD-step-specific fields (award_amount, award_date,
contract_number, vendor_id, vendor) survive Marshmallow serialization,
and that the patch schema accepts obligated_date.
"""

from datetime import date

import pytest
from marshmallow import ValidationError

from models.procurement_tracker import (
    AWARD_MODIFICATION_NUMBERS,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
)
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
        # OPS-5892 additional award fields (already mapped by to_dict())
        "agreement_title": "Signed Award Title",
        "modification_number": "Base",
        "purchase_order_number": "ODN-123",
        "task_order_number": "TO-456",
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

    def test_additional_award_fields_are_serialized(self):
        """OPS-5892: agreement_title, modification_number, purchase_order_number, task_order_number."""
        data = _award_step_dict()
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert result["agreement_title"] == "Signed Award Title"
        assert result["modification_number"] == "Base"
        assert result["purchase_order_number"] == "ODN-123"
        assert result["task_order_number"] == "TO-456"

    def test_none_additional_award_fields_preserved_in_preserve_keys(self):
        """OPS-5892: null additional award fields must survive (preserve_keys), not be dropped."""
        data = _award_step_dict(
            agreement_title=None,
            modification_number=None,
            purchase_order_number=None,
            task_order_number=None,
        )
        result = ProcurementTrackerStepResponseSchema().dump(data)
        assert result["agreement_title"] is None
        assert result["modification_number"] is None
        assert result["purchase_order_number"] is None
        assert result["task_order_number"] is None

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
        # OPS-5892 additional award fields must not leak onto PRE_AWARD steps
        assert "agreement_title" not in result
        assert "modification_number" not in result
        assert "purchase_order_number" not in result
        assert "task_order_number" not in result


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


# ---------------------------------------------------------------------------
# ProcurementTrackerStepPatchRequestSchema — notes length validation
# ---------------------------------------------------------------------------


class TestPatchSchemaAdditionalAwardFields:
    """OPS-5892: PATCH schema must accept the new award fields and constrain their values."""

    def test_additional_award_fields_accepted(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        result = schema.load(
            {
                "agreement_title": "Signed Award Title",
                "modification_number": "P00001",
                "purchase_order_number": "ODN-123",
                "task_order_number": "TO-456",
            }
        )
        assert result["agreement_title"] == "Signed Award Title"
        assert result["modification_number"] == "P00001"
        assert result["purchase_order_number"] == "ODN-123"
        assert result["task_order_number"] == "TO-456"

    @pytest.mark.parametrize("value", AWARD_MODIFICATION_NUMBERS)
    def test_every_dropdown_modification_number_accepted(self, value):
        """Every value the frontend <select> can produce must load."""
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        assert schema.load({"modification_number": value})["modification_number"] == value

    @pytest.mark.parametrize(
        "value",
        [
            "x" * 21,  # over the column length
            "P00021",  # past the end of the dropdown
            "P1",  # unpadded
            "base",  # wrong case
            "Modification 1",  # free text
        ],
    )
    def test_modification_number_outside_dropdown_rejected(self, value):
        """A direct API PATCH must not be able to store a value the <select> has no option for."""
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        with pytest.raises(ValidationError) as exc_info:
            schema.load({"modification_number": value})
        assert "modification_number" in exc_info.value.messages

    def test_purchase_order_number_over_max_length_rejected(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        with pytest.raises(ValidationError) as exc_info:
            schema.load({"purchase_order_number": "x" * 101})
        assert "purchase_order_number" in exc_info.value.messages

    def test_agreement_title_at_max_length_accepted(self):
        """200 matches the maxLength the agreement editor puts on the name field this overwrites."""
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        title = "x" * 200
        assert schema.load({"agreement_title": title})["agreement_title"] == title

    def test_agreement_title_over_max_length_rejected(self):
        """Step 6 must not be able to store a title the agreement edit form would refuse.

        The value is written straight into ``agreement.name`` on approval, so without this cap a
        direct PATCH could produce an agreement name unreachable through the agreement editor.
        """
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        with pytest.raises(ValidationError) as exc_info:
            schema.load({"agreement_title": "x" * 201})
        assert "agreement_title" in exc_info.value.messages

    def test_additional_award_fields_allow_none(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        result = schema.load({"agreement_title": None, "task_order_number": None})
        assert result.get("agreement_title") is None
        assert result.get("task_order_number") is None


class TestPatchSchemaNotesLength:
    """The notes field is capped server-side to mirror the frontend STEP_NOTES_MAX_LENGTH."""

    MAX_LENGTH = 750

    def test_notes_at_max_length_accepted(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        note = "x" * self.MAX_LENGTH
        result = schema.load({"notes": note})
        assert result["notes"] == note

    def test_notes_over_max_length_rejected(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        with pytest.raises(ValidationError) as exc_info:
            schema.load({"notes": "x" * (self.MAX_LENGTH + 1)})
        assert "notes" in exc_info.value.messages

    def test_notes_allows_none(self):
        schema = ProcurementTrackerStepPatchRequestSchema(partial=True)
        result = schema.load({"notes": None})
        assert result.get("notes") is None
