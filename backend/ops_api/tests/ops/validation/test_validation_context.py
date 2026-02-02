"""Tests for ValidationContext."""

from ops_api.ops.validation.context import ValidationContext


class TestValidationContext:
    """Test suite for ValidationContext."""

    def test_validation_context_creation(self, test_user, loaded_db, app_ctx):
        """Test that ValidationContext can be created with required fields."""
        updated_fields = {"name": "Test Agreement"}

        context = ValidationContext(user=test_user, updated_fields=updated_fields, db_session=loaded_db)

        assert context.user == test_user
        assert context.updated_fields == updated_fields
        assert context.db_session == loaded_db
        assert context.metadata == {}

    def test_validation_context_with_metadata(self, test_user, loaded_db, app_ctx):
        """Test that ValidationContext can be created with metadata."""
        updated_fields = {"name": "Test Agreement"}
        metadata = {"request_source": "web_ui", "api_version": "v2"}

        context = ValidationContext(
            user=test_user, updated_fields=updated_fields, db_session=loaded_db, metadata=metadata
        )

        assert context.metadata == metadata

    def test_get_metadata_returns_value(self, test_user, loaded_db, app_ctx):
        """Test that get_metadata returns the correct value."""
        context = ValidationContext(
            user=test_user, updated_fields={}, db_session=loaded_db, metadata={"key1": "value1", "key2": "value2"}
        )

        assert context.get_metadata("key1") == "value1"
        assert context.get_metadata("key2") == "value2"

    def test_get_metadata_returns_default_when_key_not_found(self, test_user, loaded_db, app_ctx):
        """Test that get_metadata returns default value when key not found."""
        context = ValidationContext(user=test_user, updated_fields={}, db_session=loaded_db)

        assert context.get_metadata("nonexistent") is None
        assert context.get_metadata("nonexistent", "default_value") == "default_value"

    def test_set_metadata_adds_new_key(self, test_user, loaded_db, app_ctx):
        """Test that set_metadata adds a new key-value pair."""
        context = ValidationContext(user=test_user, updated_fields={}, db_session=loaded_db)

        context.set_metadata("new_key", "new_value")

        assert context.metadata["new_key"] == "new_value"
        assert context.get_metadata("new_key") == "new_value"

    def test_set_metadata_updates_existing_key(self, test_user, loaded_db, app_ctx):
        """Test that set_metadata updates an existing key."""
        context = ValidationContext(
            user=test_user, updated_fields={}, db_session=loaded_db, metadata={"key": "old_value"}
        )

        context.set_metadata("key", "new_value")

        assert context.metadata["key"] == "new_value"
        assert context.get_metadata("key") == "new_value"

    def test_metadata_is_independent_instance(self, test_user, loaded_db, app_ctx):
        """Test that each context has its own metadata dictionary."""
        context1 = ValidationContext(user=test_user, updated_fields={}, db_session=loaded_db)
        context2 = ValidationContext(user=test_user, updated_fields={}, db_session=loaded_db)

        context1.set_metadata("key", "value1")
        context2.set_metadata("key", "value2")

        assert context1.get_metadata("key") == "value1"
        assert context2.get_metadata("key") == "value2"
