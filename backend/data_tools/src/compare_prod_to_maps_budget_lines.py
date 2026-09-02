"""
Compare a legacy MAPS budget-line TSV/.txt export against the OPRE OPS database.

Splits the export into two CSVs:
- existing-lines: rows whose Sys_Budget_ID matches a live BudgetLineItem, with an added OBE column.
- missing-lines: rows whose Sys_Budget_ID is blank, non-numeric, or never matched any BudgetLineItem.

Rows whose Sys_Budget_ID matches a BudgetLineItem that was deleted from OPS are dropped entirely --
they appear in neither output file.

This script is READ-ONLY. It never writes, commits, or deletes anything in the database.

Usage (from backend/ directory):
    python data_tools/src/compare_prod_to_maps_budget_lines.py --env dev --input-file path/to/export.txt
"""

import csv
import os
import sys
import time
from csv import DictReader
from typing import Optional

import click
from dotenv import load_dotenv
from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session, configure_mappers, scoped_session, sessionmaker
from sqlalchemy_continuum import Operation, version_class

from data_tools.environment.types import DataToolsConfig
from data_tools.src.azure_utils.utils import get_csv
from data_tools.src.common.db import init_db_from_config
from data_tools.src.common.utils import get_config
from data_tools.src.load_remove_budget_lines.utils import BudgetLineItemData
from models import BudgetLineItem

load_dotenv(os.getenv("ENV_FILE", ".env"))

os.environ["TZ"] = "UTC"
if hasattr(time, "tzset"):
    time.tzset()

log_format = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
logger.remove()
logger.add(sys.stderr, format=log_format, level=LOG_LEVEL)

# Stay well under Postgres' bind-parameter limit for large exports.
CHUNK_SIZE = 1000

# Original MAPS export header text, in order. Used both to validate the input file's header
# row and as the output CSVs' header row, so the output stays comparable to the source file.
EXPECTED_HEADERS = [
    "Effective Date",
    "Requested by",
    "How Requested",
    "Change Reason(s)",
    "Who Updated",
    "Fiscal Year",
    "CAN",
    "Sys_Budget_ID",
    "Project Title",
    "CIG Name",
    "CIG Type",
    "Line Desc",
    "Date Needed",
    "Amount",
    "PROC Fee Amount",
    "Status",
    "Comments",
    "New (N) vs. Continuing (C)",
    "Applied Research (AR) vs. Evaluative (EV)",
]

OBE_COLUMN = "OBE"

# Columns that only ever appeared in the original (older) MAPS export format. Newer exports
# don't carry these, so when --exclude-legacy-columns is passed they're dropped from both
# output files instead of being written out blank on every row.
LEGACY_ONLY_COLUMNS = [
    "Effective Date",
    "Requested by",
    "How Requested",
    "Change Reason(s)",
    "Who Updated",
    "New (N) vs. Continuing (C)",
    "Applied Research (AR) vs. Evaluative (EV)",
]

# The only column this script actually depends on -- everything else is read best-effort and
# passed through to the output CSVs. MAPS export column sets have drifted over time (columns
# added/removed/renamed), so we no longer require an exact match against EXPECTED_HEADERS.
REQUIRED_HEADER = "Sys_Budget_ID"


def _normalize_sys_budget_id(raw_id: Optional[str]) -> Optional[str]:
    """Strip Excel-style thousands separators (e.g. "1,234" -> "1234") before handing off to
    the shared dataclass's int(float(...)) parsing, which already tolerates surrounding
    whitespace, leading zeros, and a trailing ".0" but chokes on embedded commas. Scoped to
    this script rather than the shared dataclass itself: this specifically legacy MAPS export
    is the one plausibly re-saved through Excel, whereas load_remove_budget_lines's own input
    has presumably only ever seen clean integers.
    """
    if isinstance(raw_id, str):
        return raw_id.replace(",", "")
    return raw_id


