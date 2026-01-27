"""Unit tests for Agreement.is_awarded property."""

from models import (
    AaAgreement,
    Agreement,
    AgreementType,
    AwardType,
    ContractAgreement,
    DirectAgreement,
    GrantAgreement,
    IaaAgreement,
    IAADirectionType,
    ProcurementAction,
    ProcurementActionStatus,
)


class TestAgreementIsAwarded:
    """Test suite for Agreement.is_awarded property."""

    def test_agreement_with_no_procurement_actions_is_not_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with no procurement actions returns False."""
        # Create an agreement with no procurement actions
        agreement = ContractAgreement(
            name="Test Agreement - No Procurement Actions",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert agreement.is_awarded is False

    def test_agreement_with_awarded_status_and_new_award_type_is_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with AWARDED status and NEW_AWARD type returns True."""
        agreement = ContractAgreement(
            name="Test Agreement - Awarded New Award",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is True

    def test_agreement_with_certified_status_and_new_award_type_is_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with CERTIFIED status and NEW_AWARD type returns True."""
        agreement = ContractAgreement(
            name="Test Agreement - Certified New Award",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.CERTIFIED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is True

    def test_agreement_with_awarded_status_but_non_new_award_type_is_not_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with AWARDED status but non-NEW_AWARD type returns False."""
        agreement = ContractAgreement(
            name="Test Agreement - Awarded Modification",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        # Test with MODIFICATION award type
        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.MODIFICATION,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is False

    def test_agreement_with_new_award_type_but_non_awarded_status_is_not_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with NEW_AWARD type but non-AWARDED/CERTIFIED status returns False."""
        test_cases = [
            ProcurementActionStatus.PLANNED,
            ProcurementActionStatus.REQUISITION_SUBMITTED,
            ProcurementActionStatus.IN_PROCESS,
            ProcurementActionStatus.CANCELLED,
        ]

        for status in test_cases:
            agreement = ContractAgreement(
                name=f"Test Agreement - {status.name}",
                agreement_type=AgreementType.CONTRACT,
            )
            loaded_db.add(agreement)
            loaded_db.flush()

            procurement_action = ProcurementAction(
                agreement_id=agreement.id,
                status=status,
                award_type=AwardType.NEW_AWARD,
            )
            loaded_db.add(procurement_action)
            loaded_db.commit()

            # Refresh to ensure relationship is loaded
            loaded_db.refresh(agreement)
            assert agreement.is_awarded is False, f"Agreement with status {status.name} should not be awarded"

    def test_agreement_with_multiple_procurement_actions_one_matching_is_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with multiple procurement actions where at least one matches returns True."""
        agreement = ContractAgreement(
            name="Test Agreement - Multiple Actions One Match",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        # Add a non-matching procurement action
        procurement_action_1 = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.PLANNED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action_1)

        # Add another non-matching procurement action
        procurement_action_2 = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.MODIFICATION,
        )
        loaded_db.add(procurement_action_2)

        # Add a matching procurement action
        procurement_action_3 = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action_3)

        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is True

    def test_agreement_with_multiple_procurement_actions_none_matching_is_not_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with multiple procurement actions where none match returns False."""
        agreement = ContractAgreement(
            name="Test Agreement - Multiple Actions No Match",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        # Add a non-matching procurement action (wrong status)
        procurement_action_1 = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.PLANNED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action_1)

        # Add another non-matching procurement action (wrong award type)
        procurement_action_2 = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.MODIFICATION,
        )
        loaded_db.add(procurement_action_2)

        # Add another non-matching procurement action (both wrong)
        procurement_action_3 = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.IN_PROCESS,
            award_type=AwardType.FOLLOW_ON,
        )
        loaded_db.add(procurement_action_3)

        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is False

    def test_agreement_with_all_non_new_award_types_is_not_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with AWARDED status but various non-NEW_AWARD types returns False."""
        non_new_award_types = [
            AwardType.MODIFICATION,
            AwardType.NEW_TASK_ORDER,
            AwardType.EXERCISE_OPTION_AS_IS,
            AwardType.FOLLOW_ON,
            AwardType.SIMPLIFIED_ACQUISITION,
            AwardType.MICRO_PURCHASE,
            AwardType.ADMINISTRATIVE,
        ]

        for award_type in non_new_award_types:
            agreement = ContractAgreement(
                name=f"Test Agreement - {award_type.name}",
                agreement_type=AgreementType.CONTRACT,
            )
            loaded_db.add(agreement)
            loaded_db.flush()

            procurement_action = ProcurementAction(
                agreement_id=agreement.id,
                status=ProcurementActionStatus.AWARDED,
                award_type=award_type,
            )
            loaded_db.add(procurement_action)
            loaded_db.commit()

            # Refresh to ensure relationship is loaded
            loaded_db.refresh(agreement)
            assert agreement.is_awarded is False, f"Agreement with award_type {award_type.name} should not be awarded"

    def test_agreement_with_null_status_is_not_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with null status returns False."""
        agreement = ContractAgreement(
            name="Test Agreement - Null Status",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=None,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is False

    def test_agreement_with_null_award_type_is_not_awarded(self, loaded_db, app_ctx):
        """Test that an agreement with null award_type returns False."""
        agreement = ContractAgreement(
            name="Test Agreement - Null Award Type",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=None,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is False

    def test_agreement_loaded_from_database_has_correct_is_awarded_status(self, loaded_db, app_ctx):
        """Test that is_awarded works correctly when agreement is loaded from database."""
        # Create and commit an awarded agreement
        agreement = ContractAgreement(
            name="Test Agreement - Database Load",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.CERTIFIED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        agreement_id = agreement.id

        # Clear session to force fresh load from database
        loaded_db.expunge_all()

        # Load agreement from database
        loaded_agreement = loaded_db.get(Agreement, agreement_id)
        assert loaded_agreement is not None
        assert loaded_agreement.is_awarded is True

    def test_agreement_grant_is_awarded(self, loaded_db, app_ctx):
        """Test that a grant agreement with AWARDED status and NEW_AWARD type returns True."""
        agreement = GrantAgreement(
            name="Test Grant Agreement - Awarded New Award",
            agreement_type=AgreementType.GRANT,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is True

    def test_agreement_iaa_is_awarded(self, loaded_db, app_ctx):
        """Test that an IAA agreement with AWARDED status and NEW_AWARD type returns True."""
        agreement = IaaAgreement(
            name="Test IAA Agreement - Awarded New Award",
            agreement_type=AgreementType.IAA,
            direction=IAADirectionType.INCOMING,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is True

    def test_agreement_aa_is_awarded(self, loaded_db, app_ctx):
        """Test that an AA agreement with AWARDED status and NEW_AWARD type returns True."""
        agreement = AaAgreement(
            name="Test AA Agreement - Awarded New Award",
            agreement_type=AgreementType.AA,
            requesting_agency_id=1,
            servicing_agency_id=1,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is True

    def test_agreement_direct_is_awarded(self, loaded_db, app_ctx):
        """Test that a Direct agreement with AWARDED status and NEW_AWARD type returns True."""
        agreement = DirectAgreement(
            name="Test Direct Agreement - Awarded New Award",
            agreement_type=AgreementType.DIRECT_OBLIGATION,
        )
        loaded_db.add(agreement)
        loaded_db.flush()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            status=ProcurementActionStatus.AWARDED,
            award_type=AwardType.NEW_AWARD,
        )
        loaded_db.add(procurement_action)
        loaded_db.commit()

        # Refresh to ensure relationship is loaded
        loaded_db.refresh(agreement)
        assert agreement.is_awarded is True
