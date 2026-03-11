---
name: db-migrations
description: Create, review, test, and rollback Alembic database migrations for OPRE OPS. Use this skill whenever the user mentions database migrations, alembic, schema changes, adding/modifying columns or tables, model changes that need migration, or "migrate the database". Also use when a model change has been made and the user needs to generate the corresponding migration.
argument-hint: "[create <message> | review | upgrade | downgrade | status | history]"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
disable-model-invocation: true
---

# Database Migration Manager

You manage Alembic database migrations for the OPRE OPS project. Migrations must be run from the `backend/` directory because that's where `alembic.ini` lives and where `models` is importable.

## How to Determine What to Do

Interpret `$ARGUMENTS` to decide the action:

### 1. Create Migration: `$ARGUMENTS` starts with `create`

Generate a new migration from model changes.

**Step 1: Verify the working directory and database**
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend

# Check that the database is running
docker compose ps db --format json 2>/dev/null | jq -r '.Name + " " + .State' || echo "DB service not found — is Docker running?"

# Check current migration state
alembic current
```

If the database isn't running, tell the user:
```bash
docker compose up db -d
```

**Step 2: Check for model changes**

Look at what's changed to understand what the migration should contain:
```bash
# What model files have changed on this branch?
git diff main...HEAD --name-only -- models/

# Or if working off unstaged changes:
git diff --name-only -- models/
```

Read the changed model files to understand the schema changes.

**Step 3: Generate the migration**

Extract the message from `$ARGUMENTS` (everything after "create"):
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend
alembic revision --autogenerate -m "your migration message"
```

Migration files follow the naming pattern: `YYYY_MM_DD_HHMM-<revision>_<slug>.py` and are created in `backend/alembic/versions/`.

**Step 4: Review the generated migration (critical!)**

Auto-generated migrations can miss things or generate incorrect operations. Read the new file and check for:

- **Dropped columns/tables**: Alembic sometimes generates drops for things it can't detect properly. If a column was renamed rather than dropped-and-added, fix the migration to use `op.alter_column()` instead.
- **Missing operations**: Alembic can't auto-detect: table/column renames, changes to constraints names, or changes to enum values. These need manual additions.
- **Data migrations**: If the schema change requires data transformation (e.g., populating a new non-nullable column), add data migration logic between the schema changes.
- **Downgrade function**: Verify the `downgrade()` reverses the `upgrade()` correctly.
- **Import statements**: Ensure any custom types or enums are imported.

Present a summary to the user: "Here's what the migration does: [list of operations]. Does this look right?"

**Step 5: Test the migration**
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend

# Apply the migration
alembic upgrade head

# Verify it applied
alembic current

# Test the downgrade
alembic downgrade -1

# Re-apply to leave DB in upgraded state
alembic upgrade head
```

Report results: whether upgrade and downgrade both succeeded, and any errors encountered.

### 2. Review Migration: `$ARGUMENTS` is `review` or `review <filename>`

Review an existing migration file for correctness.

If a specific filename is provided, read that file. Otherwise, review the most recent migration:
```bash
ls -t /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend/alembic/versions/*.py | head -1
```

Check for the same issues listed in Step 4 above. Also check:
- That the revision chain is correct (`Revises:` points to the expected parent)
- That the migration is idempotent where possible (e.g., `if not` guards for index creation)
- That the migration doesn't break existing data (e.g., adding a NOT NULL column without a default)

### 3. Upgrade: `$ARGUMENTS` is `upgrade` or `upgrade <target>`

Apply migrations:
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend

# Upgrade to head (default)
alembic upgrade head

# Or upgrade to a specific revision
alembic upgrade <target>

# Verify
alembic current
```

### 4. Downgrade: `$ARGUMENTS` is `downgrade` or `downgrade <target>`

Roll back migrations:
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend

# Roll back one migration (default)
alembic downgrade -1

# Or downgrade to a specific revision
alembic downgrade <target>

# Verify
alembic current
```

### 5. Status: `$ARGUMENTS` is `status`

Show the current migration state:
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend

# Current revision applied to the database
alembic current

# Check if there are unapplied migrations
alembic check 2>&1 || true

# Show the head revision
alembic heads
```

Report whether the database is up to date or has pending migrations.

### 6. History: `$ARGUMENTS` is `history`

Show recent migration history:
```bash
cd /Users/jdeangelis/PycharmProjects/OPRE-OPS-2/backend

# Show last 10 migrations
alembic history -r -10:current --verbose
```

### 7. Default: `$ARGUMENTS` is empty or unrecognized

Show help:
```
Database Migration Skill - Available Commands:

  /db-migrations create <message>   Generate a new migration from model changes
  /db-migrations review             Review the most recent migration for correctness
  /db-migrations review <file>      Review a specific migration file
  /db-migrations upgrade            Apply all pending migrations (alembic upgrade head)
  /db-migrations downgrade          Roll back one migration (alembic downgrade -1)
  /db-migrations status             Show current migration state and pending changes
  /db-migrations history            Show recent migration history

Prerequisites:
  - Docker database must be running: docker compose up db -d
  - Run from backend/ directory (handled automatically by this skill)
  - 67 existing migrations in backend/alembic/versions/
```

## Key File Locations

- **Alembic config**: `backend/alembic.ini`
- **Migration versions**: `backend/alembic/versions/` (67 migrations)
- **Alembic env**: `backend/alembic/env.py`
- **Models**: `backend/models/` (shared across ops_api and data_tools)
- **Schema reset scripts**: `backend/data_tools/scripts/initial_data.sh`, `backend/data_tools/scripts/upgrade_schema.sh`

## Common Pitfalls

- **Wrong directory**: Alembic must run from `backend/`, not `backend/ops_api/` or the project root
- **Renamed columns**: Alembic generates a drop + add instead of a rename. Use `op.alter_column()` with `new_column_name` manually.
- **Enum changes**: Alembic can't auto-detect new enum values. Add `op.execute("ALTER TYPE ... ADD VALUE ...")` manually.
- **Non-nullable columns**: Adding a NOT NULL column to an existing table needs a server default or a two-step migration (add nullable, backfill, alter to non-null).
- **History triggers**: The app uses `before_commit`/`after_flush` for history tracking. Migrations that add new models should ensure the corresponding `*_history` table is also created if the model inherits from `BaseModel`.
