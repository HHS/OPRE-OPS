import csv
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.inspection import inspect as sa_inspect

from data_tools.src.compare_prod_to_maps_budget_lines import (
    EXPECTED_HEADERS,
    OBE_COLUMN,
    _read_input_file,
    chunked,
    classify_budget_lines,
    create_compare_budget_line_data,
    get_deleted_bli_ids,
    get_existing_bli_obe_map,
    run,
    write_rows_csv,
)
from models import (
    CAN,
    AgreementType,
    BudgetLineItem,
    BudgetLineItemStatus,
    ContractAgreement,
    ContractBudgetLineItem,
    Division,
    GrantAgreement,
    GrantBudgetLineItem,
    Portfolio,
)

SAMPLE_TSV_PATH = "test_csv/compare_prod_to_maps_budget_lines_sample.tsv"


def _read_sample_rows() -> list[dict]:
    with open(SAMPLE_TSV_PATH) as f:
        return list(csv.DictReader(f, dialect="excel-tab"))


# ---------------------------------------------------------------------------
# Unit tests (no DB)
# ---------------------------------------------------------------------------


def test_sample_fixture_has_expected_headers_and_row_count():
    with open(SAMPLE_TSV_PATH) as f:
        reader = csv.DictReader(f, dialect="excel-tab")
        rows = list(reader)
        assert reader.fieldnames == EXPECTED_HEADERS
        assert len(rows) == 8


def test_create_compare_budget_line_data_maps_every_header():
    row = {
        "Effective Date": "1/1/2024",
        "Requested by": "A. Person",
        "How Requested": "Email",
        "Change Reason(s)": "Some reason",
        "Who Updated": "B. Person",
        "Fiscal Year": "2024",
        "CAN": "G99AB14",
        "Sys_Budget_ID": "15000",
        "Project Title": "A Project",
        "CIG Name": "A CIG",
        "CIG Type": "Contract",
        "Line Desc": "A line",
        "Date Needed": "1/1/2025",
        "Amount": "100.00",
        "PROC Fee Amount": "5.00",
        "Status": "Planned",
        "Comments": "A comment",
        "New (N) vs. Continuing (C)": "N",
        "Applied Research (AR) vs. Evaluative (EV)": "AR",
    }
    data = create_compare_budget_line_data(row)
    assert data.SYS_BUDGET_ID == 15000
    assert data.EFFECTIVE_DATE == "1/1/2024"
    assert data.REQUESTED_BY == "A. Person"
    assert data.HOW_REQUESTED == "Email"
    assert data.CHANGE_REASONS == "Some reason"
    assert data.WHO_UPDATED == "B. Person"
    assert data.FISCAL_YEAR == "2024"
    assert data.CAN == "G99AB14"
    assert data.PROJECT_TITLE == "A Project"
    assert data.CIG_NAME == "A CIG"
    assert data.CIG_TYPE == "Contract"
    assert data.LINE_DESC == "A line"
    assert data.DATE_NEEDED == "1/1/2025"
    assert data.AMOUNT == "100.00"
    assert data.PROC_FEE_AMOUNT == "5.00"
    assert data.STATUS == "Planned"
    assert data.COMMENTS == "A comment"
    assert data.NEW_VS_CONTINUING == "N"
    assert data.APPLIED_RESEARCH_VS_EVALUATIVE == "AR"


def test_create_compare_budget_line_data_raises_on_blank_id():
    with pytest.raises(ValueError):
        create_compare_budget_line_data({"Sys_Budget_ID": ""})


def test_create_compare_budget_line_data_raises_on_non_numeric_id():
    with pytest.raises(ValueError):
        create_compare_budget_line_data({"Sys_Budget_ID": "ABC"})


def test_create_compare_budget_line_data_accepts_excel_style_float_id():
    """A genuinely valid id exported by Excel as e.g. '15000.0' must parse successfully, not
    get caught as "non-numeric" and misrouted to missing-lines without ever being checked
    against the database."""
    data = create_compare_budget_line_data({"Sys_Budget_ID": "15000.0"})
    assert data.SYS_BUDGET_ID == 15000


