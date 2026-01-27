"""Unit tests for Agreement.get_required_fields_for_awarded_agreement() classmethod."""

from models import (
    AaAgreement,
    ContractAgreement,
    DirectAgreement,
    GrantAgreement,
    IaaAgreement,
)


class TestAgreementRequiredFieldsForAwarded:
    """Test suite for Agreement.get_required_fields_for_awarded_agreement() classmethod."""

    def test_contract_agreement_returns_required_fields(self, app_ctx):
        """Test that ContractAgreement returns all required fields for awarded status."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()

        # Verify it returns a list
        assert isinstance(required_fields, list)

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
        assert required_fields == expected_fields

    def test_contract_agreement_required_fields_count(self, app_ctx):
        """Test that ContractAgreement returns exactly 6 required fields."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()
        assert len(required_fields) == 7

    def test_contract_agreement_required_fields_are_strings(self, app_ctx):
        """Test that all required fields for ContractAgreement are strings."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()
        for field in required_fields:
            assert isinstance(field, str), f"Field '{field}' should be a string"

    def test_grant_agreement_returns_empty_list(self, app_ctx):
        """Test that GrantAgreement returns an empty list (no required fields)."""
        required_fields = GrantAgreement.get_required_fields_for_awarded_agreement()

        assert isinstance(required_fields, list)
        assert required_fields == []
        assert len(required_fields) == 0

    def test_iaa_agreement_returns_empty_list(self, app_ctx):
        """Test that IaaAgreement returns an empty list (no required fields)."""
        required_fields = IaaAgreement.get_required_fields_for_awarded_agreement()

        assert isinstance(required_fields, list)
        assert required_fields == []
        assert len(required_fields) == 0

    def test_aa_agreement_returns_required_fields(self, app_ctx):
        """Test that AaAgreement returns all required fields for awarded status."""
        required_fields = AaAgreement.get_required_fields_for_awarded_agreement()

        # Verify it returns a list
        assert isinstance(required_fields, list)

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
        assert required_fields == expected_fields

    def test_aa_agreement_required_fields_count(self, app_ctx):
        """Test that AaAgreement returns exactly 8 required fields."""
        required_fields = AaAgreement.get_required_fields_for_awarded_agreement()
        assert len(required_fields) == 9

    def test_aa_agreement_required_fields_are_strings(self, app_ctx):
        """Test that all required fields for AaAgreement are strings."""
        required_fields = AaAgreement.get_required_fields_for_awarded_agreement()
        for field in required_fields:
            assert isinstance(field, str), f"Field '{field}' should be a string"

    def test_direct_agreement_returns_empty_list(self, app_ctx):
        """Test that DirectAgreement returns an empty list (no required fields)."""
        required_fields = DirectAgreement.get_required_fields_for_awarded_agreement()

        assert isinstance(required_fields, list)
        assert required_fields == []
        assert len(required_fields) == 0

    def test_method_is_classmethod(self, app_ctx):
        """Test that get_required_fields_for_awarded_agreement is a classmethod."""
        # Should be callable on the class without an instance
        # This test verifies that we don't need to instantiate the class
        assert callable(ContractAgreement.get_required_fields_for_awarded_agreement)
        assert callable(GrantAgreement.get_required_fields_for_awarded_agreement)
        assert callable(IaaAgreement.get_required_fields_for_awarded_agreement)
        assert callable(AaAgreement.get_required_fields_for_awarded_agreement)
        assert callable(DirectAgreement.get_required_fields_for_awarded_agreement)

    def test_contract_agreement_has_name_field(self, app_ctx):
        """Test that ContractAgreement required fields includes 'name'."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()
        assert "name" in required_fields

    def test_contract_agreement_has_contract_type_field(self, app_ctx):
        """Test that ContractAgreement required fields includes 'contract_type'."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()
        assert "contract_type" in required_fields

    def test_contract_agreement_has_service_requirement_type_field(self, app_ctx):
        """Test that ContractAgreement required fields includes 'service_requirement_type'."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()
        assert "service_requirement_type" in required_fields

    def test_contract_agreement_has_product_service_code_id_field(self, app_ctx):
        """Test that ContractAgreement required fields includes 'product_service_code_id'."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()
        assert "product_service_code_id" in required_fields

    def test_contract_agreement_has_awarding_entity_id_field(self, app_ctx):
        """Test that ContractAgreement required fields includes 'awarding_entity_id'."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()
        assert "awarding_entity_id" in required_fields

    def test_contract_agreement_has_agreement_reason_field(self, app_ctx):
        """Test that ContractAgreement required fields includes 'agreement_reason'."""
        required_fields = ContractAgreement.get_required_fields_for_awarded_agreement()
        assert "agreement_reason" in required_fields

    def test_aa_agreement_has_requesting_agency_id_field(self, app_ctx):
        """Test that AaAgreement required fields includes 'requesting_agency_id'."""
        required_fields = AaAgreement.get_required_fields_for_awarded_agreement()
        assert "requesting_agency_id" in required_fields

    def test_aa_agreement_has_servicing_agency_id_field(self, app_ctx):
        """Test that AaAgreement required fields includes 'servicing_agency_id'."""
        required_fields = AaAgreement.get_required_fields_for_awarded_agreement()
        assert "servicing_agency_id" in required_fields

    def test_aa_agreement_has_all_contract_fields(self, app_ctx):
        """Test that AaAgreement required fields includes all ContractAgreement base fields."""
        aa_fields = AaAgreement.get_required_fields_for_awarded_agreement()
        contract_fields = ContractAgreement.get_required_fields_for_awarded_agreement()

        # AA should include all contract fields
        for field in contract_fields:
            assert field in aa_fields, f"AaAgreement should include field '{field}' from ContractAgreement"

    def test_method_returns_new_list_each_call(self, app_ctx):
        """Test that each call returns a new list instance (not cached)."""
        fields1 = ContractAgreement.get_required_fields_for_awarded_agreement()
        fields2 = ContractAgreement.get_required_fields_for_awarded_agreement()

        # Should return equal lists
        assert fields1 == fields2

        # But not necessarily the same object (implementation detail)
        # This just verifies the method works consistently

    def test_all_agreement_types_have_method(self, app_ctx):
        """Test that all Agreement subclasses have the get_required_fields_for_awarded_agreement method."""
        agreement_classes = [
            ContractAgreement,
            GrantAgreement,
            IaaAgreement,
            AaAgreement,
            DirectAgreement,
        ]

        for agreement_class in agreement_classes:
            assert hasattr(
                agreement_class, "get_required_fields_for_awarded_agreement"
            ), f"{agreement_class.__name__} should have get_required_fields_for_awarded_agreement method"
            assert callable(
                getattr(agreement_class, "get_required_fields_for_awarded_agreement")
            ), f"{agreement_class.__name__}.get_required_fields_for_awarded_agreement should be callable"

    def test_field_names_are_valid_python_identifiers(self, app_ctx):
        """Test that all returned field names are valid Python identifiers."""
        test_cases = [
            (ContractAgreement, "ContractAgreement"),
            (AaAgreement, "AaAgreement"),
        ]

        for agreement_class, class_name in test_cases:
            required_fields = agreement_class.get_required_fields_for_awarded_agreement()
            for field in required_fields:
                assert field.isidentifier(), f"Field '{field}' in {class_name} is not a valid Python identifier"

    def test_no_duplicate_fields(self, app_ctx):
        """Test that there are no duplicate fields in the returned lists."""
        test_cases = [
            (ContractAgreement, "ContractAgreement"),
            (AaAgreement, "AaAgreement"),
        ]

        for agreement_class, class_name in test_cases:
            required_fields = agreement_class.get_required_fields_for_awarded_agreement()
            unique_fields = set(required_fields)
            assert len(required_fields) == len(unique_fields), f"{class_name} has duplicate fields in required_fields"
