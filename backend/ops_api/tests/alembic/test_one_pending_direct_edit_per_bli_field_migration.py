"""Migration test for 3581b3cbad42 (one pending direct edit per budget line field).

Before this migration's partial unique index can be created, any pre-existing duplicate pending
``contract_modification_edit`` rows for the same (budget_line_item_id, field) -- e.g. two approved
change requests for the same field, approved before this constraint existed -- must be merged
first, or ``CREATE UNIQUE INDEX`` fails on a persistent environment that already has such
duplicates.
"""

import datetime
import importlib.util
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from models import ContractModificationEdit, ModificationEditType

MIGRATION_PATH = (
    Path(__file__).resolve().parents[3]
    / "alembic"
    / "versions"
    / "2026_11_12_1952-3581b3cbad42_one_pending_direct_edit_per_bli_field.py"
)


def _load_migration_module():
    spec = importlib.util.spec_from_file_location("one_pending_direct_edit_per_bli_field_migration", MIGRATION_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture()
def migration(loaded_db):
    """Load the migration module and drop the index it creates, simulating the pre-migration
    schema -- the index is already applied on this test database by the normal migration chain."""
    module = _load_migration_module()
    connection = loaded_db.connection()
    connection.execute(text(f"DROP INDEX IF EXISTS {module.PENDING_BLI_FIELD_INDEX}"))
    return module


def _run_upgrade(loaded_db, migration):
    ctx = MigrationContext.configure(loaded_db.connection())
    with Operations.context(ctx):
        migration.upgrade()
    # The migration's DML runs as raw SQL, bypassing the ORM session -- expire the identity map
    # so a subsequent query re-reads the merged rows from the DB instead of returning the
    # already-loaded (now-stale) Python objects created earlier in the test.
    loaded_db.expire_all()


def _make_edit(agreement_id, bli_id, field, old_value, new_value, requested_on):
    return ContractModificationEdit(
        agreement_id=agreement_id,
        modification_type=ModificationEditType.MODIFIED_LOE,
        budget_line_item_id=bli_id,
        field=field,
        old_value=old_value,
        new_value=new_value,
        requested_on=requested_on,
    )


def _pending_edits(loaded_db, bli_id, field):
    return (
        loaded_db.query(ContractModificationEdit)
        .filter(
            ContractModificationEdit.budget_line_item_id == bli_id,
            ContractModificationEdit.field == field,
        )
        .all()
    )


def test_merges_duplicate_pending_edits_into_one_row(loaded_db, migration, test_bli):
    now = datetime.datetime.now(datetime.timezone.utc)
    older = _make_edit(
        test_bli.agreement_id, test_bli.id, "amount", 600000.0, 550000.0, now - datetime.timedelta(days=2)
    )
    newer = _make_edit(
        test_bli.agreement_id, test_bli.id, "amount", 550000.0, 500000.0, now - datetime.timedelta(days=1)
    )
    loaded_db.add_all([older, newer])
    loaded_db.flush()

    _run_upgrade(loaded_db, migration)

    remaining = _pending_edits(loaded_db, test_bli.id, "amount")
    assert len(remaining) == 1
    assert remaining[0].old_value == 600000.0
    assert remaining[0].new_value == 500000.0


def test_drops_the_merged_row_when_it_nets_to_no_change(loaded_db, migration, test_bli):
    now = datetime.datetime.now(datetime.timezone.utc)
    older = _make_edit(test_bli.agreement_id, test_bli.id, "can_id", 500, 501, now - datetime.timedelta(days=2))
    newer = _make_edit(test_bli.agreement_id, test_bli.id, "can_id", 501, 500, now - datetime.timedelta(days=1))
    loaded_db.add_all([older, newer])
    loaded_db.flush()

    _run_upgrade(loaded_db, migration)

    assert _pending_edits(loaded_db, test_bli.id, "can_id") == []


def test_leaves_a_non_duplicate_row_untouched(loaded_db, migration, test_bli):
    now = datetime.datetime.now(datetime.timezone.utc)
    solo = _make_edit(test_bli.agreement_id, test_bli.id, "date_needed", "2043-01-01", "2043-06-01", now)
    loaded_db.add(solo)
    loaded_db.flush()

    _run_upgrade(loaded_db, migration)

    remaining = _pending_edits(loaded_db, test_bli.id, "date_needed")
    assert len(remaining) == 1
    assert remaining[0].id == solo.id


def test_recreated_index_rejects_a_future_duplicate_insert(loaded_db, migration, test_bli):
    now = datetime.datetime.now(datetime.timezone.utc)
    loaded_db.add(_make_edit(test_bli.agreement_id, test_bli.id, "amount", 600000.0, 500000.0, now))
    loaded_db.flush()

    _run_upgrade(loaded_db, migration)

    loaded_db.add(_make_edit(test_bli.agreement_id, test_bli.id, "amount", 500000.0, 450000.0, now))
    with pytest.raises(IntegrityError):
        loaded_db.flush()