def test_create_compare_budget_line_data_accepts_excel_style_thousands_separator():
    """Excel can also render an id with a thousands separator (e.g. '1,234'); float() alone
    rejects that just as int() does, so it must be stripped before parsing."""
    data = create_compare_budget_line_data({"Sys_Budget_ID": "1,234"})
    assert data.SYS_BUDGET_ID == 1234


def test_chunked_splits_into_correctly_sized_batches():
    assert list(chunked(range(7), size=3)) == [[0, 1, 2], [3, 4, 5], [6]]
    assert list(chunked([], size=3)) == []
    assert list(chunked([1, 2], size=10)) == [[1, 2]]


def test_write_rows_csv_round_trips_embedded_comma_and_quote(tmp_path):
    path = tmp_path / "out.csv"
    rows = [{"A": "1", "B": 'has, a comma and "quotes"'}, {"A": "2", "B": "plain"}]
    write_rows_csv(str(path), rows, headers=["A", "B"])

    with open(path, newline="") as f:
        read_back = list(csv.DictReader(f))

    assert read_back == rows


def test_write_rows_csv_opens_output_file_with_newline_empty_string(tmp_path, monkeypatch):
    """Round-tripping alone can't prove newline="" is passed: on POSIX, Python's text-mode
    newline translation is a no-op, so a round-trip test would pass identically whether or
    not newline="" is present -- the bug it guards against (doubled CRLF / mangled embedded
    newlines) only manifests on Windows. Assert the open() call itself instead."""
    import data_tools.src.compare_prod_to_maps_budget_lines as module

    real_open = open
    captured = {}

    def fake_open(path, mode="r", *args, **kwargs):
        captured["newline"] = kwargs.get("newline")
        return real_open(path, mode, *args, **kwargs)

    monkeypatch.setattr(module, "open", fake_open, raising=False)

    write_rows_csv(str(tmp_path / "out.csv"), [{"A": "1"}], headers=["A"])

    assert captured["newline"] == ""


# ---------------------------------------------------------------------------
# Integration tests (real Postgres via loaded_db)
# ---------------------------------------------------------------------------


@pytest.fixture()
def db_with_bli_data(loaded_db):
    division = Division(id=1, name="Test Division", abbreviation="TD")
    loaded_db.add(division)
    loaded_db.commit()

    portfolio = Portfolio(id=1, name="Test Portfolio", division_id=1)
    loaded_db.add(portfolio)
    loaded_db.commit()

    can = CAN(id=1, number="G99AB14", portfolio_id=1)
    loaded_db.add(can)
    loaded_db.commit()

    contract_agreement = ContractAgreement(name="Contract Agreement", agreement_type=AgreementType.CONTRACT)
    grant_agreement = GrantAgreement(name="Grant Agreement", agreement_type=AgreementType.GRANT)
    loaded_db.add_all([contract_agreement, grant_agreement])
    loaded_db.commit()

    # 15000: never updated after creation -> terminal version row is INSERT.
    bli_15000 = ContractBudgetLineItem(
        id=15000,
        agreement_id=contract_agreement.id,
        can_id=1,
        budget_line_item_type=AgreementType.CONTRACT,
        line_description="Software Licensing",
        amount=Decimal("15203.08"),
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date(2025, 3, 11),
        is_obe=False,
    )
    loaded_db.add(bli_15000)
    loaded_db.commit()

    # 15001: updated once after creation -> terminal version row is UPDATE.
    bli_15001 = GrantBudgetLineItem(
        id=15001,
        agreement_id=grant_agreement.id,
        can_id=1,
        budget_line_item_type=AgreementType.GRANT,
        line_description="Consulting Services",
        amount=Decimal("73364.08"),
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date(2025, 2, 17),
        is_obe=True,
    )
    loaded_db.add(bli_15001)
    loaded_db.commit()
    bli_15001.comments = "Updated after creation"
    loaded_db.commit()

    # 15002: is_obe explicitly nulled out via an UPDATE after creation, simulating a
    # pre-migration row that was never backfilled. Passing is_obe=None to the constructor
    # does NOT work for this -- SQLAlchemy's client-side default=False on the column
    # substitutes False for any None value at INSERT time. Only a later UPDATE (assigning
    # None on an already-persisted row) actually persists NULL. Confirmed empirically.
    bli_15002 = ContractBudgetLineItem(
        id=15002,
        agreement_id=contract_agreement.id,
        can_id=1,
        budget_line_item_type=AgreementType.CONTRACT,
        line_description="Consulting Services",
        amount=Decimal("10216.43"),
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date(2025, 1, 28),
        is_obe=False,
    )
    loaded_db.add(bli_15002)
    loaded_db.commit()
    bli_15002.is_obe = None
    loaded_db.commit()

    # 15006: created as a ContractBudgetLineItem, then converted to a GrantBudgetLineItem
    # under the same id, mirroring convert_budget_line_item_type's production sequence:
    # copy the base-table column values, delete the old subtype row (which also deletes the
    # shared base row, per joined-table inheritance), then insert a new subtype row with the
    # same id.
    bli_15006 = ContractBudgetLineItem(
        id=15006,
        agreement_id=contract_agreement.id,
        can_id=1,
        budget_line_item_type=AgreementType.CONTRACT,
        line_description="Personnel",
        amount=Decimal("35558.43"),
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date(2025, 4, 11),
        is_obe=False,
    )
    loaded_db.add(bli_15006)
    loaded_db.commit()

    attrs = {c.key: getattr(bli_15006, c.key) for c in sa_inspect(BudgetLineItem).mapper.column_attrs}
    attrs["budget_line_item_type"] = AgreementType.GRANT
    attrs["agreement_id"] = grant_agreement.id

    old_typed = loaded_db.get(ContractBudgetLineItem, 15006)
    loaded_db.delete(old_typed)
    loaded_db.commit()

    converted_bli_15006 = GrantBudgetLineItem(**attrs)
    loaded_db.add(converted_bli_15006)
    loaded_db.commit()

    # 88888: created then deleted -> a genuine continuum-tracked deletion.
    bli_88888 = ContractBudgetLineItem(
        id=88888,
        agreement_id=contract_agreement.id,
        can_id=1,
        budget_line_item_type=AgreementType.CONTRACT,
        line_description="Personnel",
        amount=Decimal("35558.43"),
        status=BudgetLineItemStatus.PLANNED,
        date_needed=date(2025, 4, 16),
        is_obe=False,
    )
    loaded_db.add(bli_88888)
    loaded_db.commit()
    loaded_db.delete(bli_88888)
    loaded_db.commit()

    yield loaded_db