def create_compare_budget_line_data(row: dict) -> BudgetLineItemData:
    """Map a raw TSV row (keyed by the original MAPS header text) to the reused dataclass.

    Raises ValueError (propagated from BudgetLineItemData.__post_init__) if Sys_Budget_ID is
    blank/falsy, or if it's truthy but not parseable as an int.
    """
    return BudgetLineItemData(
        SYS_BUDGET_ID=_normalize_sys_budget_id(row.get("Sys_Budget_ID")),
        EFFECTIVE_DATE=row.get("Effective Date"),
        REQUESTED_BY=row.get("Requested by"),
        HOW_REQUESTED=row.get("How Requested"),
        CHANGE_REASONS=row.get("Change Reason(s)"),
        WHO_UPDATED=row.get("Who Updated"),
        FISCAL_YEAR=row.get("Fiscal Year"),
        CAN=row.get("CAN"),
        PROJECT_TITLE=row.get("Project Title"),
        CIG_NAME=row.get("CIG Name"),
        CIG_TYPE=row.get("CIG Type"),
        LINE_DESC=row.get("Line Desc"),
        DATE_NEEDED=row.get("Date Needed"),
        AMOUNT=row.get("Amount"),
        PROC_FEE_AMOUNT=row.get("PROC Fee Amount"),
        STATUS=row.get("Status"),
        COMMENTS=row.get("Comments"),
        NEW_VS_CONTINUING=row.get("New (N) vs. Continuing (C)"),
        APPLIED_RESEARCH_VS_EVALUATIVE=row.get("Applied Research (AR) vs. Evaluative (EV)"),
    )


def chunked(items, size: int = CHUNK_SIZE):
    """Yield successive `size`-length chunks from `items`."""
    items = list(items)
    for i in range(0, len(items), size):
        yield items[i : i + size]


def get_existing_bli_obe_map(session: Session, ids: set[int]) -> dict[int, Optional[bool]]:
    """Return {id: is_obe} for every id in `ids` that currently exists as a live BudgetLineItem.

    is_obe is nullable on BudgetLineItem (pre-migration rows were never backfilled), so a live
    id can map to None here, distinct from an explicit False. _serialize_obe is responsible for
    coercing that None to "False" for output -- this function itself must keep returning the raw
    nullable value so that distinction is still visible to any other caller.
    """
    result: dict[int, Optional[bool]] = {}
    for chunk in chunked(sorted(ids), CHUNK_SIZE):
        rows = session.execute(select(BudgetLineItem.id, BudgetLineItem.is_obe).where(BudgetLineItem.id.in_(chunk)))
        for bli_id, is_obe in rows:
            result[bli_id] = is_obe
    return result


def get_deleted_bli_ids(session: Session, ids: set[int]) -> set[int]:
    """Return the subset of `ids` whose BudgetLineItem was deleted from OPS.

    A budget line is "deleted" when its terminal (current) row in budget_line_item_version --
    the row with end_transaction_id IS NULL -- has operation_type == DELETE. Filtering on
    end_transaction_id IS NULL alone is NOT sufficient: every live row's current version is
    also terminal (operation_type INSERT or UPDATE), so without the operation_type filter this
    would misclassify every live id as deleted.

    Only the base BudgetLineItem's version table needs checking, even though BudgetLineItem has
    5 joined-table-inheritance subtypes -- a subclass insert/delete always also inserts/deletes
    the shared parent-table row in the same flush, so the base version table alone reveals
    deletion regardless of subtype.

    Calls configure_mappers() defensively before the first version_class() call: continuum
    builds each version class lazily via the mapper_configured event, and this script's own
    init_db_from_config -> init_db -> setup_schema(BaseModel)() call already triggers that as a
    side effect, but calling it again here is a harmless, idempotent safety net in case this
    function is ever exercised via a session built some other way (e.g. directly in a test).
    """
    if not ids:
        return set()

    configure_mappers()
    version_cls = version_class(BudgetLineItem)

    deleted_ids: set[int] = set()
    for chunk in chunked(sorted(ids), CHUNK_SIZE):
        rows = session.execute(
            select(version_cls.id).where(
                version_cls.id.in_(chunk),
                version_cls.end_transaction_id.is_(None),
                version_cls.operation_type == Operation.DELETE,
            )
        )
        deleted_ids.update(row[0] for row in rows)
    return deleted_ids


