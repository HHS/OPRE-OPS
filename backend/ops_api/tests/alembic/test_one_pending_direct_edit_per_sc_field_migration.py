"""Migration test for 9c2e7a4d1b38 (one pending direct edit per services component field).

Before the partial unique index can be created, any duplicate pending ``contract_modification_edit``
rows for the same (services_component_id, field) must be dropped (keeping the newest), or
``CREATE UNIQUE INDEX`` fails on an environment that already has them.
"""

import datetime
import importlib.util
from pathlib import Path

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from models import AgreementMod, ContractModificationEdit, ModificationEditType

MIGRATION_PATH = (
    Path(__file__).resolve().parents[3]
    / "alembic"
    / "versions"
    / "2026_11_18_1200-9c2e7a4d1b38_one_pending_direct_edit_per_sc_field.py"
)
# services_component_id has no FK (rows outlive the SC), so any id works here.
SC_ID = 987654


def _load_migration_module():
    spec = importlib.util.spec_from_file_location("one_pending_direct_edit_per_sc_field_migration", MIGRATION_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture()
def migration(loaded_db):
    """Drop the index and column the migration creates, simulating the pre-migration schema."""
    module = _load_migration_module()
    connection = loaded_db.connection()
    connection.execute(text(f"DROP INDEX IF EXISTS {module.PENDING_SC_FIELD_INDEX}"))
    for table in ("contract_modification_edit", "contract_modification_edit_version"):
        connection.execute(text(f"ALTER TABLE {table} DROP COLUMN IF EXISTS {module.DISPLAY_NAME_COLUMN}"))
    return module


def _run_upgrade(loaded_db, migration):
    ctx = MigrationContext.configure(loaded_db.connection())
    with Operations.context(ctx):
        migration.upgrade()
    loaded_db.expire_all()


def _insert(loaded_db, agreement_id, field, requested_on, *, sc_id=SC_ID, bli_id=None, agreement_mod_id=None):
    """Insert a row with raw SQL: before the upgrade the table doesn't have the ORM model's new
    column yet."""
    return loaded_db.execute(
        text(
            "INSERT INTO contract_modification_edit (agreement_id, modification_type, services_component_id, "
            "budget_line_item_id, field, requested_on, agreement_mod_id) "
            "VALUES (:agreement_id, 'MODIFIED_LOE', :sc_id, :bli_id, :field, :requested_on, :agreement_mod_id) "
            "RETURNING id"
        ),
        {
            "agreement_id": agreement_id,
            "sc_id": sc_id,
            "bli_id": bli_id,
            "field": field,
            "requested_on": requested_on,
            "agreement_mod_id": agreement_mod_id,
        },
    ).scalar_one()


def _row_ids(loaded_db, field, sc_id=SC_ID):
    return set(
        loaded_db.execute(
            text("SELECT id FROM contract_modification_edit WHERE services_component_id = :sc_id AND field = :field"),
            {"sc_id": sc_id, "field": field},
        ).scalars()
    )


def _ago(days):
    return datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)


def test_duplicate_pending_rows_collapse_to_the_newest(loaded_db, migration, test_bli):
    _insert(loaded_db, test_bli.agreement_id, "services_component_create", _ago(2))
    newer_id = _insert(loaded_db, test_bli.agreement_id, "services_component_create", _ago(1))

    _run_upgrade(loaded_db, migration)

    assert _row_ids(loaded_db, "services_component_create") == {newer_id}


def test_keeps_a_row_already_attached_to_a_modification(loaded_db, migration, test_bli):
    agreement_mod = AgreementMod(agreement_id=test_bli.agreement_id)
    loaded_db.add(agreement_mod)
    loaded_db.flush()
    attached_id = _insert(loaded_db, test_bli.agreement_id, "period_end", _ago(3), agreement_mod_id=agreement_mod.id)
    pending_id = _insert(loaded_db, test_bli.agreement_id, "period_end", _ago(1))

    _run_upgrade(loaded_db, migration)

    assert _row_ids(loaded_db, "period_end") == {attached_id, pending_id}


def test_leaves_a_solo_row_and_budget_line_rows_untouched(loaded_db, migration, test_bli):
    solo_id = _insert(loaded_db, test_bli.agreement_id, "period_start", _ago(1))
    # Budget line rows aren't the SC's own rows, even with the same services_component_id/field.
    bli_ids = {
        _insert(loaded_db, test_bli.agreement_id, "amount", _ago(2), bli_id=test_bli.id),
        _insert(loaded_db, test_bli.agreement_id, "amount", _ago(1), bli_id=test_bli.id + 1),
    }

    _run_upgrade(loaded_db, migration)

    assert _row_ids(loaded_db, "period_start") == {solo_id}
    assert _row_ids(loaded_db, "amount") == bli_ids


def test_adds_the_display_name_column_and_the_index_rejects_a_duplicate(loaded_db, migration, test_bli):
    _insert(loaded_db, test_bli.agreement_id, "period_end", _ago(1))

    _run_upgrade(loaded_db, migration)

    loaded_db.add(
        ContractModificationEdit(
            agreement_id=test_bli.agreement_id,
            modification_type=ModificationEditType.MODIFIED_LOE,
            services_component_id=SC_ID,
            field="period_end",
            services_component_display_name="SC2",
        )
    )
    with pytest.raises(IntegrityError):
        loaded_db.flush()


def _display_name_column_tables(loaded_db):
    return set(
        loaded_db.execute(
            text(
                "SELECT table_name FROM information_schema.columns "
                "WHERE column_name = 'services_component_display_name' "
                "AND table_name IN ('contract_modification_edit', 'contract_modification_edit_version')"
            )
        ).scalars()
    )


def test_upgrade_adds_the_display_name_column_to_the_table_and_its_version_table(loaded_db, migration, test_bli):
    _run_upgrade(loaded_db, migration)

    assert _display_name_column_tables(loaded_db) == {
        "contract_modification_edit",
        "contract_modification_edit_version",
    }


def test_downgrade_removes_the_display_name_column_and_upgrade_restores_it(loaded_db, migration, test_bli):
    _run_upgrade(loaded_db, migration)

    ctx = MigrationContext.configure(loaded_db.connection())
    with Operations.context(ctx):
        migration.downgrade()
    assert _display_name_column_tables(loaded_db) == set()

    _run_upgrade(loaded_db, migration)
    assert _display_name_column_tables(loaded_db) == {
        "contract_modification_edit",
        "contract_modification_edit_version",
    }
