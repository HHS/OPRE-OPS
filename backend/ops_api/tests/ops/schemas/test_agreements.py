"""
Unit tests for Agreement schemas including pagination support and nested entity creation.
Tests verify that schemas properly validate agreement data, nested budget line items,
and nested services components for atomic creation.
"""

import types

import pytest
from marshmallow import ValidationError

from ops_api.ops.schemas.agreements import (
    AgreementRequestSchema,
    ContractAgreementData,
    GrantAgreementData,
)
from ops_api.ops.schemas.budget_line_items import NestedBudgetLineItemRequestSchema, SimpleAgreementSchema
from ops_api.ops.schemas.services_component import NestedServicesComponentRequestSchema


class TestAgreementRequestSchemaPagination:
    """Test pagination parameters in AgreementRequestSchema."""

    def test_schema_accepts_valid_limit(self):
        """Test that schema accepts limit parameter within valid range (1-50)."""
        schema = AgreementRequestSchema()
        data = {"limit": [10]}
        result = schema.load(data)
        assert result["limit"] == [10]

    def test_schema_accepts_valid_offset(self):
        """Test that schema accepts offset parameter >= 0."""
        schema = AgreementRequestSchema()
        data = {"offset": [0]}
        result = schema.load(data)
        assert result["offset"] == [0]

    def test_schema_applies_default_limit_when_omitted(self):
        """Test that schema applies default limit=[10] when omitted."""
        schema = AgreementRequestSchema()
        data = {}
        result = schema.load(data)
        assert result["limit"] == [10]

    def test_schema_applies_default_offset_when_omitted(self):
        """Test that schema applies default offset=[0] when omitted."""
        schema = AgreementRequestSchema()
        data = {}
        result = schema.load(data)
        assert result["offset"] == [0]

    def test_schema_validates_limit_minimum(self):
        """Test that schema validates limit < 1 raises ValidationError."""
        schema = AgreementRequestSchema()
        data = {"limit": [0]}
        with pytest.raises(ValidationError) as exc_info:
            schema.load(data)
        assert "Limit must be between 1 and 50" in str(exc_info.value)

    def test_schema_validates_limit_maximum(self):
        """Test that schema validates limit > 50 raises ValidationError."""
        schema = AgreementRequestSchema()
        data = {"limit": [51]}
        with pytest.raises(ValidationError) as exc_info:
            schema.load(data)
        assert "Limit must be between 1 and 50" in str(exc_info.value)

    def test_schema_validates_offset_minimum(self):
        """Test that schema validates offset < 0 raises ValidationError."""
        schema = AgreementRequestSchema()
        data = {"offset": [-1]}
        with pytest.raises(ValidationError) as exc_info:
            schema.load(data)
        assert "Offset must be greater than or equal to 0" in str(exc_info.value)

    def test_schema_accepts_limit_and_offset_as_list(self):
        """Test that schema accepts limit and offset in list format (marshmallow convention)."""
        schema = AgreementRequestSchema()
        data = {"limit": [25], "offset": [100]}
        result = schema.load(data)
        assert result["limit"] == [25]
        assert result["offset"] == [100]

    def test_schema_with_valid_limit_boundary_values(self):
        """Test schema with limit boundary values (1 and 50)."""
        schema = AgreementRequestSchema()

        # Test minimum valid value
        data_min = {"limit": [1]}
        result_min = schema.load(data_min)
        assert result_min["limit"] == [1]

        # Test maximum valid value
        data_max = {"limit": [50]}
        result_max = schema.load(data_max)
        assert result_max["limit"] == [50]

    def test_schema_with_other_filter_parameters(self):
        """Test that pagination works alongside other filter parameters."""
        schema = AgreementRequestSchema()
        data = {
            "limit": [20],
            "offset": [10],
            "fiscal_year": [2024],
            "agreement_type": ["CONTRACT"],
        }
        result = schema.load(data)
        assert result["limit"] == [20]
        assert result["offset"] == [10]
        assert result["fiscal_year"] == [2024]
        assert result["agreement_type"] == ["CONTRACT"]