def _serialize_obe(is_obe: Optional[bool]) -> str:
    """None (never evaluated, e.g. a pre-migration row never backfilled) is treated as not-OBE."""
    return "True" if is_obe else "False"


def classify_budget_lines(session: Session, rows: list[dict]) -> tuple[list[dict], list[dict]]:
    """Split raw TSV rows into (existing_rows, missing_rows).

    existing_rows: Sys_Budget_ID matches a live BudgetLineItem; each row gains an "OBE" key.
    missing_rows: Sys_Budget_ID is blank, non-numeric, or never matched any BudgetLineItem.
    Rows whose Sys_Budget_ID matches a BudgetLineItem deleted from OPS are dropped from both.
    """
    parsed: list[tuple[dict, int]] = []
    missing_rows: list[dict] = []
    blank_count = 0
    non_numeric_count = 0

    for row in rows:
        raw_id = row.get("Sys_Budget_ID")
        try:
            data = create_compare_budget_line_data(row)
        except ValueError:
            if not raw_id:
                blank_count += 1
                logger.warning("Row has a blank Sys_Budget_ID; routing to missing-lines.")
            else:
                non_numeric_count += 1
                logger.warning(f"Row has a non-numeric Sys_Budget_ID ({raw_id!r}); routing to missing-lines.")
            missing_rows.append(row)
            continue
        parsed.append((row, data.SYS_BUDGET_ID))

    all_ids = {sys_id for _, sys_id in parsed}
    existing_map = get_existing_bli_obe_map(session, all_ids)
    remaining_ids = all_ids - existing_map.keys()
    deleted_ids = get_deleted_bli_ids(session, remaining_ids)

    existing_rows: list[dict] = []
    dropped_count = 0
    unmatched_count = 0

    for row, sys_id in parsed:
        if sys_id in existing_map:
            existing_rows.append({**row, OBE_COLUMN: _serialize_obe(existing_map[sys_id])})
        elif sys_id in deleted_ids:
            dropped_count += 1
        else:
            unmatched_count += 1
            missing_rows.append(row)

    logger.info(
        f"Classified {len(rows)} rows: {len(existing_rows)} existing, {dropped_count} deleted (dropped), "
        f"{unmatched_count} unmatched-id, {blank_count} blank-id, {non_numeric_count} non-numeric-id "
        f"(total missing: {len(missing_rows)})."
    )

    return existing_rows, missing_rows


def write_rows_csv(path: str, rows: list[dict], headers: list[str]) -> None:
    """Write `rows` to `path` as a CSV with the given `headers`."""
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def _read_input_file(input_path: str, config: DataToolsConfig) -> tuple[Optional[list[str]], list[dict]]:
    """Read `input_path` (local path or Azure blob URL) and return (fieldnames, rows).

    get_csv() reads local files fully into memory up front (closing the file handle
    immediately) and strips a leading UTF-8 BOM if present, so no BOM/file-handle handling is
    needed here. A genuinely undecodable byte still raises UnicodeDecodeError, which is
    translated into an actionable ValueError.
    """
    try:
        reader: DictReader = get_csv(input_path, config, dialect="excel-tab")
        fieldnames = reader.fieldnames
        rows = list(reader)
    except UnicodeDecodeError as err:
        raise ValueError(
            f"Could not read the input file as UTF-8: {err}\n"
            "The file may be saved in a different encoding (e.g. Windows-1252) -- "
            "re-save it as UTF-8 and try again."
        ) from err
    return fieldnames, rows


