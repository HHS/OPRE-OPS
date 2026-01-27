"""Unit tests for Agreement.immutable_awarded_fields property."""

from flask import url_for
from sqlalchemy import Integer, String, select

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
    OpsEvent,
    OpsEventStatus,
    OpsEventType,
    ProcurementAction,
    ProcurementActionStatus,
)


class TestAgreementImmutableAwardedFields:
    """Test suite for Agreement.immutable_awarded_fields property."""

    def test_contract_agreement_immutable_fields(self, loaded_db, app_ctx):
        """Test that ContractAgreement instance returns correct immutable fields."""
        agreement = ContractAgreement(
            name="Test Contract Agreement",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        immutable_fields = agreement.immutable_awarded_fields

        # Verify it returns a list
        assert isinstance(immutable_fields, list)

        # Verify all expected fields are present
        expected_fields = [
            "name",
            "contract_type",
            "service_requirement_type",
            "product_service_code_id",
            "awarding_entity_id",
            "agreement_reason",
            "vendor",
        ]
        assert immutable_fields == expected_fields

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_contract_agreement_immutable_fields_count(self, loaded_db, app_ctx):
        """Test that ContractAgreement returns exactly 6 immutable fields."""
        agreement = ContractAgreement(
            name="Test Contract Agreement - Count",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert len(agreement.immutable_awarded_fields) == 7

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_grant_agreement_immutable_fields_empty(self, loaded_db, app_ctx):
        """Test that GrantAgreement returns empty list for immutable fields."""
        agreement = GrantAgreement(
            name="Test Grant Agreement",
            agreement_type=AgreementType.GRANT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        immutable_fields = agreement.immutable_awarded_fields

        assert isinstance(immutable_fields, list)
        assert immutable_fields == []
        assert len(immutable_fields) == 0

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_iaa_agreement_immutable_fields_empty(self, loaded_db, app_ctx):
        """Test that IaaAgreement returns empty list for immutable fields."""
        agreement = IaaAgreement(
            name="Test IAA Agreement",
            agreement_type=AgreementType.IAA,
            direction=IAADirectionType.INCOMING,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        immutable_fields = agreement.immutable_awarded_fields

        assert isinstance(immutable_fields, list)
        assert immutable_fields == []
        assert len(immutable_fields) == 0

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_aa_agreement_immutable_fields(self, loaded_db, app_ctx):
        """Test that AaAgreement instance returns correct immutable fields."""
        agreement = AaAgreement(
            name="Test AA Agreement",
            agreement_type=AgreementType.AA,
            requesting_agency_id=1,
            servicing_agency_id=1,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        immutable_fields = agreement.immutable_awarded_fields

        # Verify it returns a list
        assert isinstance(immutable_fields, list)

        # Verify all expected fields are present
        expected_fields = [
            "name",
            "requesting_agency_id",
            "servicing_agency_id",
            "contract_type",
            "service_requirement_type",
            "product_service_code_id",
            "awarding_entity_id",
            "agreement_reason",
            "vendor",
        ]
        assert immutable_fields == expected_fields

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_aa_agreement_immutable_fields_count(self, loaded_db, app_ctx):
        """Test that AaAgreement returns exactly 8 immutable fields."""
        agreement = AaAgreement(
            name="Test AA Agreement - Count",
            agreement_type=AgreementType.AA,
            requesting_agency_id=1,
            servicing_agency_id=1,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        assert len(agreement.immutable_awarded_fields) == 9

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_direct_agreement_immutable_fields_empty(self, loaded_db, app_ctx):
        """Test that DirectAgreement returns empty list for immutable fields."""
        agreement = DirectAgreement(
            name="Test Direct Agreement",
            agreement_type=AgreementType.DIRECT_OBLIGATION,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        immutable_fields = agreement.immutable_awarded_fields

        assert isinstance(immutable_fields, list)
        assert immutable_fields == []
        assert len(immutable_fields) == 0

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_property_matches_classmethod(self, loaded_db, app_ctx):
        """Test that immutable_awarded_fields property returns same result as classmethod."""
        agreement = ContractAgreement(
            name="Test Contract Agreement - Classmethod Match",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Get result from property
        property_result = agreement.immutable_awarded_fields

        # Get result from classmethod
        classmethod_result = ContractAgreement.get_required_fields_for_awarded_agreement()

        # They should be equal
        assert property_result == classmethod_result

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_property_is_accessible_without_parentheses(self, loaded_db, app_ctx):
        """Test that immutable_awarded_fields is accessed as a property (no parentheses)."""
        agreement = ContractAgreement(
            name="Test Contract Agreement - Property Access",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # This should work (property access)
        fields = agreement.immutable_awarded_fields
        assert isinstance(fields, list)

        # Verify it's a property, not a method
        import inspect

        assert isinstance(
            inspect.getattr_static(Agreement, "immutable_awarded_fields"), property
        ), "immutable_awarded_fields should be a property"

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_loaded_from_database_has_correct_immutable_fields(self, loaded_db, app_ctx):
        """Test that immutable_awarded_fields works correctly when agreement is loaded from database."""
        # Create and commit an agreement
        agreement = ContractAgreement(
            name="Test Contract Agreement - Database Load",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()
        agreement_id = agreement.id

        # Clear session to force fresh load from database
        loaded_db.expunge_all()

        # Load agreement from database
        loaded_agreement = loaded_db.get(Agreement, agreement_id)
        assert loaded_agreement is not None

        # Check immutable_awarded_fields
        immutable_fields = loaded_agreement.immutable_awarded_fields
        expected_fields = [
            "name",
            "contract_type",
            "service_requirement_type",
            "product_service_code_id",
            "awarding_entity_id",
            "agreement_reason",
            "vendor",
        ]
        assert immutable_fields == expected_fields

        # Cleanup
        loaded_db.delete(loaded_agreement)
        loaded_db.commit()

    def test_multiple_instances_have_independent_results(self, loaded_db, app_ctx):
        """Test that multiple instances can independently access immutable_awarded_fields."""
        contract_agreement = ContractAgreement(
            name="Test Contract Agreement - Multiple Instances",
            agreement_type=AgreementType.CONTRACT,
        )
        grant_agreement = GrantAgreement(
            name="Test Grant Agreement - Multiple Instances",
            agreement_type=AgreementType.GRANT,
        )

        loaded_db.add(contract_agreement)
        loaded_db.add(grant_agreement)
        loaded_db.commit()

        # Each should return its own fields
        contract_fields = contract_agreement.immutable_awarded_fields
        grant_fields = grant_agreement.immutable_awarded_fields

        assert len(contract_fields) == 7
        assert len(grant_fields) == 0
        assert contract_fields != grant_fields

        # Cleanup
        loaded_db.delete(contract_agreement)
        loaded_db.delete(grant_agreement)
        loaded_db.commit()

    def test_all_agreement_types_have_property(self, loaded_db, app_ctx):
        """Test that all Agreement subclasses have the immutable_awarded_fields property."""
        agreement_instances = [
            ContractAgreement(
                name="Test Contract - All Types",
                agreement_type=AgreementType.CONTRACT,
            ),
            GrantAgreement(
                name="Test Grant - All Types",
                agreement_type=AgreementType.GRANT,
            ),
            IaaAgreement(
                name="Test IAA - All Types",
                agreement_type=AgreementType.IAA,
                direction=IAADirectionType.INCOMING,
            ),
            AaAgreement(
                name="Test AA - All Types",
                agreement_type=AgreementType.AA,
                requesting_agency_id=1,
                servicing_agency_id=1,
            ),
            DirectAgreement(
                name="Test Direct - All Types",
                agreement_type=AgreementType.DIRECT_OBLIGATION,
            ),
        ]

        for agreement in agreement_instances:
            loaded_db.add(agreement)
            loaded_db.commit()

            # All should have the property
            assert hasattr(agreement, "immutable_awarded_fields")
            # All should return a list
            assert isinstance(agreement.immutable_awarded_fields, list)

        # Cleanup
        for agreement in agreement_instances:
            loaded_db.delete(agreement)
        loaded_db.commit()

    def test_property_returns_list_of_strings(self, loaded_db, app_ctx):
        """Test that immutable_awarded_fields returns a list of strings."""
        agreement = ContractAgreement(
            name="Test Contract Agreement - List of Strings",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        immutable_fields = agreement.immutable_awarded_fields

        assert isinstance(immutable_fields, list)
        for field in immutable_fields:
            assert isinstance(field, str), f"Field '{field}' should be a string"

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_aa_agreement_includes_aa_specific_fields(self, loaded_db, app_ctx):
        """Test that AaAgreement immutable fields include AA-specific agency fields."""
        agreement = AaAgreement(
            name="Test AA Agreement - Specific Fields",
            agreement_type=AgreementType.AA,
            requesting_agency_id=1,
            servicing_agency_id=1,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        immutable_fields = agreement.immutable_awarded_fields

        # Should include AA-specific fields
        assert "requesting_agency_id" in immutable_fields
        assert "servicing_agency_id" in immutable_fields

        # Should also include base contract fields
        assert "name" in immutable_fields
        assert "contract_type" in immutable_fields

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_property_consistent_across_multiple_accesses(self, loaded_db, app_ctx):
        """Test that accessing the property multiple times returns consistent results."""
        agreement = ContractAgreement(
            name="Test Contract Agreement - Consistent Access",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        # Access property multiple times
        fields1 = agreement.immutable_awarded_fields
        fields2 = agreement.immutable_awarded_fields
        fields3 = agreement.immutable_awarded_fields

        # All should be equal
        assert fields1 == fields2
        assert fields2 == fields3
        assert fields1 == fields3

        # Cleanup
        loaded_db.delete(agreement)
        loaded_db.commit()

    def test_no_duplicate_fields_in_property_result(self, loaded_db, app_ctx):
        """Test that immutable_awarded_fields does not contain duplicate fields."""
        test_agreements = [
            ContractAgreement(
                name="Test Contract - No Duplicates",
                agreement_type=AgreementType.CONTRACT,
            ),
            AaAgreement(
                name="Test AA - No Duplicates",
                agreement_type=AgreementType.AA,
                requesting_agency_id=1,
                servicing_agency_id=1,
            ),
        ]

        for agreement in test_agreements:
            loaded_db.add(agreement)
            loaded_db.commit()

            immutable_fields = agreement.immutable_awarded_fields
            unique_fields = set(immutable_fields)

            assert len(immutable_fields) == len(
                unique_fields
            ), f"{agreement.__class__.__name__} has duplicate fields in immutable_awarded_fields"

        # Cleanup
        for agreement in test_agreements:
            loaded_db.delete(agreement)
        loaded_db.commit()

    def test_attempting_to_modify_immutable_fields_marks_ops_event_failed(self, loaded_db, auth_client, app_ctx):
        """Test that attempting to modify immutable fields results in an OpsEvent failure."""
        agreement = ContractAgreement(
            name="Test Contract Agreement - Modify Immutable",
            agreement_type=AgreementType.CONTRACT,
        )
        loaded_db.add(agreement)
        loaded_db.commit()

        procurement_action = ProcurementAction(
            agreement_id=agreement.id,
            award_type=AwardType.NEW_AWARD,
            status=ProcurementActionStatus.AWARDED,
        )

        loaded_db.add(procurement_action)
        loaded_db.commit()

        response = auth_client.patch(
            url_for("api.agreements-item", id=agreement.id),
            json={"name": "Update Test Contract Agreement - Modify Immutable"},  # Attempt to modify an immutable field
        )

        assert response.status_code == 400
        response_data = response.get_json()
        assert "name" in response_data["errors"]

        # check for the ops_event indicating failure
        result = loaded_db.scalar(
            select(OpsEvent)
            .where(
                OpsEvent.event_type == OpsEventType.UPDATE_AGREEMENT,
                OpsEvent.event_status == OpsEventStatus.FAILED,
                OpsEvent.event_details["error_type"].astext.cast(String)
                == "<class 'ops_api.ops.services.ops_service.ValidationError'>",
                OpsEvent.event_details["agreement_id"].astext.cast(Integer) == agreement.id,
            )
            .order_by(OpsEvent.id.desc())
            .limit(1)
        )

        assert result is not None, "Expected OpsEvent for failed update not found"

        # Cleanup
        loaded_db.delete(procurement_action)
        loaded_db.delete(agreement)
        loaded_db.commit()