class TestNestedBudgetLineItemRequestSchema:
    """Test NestedBudgetLineItemRequestSchema for nested creation."""

    def test_schema_loads_valid_budget_line_item_data(self):
        """Test that schema loads valid budget line item data."""
        schema = NestedBudgetLineItemRequestSchema()
        data = {
            "line_description": "Year 1 Funding",
            "amount": 500000.00,
            "can_id": 500,
            "status": "PLANNED",
        }
        result = schema.load(data)
        assert result["line_description"] == "Year 1 Funding"
        assert result["amount"] == 500000.00
        assert result["can_id"] == 500
        # Status is deserialized as an Enum
        from models import BudgetLineItemStatus

        assert result["status"] == BudgetLineItemStatus.PLANNED

    def test_schema_loads_budget_line_item_with_services_component_id(self):
        """Test that schema accepts services_component_id for existing SC reference."""
        schema = NestedBudgetLineItemRequestSchema()
        data = {
            "line_description": "Year 1 Funding",
            "amount": 500000.00,
            "can_id": 500,
            "status": "PLANNED",
            "services_component_id": 123,
        }
        result = schema.load(data)
        assert result["services_component_id"] == 123

    def test_schema_loads_budget_line_item_with_services_component_ref(self):
        """Test that schema accepts services_component_ref for new SC reference."""
        schema = NestedBudgetLineItemRequestSchema()
        data = {
            "line_description": "Year 1 Funding",
            "amount": 500000.00,
            "can_id": 500,
            "status": "PLANNED",
            "services_component_ref": "base_period",
        }
        result = schema.load(data)
        assert result["services_component_ref"] == "base_period"
        assert "services_component_id" not in result

    def test_schema_rejects_both_services_component_id_and_ref(self):
        """Test that schema rejects both services_component_id and services_component_ref."""
        schema = NestedBudgetLineItemRequestSchema()
        data = {
            "line_description": "Year 1 Funding",
            "amount": 500000.00,
            "can_id": 500,
            "status": "PLANNED",
            "services_component_id": 123,
            "services_component_ref": "base_period",
        }
        with pytest.raises(ValidationError) as exc_info:
            schema.load(data)
        assert "Cannot specify both services_component_id and services_component_ref" in str(exc_info.value)

    def test_schema_excludes_agreement_id(self):
        """Test that agreement_id is not included in the schema (will be set by service layer)."""
        schema = NestedBudgetLineItemRequestSchema()
        # agreement_id should not be in the fields
        assert "agreement_id" not in schema.fields

    def test_schema_allows_optional_fields(self):
        """Test that optional fields can be omitted."""
        schema = NestedBudgetLineItemRequestSchema()
        data = {
            "line_description": "Year 1 Funding",
            "amount": 500000.00,
            "can_id": 500,
        }
        result = schema.load(data)
        assert result["line_description"] == "Year 1 Funding"
        assert result["amount"] == 500000.00


class TestNestedServicesComponentRequestSchema:
    """Test NestedServicesComponentRequestSchema for nested creation."""

    def test_schema_loads_valid_services_component_data(self):
        """Test that schema loads valid services component data."""
        schema = NestedServicesComponentRequestSchema()
        data = {
            "number": 1,
            "optional": False,
            "description": "Base Period",
            "period_start": "2025-10-01",
            "period_end": "2026-09-30",
        }
        result = schema.load(data)
        assert result["number"] == 1
        assert result["optional"] is False
        assert result["description"] == "Base Period"

    def test_schema_loads_services_component_with_ref(self):
        """Test that schema accepts ref field for temporary reference."""
        schema = NestedServicesComponentRequestSchema()
        data = {
            "ref": "base_period",
            "number": 1,
            "optional": False,
            "description": "Base Period",
        }
        result = schema.load(data)
        assert result["ref"] == "base_period"
        assert result["number"] == 1

    def test_schema_allows_ref_to_be_omitted(self):
        """Test that ref field can be omitted (will default to index)."""
        schema = NestedServicesComponentRequestSchema()
        data = {
            "number": 1,
            "optional": False,
            "description": "Base Period",
        }
        result = schema.load(data)
        assert "ref" not in result or result.get("ref") is None
        assert result["number"] == 1

    def test_schema_excludes_agreement_id(self):
        """Test that agreement_id is not included in the schema (will be set by service layer)."""
        schema = NestedServicesComponentRequestSchema()
        # agreement_id should not be in the fields
        assert "agreement_id" not in schema.fields

    def test_schema_requires_number_and_optional(self):
        """Test that number and optional are required fields."""
        schema = NestedServicesComponentRequestSchema()
        data = {
            "description": "Base Period",
        }
        with pytest.raises(ValidationError) as exc_info:
            schema.load(data)
        errors = exc_info.value.messages
        assert "number" in errors
        assert "optional" in errors


