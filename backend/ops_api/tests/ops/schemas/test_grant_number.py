"""Unit tests for GrantNumber schemas, including nested creation support."""

import pytest
from marshmallow import ValidationError

from ops_api.ops.schemas.grant_number import (
    GrantNumberCreateSchema,
    GrantNumberSchema,
    GrantNumberUpdateSchema,
    NestedGrantNumberRequestSchema,
)


class TestGrantNumberSchema:
    def test_schema_loads_valid_data(self):
        schema = GrantNumberSchema()
        data = {
            "id": 1,
            "agreement_id": 3,
            "number": 1,
            "description": "Base grant number",
            "period_start": "2025-10-01",
            "period_end": "2026-09-30",
        }
        result = schema.load(data)
        assert result["number"] == 1
        assert result["agreement_id"] == 3
        assert result["description"] == "Base grant number"

    def test_schema_dumps_display_fields(self):
        schema = GrantNumberSchema()
        dumped = schema.dump(
            {
                "id": 1,
                "agreement_id": 3,
                "number": 1,
                "description": "Base grant number",
                "display_title": "Grant 1",
                "display_name": "Grant 1",
            }
        )
        assert dumped["display_title"] == "Grant 1"
        assert dumped["display_name"] == "Grant 1"


class TestGrantNumberCreateSchema:
    def test_requires_agreement_id_and_number(self):
        schema = GrantNumberCreateSchema()
        with pytest.raises(ValidationError) as exc_info:
            schema.load({})
        errors = exc_info.value.messages
        assert "agreement_id" in errors
        assert "number" in errors


class TestGrantNumberUpdateSchema:
    def test_all_fields_optional(self):
        schema = GrantNumberUpdateSchema()
        result = schema.load({})
        assert result == {}

    def test_loads_partial_update(self):
        schema = GrantNumberUpdateSchema()
        result = schema.load({"description": "Updated description"})
        assert result["description"] == "Updated description"


class TestNestedGrantNumberRequestSchema:
    """Test NestedGrantNumberRequestSchema for nested creation."""

    def test_schema_loads_valid_grant_number_data(self):
        schema = NestedGrantNumberRequestSchema()
        data = {
            "number": 1,
            "description": "Base grant number",
            "period_start": "2025-10-01",
            "period_end": "2026-09-30",
        }
        result = schema.load(data)
        assert result["number"] == 1
        assert result["description"] == "Base grant number"

    def test_schema_loads_grant_number_with_ref(self):
        schema = NestedGrantNumberRequestSchema()
        data = {
            "ref": "grant-1",
            "number": 1,
            "description": "Base grant number",
        }
        result = schema.load(data)
        assert result["ref"] == "grant-1"
        assert result["number"] == 1

    def test_schema_allows_ref_to_be_omitted(self):
        schema = NestedGrantNumberRequestSchema()
        data = {"number": 1, "description": "Base grant number"}
        result = schema.load(data)
        assert "ref" not in result or result.get("ref") is None
        assert result["number"] == 1

    def test_schema_excludes_agreement_id(self):
        schema = NestedGrantNumberRequestSchema()
        assert "agreement_id" not in schema.fields

    def test_schema_requires_number(self):
        schema = NestedGrantNumberRequestSchema()
        data = {"description": "Missing number"}
        with pytest.raises(ValidationError) as exc_info:
            schema.load(data)
        errors = exc_info.value.messages
        assert "number" in errors