def test_get_existing_bli_obe_map_distinguishes_false_true_and_none(db_with_bli_data):
    result = get_existing_bli_obe_map(db_with_bli_data, {15000, 15001, 15002, 99999})
    assert result == {15000: False, 15001: True, 15002: None}


def test_get_existing_bli_obe_map_chunking_aggregates_across_batches(db_with_bli_data, monkeypatch):
    import data_tools.src.compare_prod_to_maps_budget_lines as module

    monkeypatch.setattr(module, "CHUNK_SIZE", 1)
    result = get_existing_bli_obe_map(db_with_bli_data, {15000, 15001, 15002})
    assert result == {15000: False, 15001: True, 15002: None}


def test_get_deleted_bli_ids_excludes_live_updated_and_converted_rows(db_with_bli_data):
    result = get_deleted_bli_ids(db_with_bli_data, {15000, 15001, 15006, 88888, 99999})
    assert result == {88888}


def test_get_deleted_bli_ids_chunking_aggregates_across_batches(db_with_bli_data, monkeypatch):
    import data_tools.src.compare_prod_to_maps_budget_lines as module

    monkeypatch.setattr(module, "CHUNK_SIZE", 1)
    result = get_deleted_bli_ids(db_with_bli_data, {15000, 15006, 88888, 99999})
    assert result == {88888}


def test_classify_budget_lines_full_scenario(db_with_bli_data):
    rows = _read_sample_rows()
    existing_rows, missing_rows = classify_budget_lines(db_with_bli_data, rows)

    existing_by_id = {row["Sys_Budget_ID"]: row for row in existing_rows}
    assert set(existing_by_id.keys()) == {"15000", "15001", "15002", "15006"}
    assert existing_by_id["15000"][OBE_COLUMN] == "False"
    assert existing_by_id["15001"][OBE_COLUMN] == "True"
    assert existing_by_id["15002"][OBE_COLUMN] == ""
    assert existing_by_id["15006"][OBE_COLUMN] == "False"
    # Original TSV fields must survive untouched alongside the added OBE column.
    assert existing_by_id["15001"]["Comments"] == "Updated, see notes"

    missing_ids = {row["Sys_Budget_ID"] for row in missing_rows}
    assert missing_ids == {"", "ABC", "99999"}

    dropped_ids = {row["Sys_Budget_ID"] for row in rows} - set(existing_by_id.keys()) - missing_ids
    assert dropped_ids == {"88888"}