def run(
    input_path: str,
    existing_output_path: str,
    missing_output_path: str,
    session: Session,
    config: DataToolsConfig,
    exclude_legacy_columns: bool = False,
) -> None:
    """Read the MAPS export, classify every row, and write the two output CSVs.

    exclude_legacy_columns: when True, drop LEGACY_ONLY_COLUMNS from both output files' headers
    instead of writing them out blank on every row.
    """
    fieldnames, rows = _read_input_file(input_path, config)

    if fieldnames is None:
        raise ValueError("Input file is empty or could not be read.")

    stripped_fieldnames = [fn.strip() if isinstance(fn, str) else fn for fn in fieldnames]
    non_blank_fieldnames = [fn for fn in stripped_fieldnames if fn]

    if REQUIRED_HEADER not in non_blank_fieldnames:
        raise ValueError(f"Input file header is missing the required {REQUIRED_HEADER!r} column.\nGot: {fieldnames}")

    missing_expected = [h for h in EXPECTED_HEADERS if h not in non_blank_fieldnames]
    if missing_expected:
        logger.warning(
            "Input file header is missing columns from the original MAPS export format; "
            f"these will be blank in the output: {missing_expected}"
        )

    unrecognized = [fn for fn in non_blank_fieldnames if fn not in EXPECTED_HEADERS]
    if unrecognized:
        logger.warning(
            f"Input file header has columns not in the original MAPS export format; ignoring them: {unrecognized}"
        )

    if stripped_fieldnames != fieldnames or len(non_blank_fieldnames) != len(fieldnames):
        # Stray leading/trailing whitespace on a column name, and/or blank trailing columns from
        # an extra tab in the export. Re-key every row to the stripped, non-blank header names --
        # rows still carry the ORIGINAL keys at this point, so leaving them as-is would make e.g.
        # row.get("Amount") silently return None downstream if "Amount " had trailing whitespace.
        logger.warning(
            f"Input file header has stray whitespace or blank columns (raw: {fieldnames}); "
            "normalizing before processing."
        )
        field_map = [(raw, name) for raw, name in zip(fieldnames, stripped_fieldnames, strict=True) if name]
        rows = [{name: row.get(raw) for raw, name in field_map} for row in rows]

    logger.info(f"Read {len(rows)} rows from {input_path}.")

    existing_rows, missing_rows = classify_budget_lines(session, rows)

    output_headers = EXPECTED_HEADERS
    if exclude_legacy_columns:
        output_headers = [h for h in EXPECTED_HEADERS if h not in LEGACY_ONLY_COLUMNS]
        logger.info(f"Excluding legacy-only columns from output: {LEGACY_ONLY_COLUMNS}")

    write_rows_csv(existing_output_path, existing_rows, output_headers + [OBE_COLUMN])
    write_rows_csv(missing_output_path, missing_rows, output_headers)

    logger.info(f"Wrote {len(existing_rows)} rows to {existing_output_path}.")
    logger.info(f"Wrote {len(missing_rows)} rows to {missing_output_path}.")


@click.command()
@click.option("--env", required=True, help="The environment to use (dev, local, azure).")
@click.option("--input-file", required=True, help="Path or Azure blob URL to the MAPS budget-line export.")
@click.option(
    "--existing-output",
    default="existing_budget_lines.csv",
    show_default=True,
    help="Output CSV path for budget lines that still exist in OPS.",
)
@click.option(
    "--missing-output",
    default="missing_budget_lines.csv",
    show_default=True,
    help="Output CSV path for budget lines with no matching BudgetLineItem in OPS.",
)
@click.option(
    "--exclude-legacy-columns",
    is_flag=True,
    default=False,
    help=(
        "Drop columns only present in the original MAPS export format from both output files "
        f"(instead of writing them out blank): {', '.join(LEGACY_ONLY_COLUMNS)}."
    ),
)
def main(env: str, input_file: str, existing_output: str, missing_output: str, exclude_legacy_columns: bool):
    """Compare a legacy MAPS budget-line export against OPS and split it into existing/missing CSVs."""
    logger.info(f"Environment: {env}")
    logger.info(f"Input file: {input_file}")

    script_config = get_config(env)
    db_engine, _ = init_db_from_config(script_config)

    if db_engine is None:
        logger.error("Failed to initialize the database engine.")
        sys.exit(1)

    session_factory = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=db_engine))

    with session_factory() as session:
        run(input_file, existing_output, missing_output, session, script_config, exclude_legacy_columns)

    logger.info("Comparison complete.")


if __name__ == "__main__":
    main()