class TestAgreementDataNestedFields:
    """Test that agreement data schemas support nested entity creation."""

    def test_contract_agreement_data_has_nested_fields(self):
        """Test that ContractAgreementData has budget_line_items and services_components fields."""
        schema = ContractAgreementData()
        assert "budget_line_items" in schema.fields
        assert "services_components" in schema.fields

    def test_grant_agreement_data_has_nested_fields(self):
        """Test that GrantAgreementData has budget_line_items and services_components fields."""
        schema = GrantAgreementData()
        assert "budget_line_items" in schema.fields
        assert "services_components" in schema.fields

    def test_contract_agreement_loads_with_nested_budget_line_items(self):
        """Test that ContractAgreementData loads with nested budget line items."""
        schema = ContractAgreementData()
        data = {
            "name": "Test Contract",
            "agreement_type": "CONTRACT",
            "budget_line_items": [
                {
                    "line_description": "Year 1",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": "PLANNED",
                }
            ],
        }
        result = schema.load(data)
        assert result["name"] == "Test Contract"
        assert len(result["budget_line_items"]) == 1
        assert result["budget_line_items"][0]["line_description"] == "Year 1"

    def test_contract_agreement_loads_with_nested_services_components(self):
        """Test that ContractAgreementData loads with nested services components."""
        schema = ContractAgreementData()
        data = {
            "name": "Test Contract",
            "agreement_type": "CONTRACT",
            "services_components": [
                {
                    "ref": "base_period",
                    "number": 1,
                    "optional": False,
                    "description": "Base Period",
                }
            ],
        }
        result = schema.load(data)
        assert result["name"] == "Test Contract"
        assert len(result["services_components"]) == 1
        assert result["services_components"][0]["ref"] == "base_period"

    def test_contract_agreement_loads_with_blis_referencing_scs(self):
        """Test that BLIs can reference SCs using services_component_ref."""
        schema = ContractAgreementData()
        data = {
            "name": "Test Contract",
            "agreement_type": "CONTRACT",
            "services_components": [
                {
                    "ref": "base_period",
                    "number": 1,
                    "optional": False,
                }
            ],
            "budget_line_items": [
                {
                    "line_description": "Year 1",
                    "amount": 500000.00,
                    "can_id": 500,
                    "status": "PLANNED",
                    "services_component_ref": "base_period",
                }
            ],
        }
        result = schema.load(data)
        assert len(result["services_components"]) == 1
        assert len(result["budget_line_items"]) == 1
        assert result["budget_line_items"][0]["services_component_ref"] == "base_period"

    def test_agreement_allows_empty_nested_arrays(self):
        """Test that nested arrays can be empty (backward compatibility)."""
        schema = ContractAgreementData()
        data = {
            "name": "Test Contract",
            "agreement_type": "CONTRACT",
            "budget_line_items": [],
            "services_components": [],
        }
        result = schema.load(data)
        assert result["budget_line_items"] == []
        assert result["services_components"] == []

    def test_agreement_allows_omitted_nested_arrays(self):
        """Test that nested arrays can be omitted (backward compatibility)."""
        schema = ContractAgreementData()
        data = {
            "name": "Test Contract",
            "agreement_type": "CONTRACT",
        }
        result = schema.load(data)
        # Should default to empty arrays
        assert result.get("budget_line_items", []) == []
        assert result.get("services_components", []) == []


class TestSimpleAgreementSchema:
    """Test SimpleAgreementSchema used as a nested field in BudgetLineItemResponseSchema."""

    def test_simple_agreement_schema_has_all_expected_fields(self):
        """Test the schema contains exactly the expected fields."""
        schema = SimpleAgreementSchema()
        expected_fields = {"id", "agreement_type", "name", "awarding_entity_id", "project", "procurement_shop"}
        assert set(schema.fields.keys()) == expected_fields

    def test_simple_agreement_schema_procurement_shop_allows_none(self):
        """Test that procurement_shop field has allow_none=True."""
        schema = SimpleAgreementSchema()
        assert schema.fields["procurement_shop"].allow_none is True

    def test_simple_agreement_schema_procurement_shop_only_fields(self):
        """Test the nested procurement_shop field restricts to only {id, name, abbr, current_fee}."""
        schema = SimpleAgreementSchema()
        assert set(schema.fields["procurement_shop"].only) == {"id", "name", "abbr", "current_fee"}

    def test_simple_agreement_schema_dumps_with_procurement_shop(self):
        """Test serialization of an agreement with procurement_shop data."""
        schema = SimpleAgreementSchema()
        current_fee = types.SimpleNamespace(id=1, fee=0.05, start_date=None, end_date=None)
        procurement_shop = types.SimpleNamespace(
            id=10,
            name="GCS",
            abbr="GCS",
            current_fee=current_fee,
            fee_percentage=5.0,
            procurement_shop_fees=[],
        )
        project = types.SimpleNamespace(id=1, title="Test Project")
        agreement = types.SimpleNamespace(
            id=100,
            agreement_type="CONTRACT",
            name="Test Agreement",
            awarding_entity_id=42,
            project=project,
            procurement_shop=procurement_shop,
        )

        result = schema.dump(agreement)

        assert result["id"] == 100
        assert result["agreement_type"] == "CONTRACT"
        assert result["name"] == "Test Agreement"
        assert result["procurement_shop"]["id"] == 10
        assert result["procurement_shop"]["name"] == "GCS"
        assert result["procurement_shop"]["abbr"] == "GCS"
        assert result["procurement_shop"]["current_fee"] is not None
        # Fields not in 'only' should be excluded
        assert "fee_percentage" not in result["procurement_shop"]
        assert "procurement_shop_fees" not in result["procurement_shop"]

    def test_simple_agreement_schema_dumps_with_null_procurement_shop(self):
        """Test serialization of an agreement where procurement_shop is None."""
        schema = SimpleAgreementSchema()
        project = types.SimpleNamespace(id=1, title="Test Project")
        agreement = types.SimpleNamespace(
            id=200,
            agreement_type="GRANT",
            name="Grant Agreement",
            awarding_entity_id=None,
            project=project,
            procurement_shop=None,
        )

        result = schema.dump(agreement)

        assert result["id"] == 200
        assert result["procurement_shop"] is None
