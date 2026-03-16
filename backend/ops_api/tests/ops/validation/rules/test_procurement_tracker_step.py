"""Tests for procurement tracker step validation rules."""

from datetime import date

import pytest

from models import (
    ProcurementTrackerStep,
    ProcurementTrackerStepStatus,
    ProcurementTrackerStepType,
    User,
)
from ops_api.ops.services.ops_service import ValidationError
from ops_api.ops.validation.context import ValidationContext
from ops_api.ops.validation.rules.procurement_tracker_step import PreAwardCompletionRequiredFieldsRule


class TestPreAwardCompletionRequiredFieldsRule:
    """Test suite for PreAwardCompletionRequiredFieldsRule."""

    def test_name_property(self, app_ctx):
        """Test that the rule has the correct name."""
        rule = PreAwardCompletionRequiredFieldsRule()
        assert rule.name == "PRE_AWARD Completion Required Fields Check"

    def test_validate_passes_when_not_completing(self, loaded_db, app_ctx):
        """Test that validation is skipped when not completing the step."""
        step = ProcurementTrackerStep(
            step_type=ProcurementTrackerStepType.PRE_AWARD, status=ProcurementTrackerStepStatus.ACTIVE
        )
        loaded_db.add(step)
        loaded_db.commit()

        # Not setting status to COMPLETED
        context = ValidationContext(
            user=loaded_db.query(User).first(), db_session=loaded_db, updated_fields={"notes": "Some notes"}
        )

        rule = PreAwardCompletionRequiredFieldsRule()
        # Should not raise
        rule.validate(step, context)

        # Cleanup
        loaded_db.delete(step)
        loaded_db.commit()

    def test_validate_passes_when_all_required_fields_provided(self, loaded_db, app_ctx):
        """Test that validation passes when all required fields are provided."""
        user = loaded_db.query(User).first()
        step = ProcurementTrackerStep(
            step_type=ProcurementTrackerStepType.PRE_AWARD, status=ProcurementTrackerStepStatus.ACTIVE
        )
        loaded_db.add(step)
        loaded_db.commit()

        context = ValidationContext(
            user=user,
            db_session=loaded_db,
            updated_fields={
                "status": ProcurementTrackerStepStatus.COMPLETED,
                "task_completed_by": user.id,
                "date_completed": date.today(),
            },
        )

        rule = PreAwardCompletionRequiredFieldsRule()
        # Should not raise
        rule.validate(step, context)

        # Cleanup
        loaded_db.delete(step)
        loaded_db.commit()

    def test_validate_fails_when_task_completed_by_is_null(self, loaded_db, app_ctx):
        """Test that validation fails when task_completed_by is explicitly null."""
        user = loaded_db.query(User).first()
        step = ProcurementTrackerStep(
            step_type=ProcurementTrackerStepType.PRE_AWARD, status=ProcurementTrackerStepStatus.ACTIVE
        )
        loaded_db.add(step)
        loaded_db.commit()

        context = ValidationContext(
            user=user,
            db_session=loaded_db,
            updated_fields={
                "status": ProcurementTrackerStepStatus.COMPLETED,
                "task_completed_by": None,  # Explicit null
                "date_completed": date.today(),
            },
        )

        rule = PreAwardCompletionRequiredFieldsRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(step, context)

        assert "task_completed_by" in exc_info.value.errors
        assert "required" in exc_info.value.errors["task_completed_by"].lower()

        # Cleanup
        loaded_db.delete(step)
        loaded_db.commit()

    def test_validate_fails_when_date_completed_is_null(self, loaded_db, app_ctx):
        """Test that validation fails when date_completed is explicitly null."""
        user = loaded_db.query(User).first()
        step = ProcurementTrackerStep(
            step_type=ProcurementTrackerStepType.PRE_AWARD, status=ProcurementTrackerStepStatus.ACTIVE
        )
        loaded_db.add(step)
        loaded_db.commit()

        context = ValidationContext(
            user=user,
            db_session=loaded_db,
            updated_fields={
                "status": ProcurementTrackerStepStatus.COMPLETED,
                "task_completed_by": user.id,
                "date_completed": None,  # Explicit null
            },
        )

        rule = PreAwardCompletionRequiredFieldsRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(step, context)

        assert "date_completed" in exc_info.value.errors
        assert "required" in exc_info.value.errors["date_completed"].lower()

        # Cleanup
        loaded_db.delete(step)
        loaded_db.commit()

    def test_validate_fails_when_both_fields_are_null(self, loaded_db, app_ctx):
        """Test that validation fails when both required fields are explicitly null."""
        user = loaded_db.query(User).first()
        step = ProcurementTrackerStep(
            step_type=ProcurementTrackerStepType.PRE_AWARD, status=ProcurementTrackerStepStatus.ACTIVE
        )
        loaded_db.add(step)
        loaded_db.commit()

        context = ValidationContext(
            user=user,
            db_session=loaded_db,
            updated_fields={
                "status": ProcurementTrackerStepStatus.COMPLETED,
                "task_completed_by": None,  # Explicit null
                "date_completed": None,  # Explicit null
            },
        )

        rule = PreAwardCompletionRequiredFieldsRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(step, context)

        assert "task_completed_by" in exc_info.value.errors
        assert "date_completed" in exc_info.value.errors

        # Cleanup
        loaded_db.delete(step)
        loaded_db.commit()

    def test_validate_passes_when_fields_already_on_model(self, loaded_db, app_ctx):
        """Test that validation passes when required fields are already set on the model."""
        user = loaded_db.query(User).first()
        step = ProcurementTrackerStep(
            step_type=ProcurementTrackerStepType.PRE_AWARD,
            status=ProcurementTrackerStepStatus.ACTIVE,
            pre_award_task_completed_by=user.id,
            pre_award_date_completed=date.today(),
        )
        loaded_db.add(step)
        loaded_db.commit()

        # Only updating status, not providing task_completed_by or date_completed
        context = ValidationContext(
            user=user, db_session=loaded_db, updated_fields={"status": ProcurementTrackerStepStatus.COMPLETED}
        )

        rule = PreAwardCompletionRequiredFieldsRule()
        # Should not raise because fields are already on model
        rule.validate(step, context)

        # Cleanup
        loaded_db.delete(step)
        loaded_db.commit()

    def test_validate_fails_when_overwriting_model_field_with_null(self, loaded_db, app_ctx):
        """Test that validation fails when trying to overwrite an existing field with null."""
        user = loaded_db.query(User).first()
        step = ProcurementTrackerStep(
            step_type=ProcurementTrackerStepType.PRE_AWARD,
            status=ProcurementTrackerStepStatus.ACTIVE,
            pre_award_task_completed_by=user.id,
            pre_award_date_completed=date.today(),
        )
        loaded_db.add(step)
        loaded_db.commit()

        # Trying to overwrite existing field with null
        context = ValidationContext(
            user=user,
            db_session=loaded_db,
            updated_fields={
                "status": ProcurementTrackerStepStatus.COMPLETED,
                "task_completed_by": None,  # Attempting to null out existing value
            },
        )

        rule = PreAwardCompletionRequiredFieldsRule()

        with pytest.raises(ValidationError) as exc_info:
            rule.validate(step, context)

        assert "task_completed_by" in exc_info.value.errors

        # Cleanup
        loaded_db.delete(step)
        loaded_db.commit()