def test_run_end_to_end_writes_expected_csvs(db_with_bli_data, tmp_path):
    existing_path = tmp_path / "existing.csv"
    missing_path = tmp_path / "missing.csv"

    class _FakeConfig:
        pass

    run(SAMPLE_TSV_PATH, str(existing_path), str(missing_path), db_with_bli_data, _FakeConfig())

    with open(existing_path, newline="") as f:
        existing_reader = csv.DictReader(f)
        assert existing_reader.fieldnames == EXPECTED_HEADERS + [OBE_COLUMN]
        existing_rows = list(existing_reader)

    with open(missing_path, newline="") as f:
        missing_reader = csv.DictReader(f)
        assert missing_reader.fieldnames == EXPECTED_HEADERS
        missing_rows = list(missing_reader)

    assert {r["Sys_Budget_ID"] for r in existing_rows} == {"15000", "15001", "15002", "15006"}
    assert {r["Sys_Budget_ID"] for r in missing_rows} == {"", "ABC", "99999"}

    by_id = {r["Sys_Budget_ID"]: r for r in existing_rows}
    assert by_id["15001"]["Comments"] == "Updated, see notes"
    assert by_id["15002"][OBE_COLUMN] == ""


def test_run_raises_on_header_mismatch(db_with_bli_data, tmp_path):
    bad_input = tmp_path / "bad.tsv"
    bad_input.write_text("Sys_Budget_ID\tComments\n15000\tsomething\n")

    with pytest.raises(ValueError):
        run(str(bad_input), str(tmp_path / "e.csv"), str(tmp_path / "m.csv"), db_with_bli_data, object())


def test_run_handles_utf8_bom_header_transparently(db_with_bli_data, tmp_path):
    """get_csv() strips a leading UTF-8 BOM (encoding="utf-8-sig"), so a BOM'd export -- a
    common Windows/Excel artifact -- must parse and classify correctly, not just fail with a
    clearer error."""
    bom_row = {**{h: "" for h in EXPECTED_HEADERS}, "Sys_Budget_ID": "15000"}
    bom_input = tmp_path / "bom.tsv"
    with open(bom_input, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=EXPECTED_HEADERS, dialect="excel-tab")
        writer.writeheader()
        writer.writerow(bom_row)

    existing_path = tmp_path / "existing.csv"
    missing_path = tmp_path / "missing.csv"
    run(str(bom_input), str(existing_path), str(missing_path), db_with_bli_data, object())

    with open(existing_path, newline="") as f:
        rows = list(csv.DictReader(f))
    assert [r["Sys_Budget_ID"] for r in rows] == ["15000"]
    assert rows[0][OBE_COLUMN] == "False"


def test_run_tolerates_whitespace_padded_header_without_dropping_column_data(db_with_bli_data, tmp_path):
    """A real-world MAPS export had ' Amount ' (leading/trailing space) instead of 'Amount' --
    everything else matched exactly. The header check must tolerate that, AND the row must
    still be re-keyed to the canonical column names, or row.get("Amount") downstream would
    silently return None and the Amount column would come out blank instead of raising or
    preserving the real value."""
    padded_headers = [" Amount " if h == "Amount" else h for h in EXPECTED_HEADERS]
    padded_input = tmp_path / "padded_header.tsv"
    with open(padded_input, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=padded_headers, dialect="excel-tab")
        writer.writeheader()
        writer.writerow({**{h: "" for h in padded_headers}, "Sys_Budget_ID": "15000", " Amount ": "15203.08"})

    existing_path = tmp_path / "existing.csv"
    missing_path = tmp_path / "missing.csv"
    run(str(padded_input), str(existing_path), str(missing_path), db_with_bli_data, object())

    with open(existing_path, newline="") as f:
        rows = list(csv.DictReader(f))
    assert [r["Sys_Budget_ID"] for r in rows] == ["15000"]
    assert rows[0]["Amount"] == "15203.08"


