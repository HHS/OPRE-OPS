"""
Unit tests for AgreementRequestSchema pagination support.
Tests verify that the schema properly inherits from PaginationSchema
and validates limit and offset parameters correctly.
"""

import pytest
from marshmallow import ValidationError

from ops_api.ops.schemas.agreements import AgreementRequestSchema


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