def test_run_gives_actionable_error_on_non_utf8_byte(db_with_bli_data, tmp_path):
    bad_bytes_input = tmp_path / "bad_encoding.tsv"
    header = "\t".join(EXPECTED_HEADERS).encode("utf-8")
    bad_bytes_input.write_bytes(header + b"\n15000\t\xff\n")

    with pytest.raises(ValueError, match="encoding"):
        run(str(bad_bytes_input), str(tmp_path / "e.csv"), str(tmp_path / "m.csv"), db_with_bli_data, object())


def test_run_handles_header_only_file_without_crashing(db_with_bli_data, tmp_path):
    header_only = tmp_path / "header_only.tsv"
    header_only.write_text("\t".join(EXPECTED_HEADERS) + "\n")
    existing_path = tmp_path / "existing.csv"
    missing_path = tmp_path / "missing.csv"

    run(str(header_only), str(existing_path), str(missing_path), db_with_bli_data, object())

    with open(existing_path, newline="") as f:
        assert csv.DictReader(f).fieldnames == EXPECTED_HEADERS + [OBE_COLUMN]
        assert list(csv.DictReader(open(existing_path))) == []

    with open(missing_path, newline="") as f:
        assert csv.DictReader(f).fieldnames == EXPECTED_HEADERS


def test_run_gives_actionable_error_on_truly_empty_file(db_with_bli_data, tmp_path):
    """A file with zero bytes (not even a header row) must not be conflated with the generic
    header-mismatch error -- reader.fieldnames is None in this case, distinct from a
    header-only file (which has real fieldnames and zero data rows, tested above)."""
    empty_input = tmp_path / "empty.tsv"
    empty_input.write_text("")

    with pytest.raises(ValueError, match="empty"):
        run(str(empty_input), str(tmp_path / "e.csv"), str(tmp_path / "m.csv"), db_with_bli_data, object())


def test_read_input_file_delegates_to_get_csv(monkeypatch):
    """_read_input_file is a thin wrapper: it delegates all path handling (local vs. Azure
    blob, BOM-stripping, file-handle closing) to the shared get_csv() helper -- it doesn't
    duplicate any of that logic itself."""
    import data_tools.src.compare_prod_to_maps_budget_lines as module

    calls = []

    class _FakeReader:
        fieldnames = EXPECTED_HEADERS

        def __iter__(self):
            return iter([])

    def fake_get_csv(path, config, dialect="excel-tab"):
        calls.append((path, config, dialect))
        return _FakeReader()

    monkeypatch.setattr(module, "get_csv", fake_get_csv)

    url = "https://example.blob.core.windows.net/container/export.tsv"
    fieldnames, rows = _read_input_file(url, "some-config")

    assert calls == [(url, "some-config", "excel-tab")]
    assert fieldnames == EXPECTED_HEADERS
    assert rows == []


def test_classify_budget_lines_preserves_both_rows_for_duplicate_sys_budget_id(db_with_bli_data):
    rows = [
        {**{h: "" for h in EXPECTED_HEADERS}, "Sys_Budget_ID": "15000", "Comments": "first version"},
        {**{h: "" for h in EXPECTED_HEADERS}, "Sys_Budget_ID": "15000", "Comments": "second version"},
    ]
    existing_rows, missing_rows = classify_budget_lines(db_with_bli_data, rows)

    assert len(existing_rows) == 2
    comments = {row["Comments"] for row in existing_rows}
    assert comments == {"first version", "second version"}
    assert all(row[OBE_COLUMN] == "False" for row in existing_rows)


def test_classify_budget_lines_matches_excel_style_float_id_against_live_bli(db_with_bli_data):
    """Regression guard: '15000.0' must match the live BudgetLineItem id=15000, not get
    misrouted to missing-lines as if it were non-numeric."""
    rows = [{**{h: "" for h in EXPECTED_HEADERS}, "Sys_Budget_ID": "15000.0"}]
    existing_rows, missing_rows = classify_budget_lines(db_with_bli_data, rows)

    assert len(existing_rows) == 1
    assert existing_rows[0]["Sys_Budget_ID"] == "15000.0"
    assert existing_rows[0][OBE_COLUMN] == "False"
    assert missing_rows == []
