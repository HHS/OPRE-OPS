import io
from unittest.mock import MagicMock
from urllib.parse import urlparse

from data_tools.environment.azure import AzureConfig
from data_tools.src.azure_utils.utils import get_csv, get_csv_using_mi_or_rbac


def test_get_csv(mocker):
    # Test with a remote file using storage key credentials
    csv_string = "id,name\n1,DIV1\n2,DIV2\n3,DIV3\n"
    mocker.patch("data_tools.src.azure_utils.utils.get_blob_string", return_value=csv_string)
    mocker.patch("data_tools.src.azure_utils.utils.get_secret", return_value="")
    config = MagicMock(spec=AzureConfig)
    config.vault_url = "https://xxxxx.xxxx.xxxx.net/"
    config.vault_file_storage_key = "xxxxx"
    config.file_storage_auth_method = "access_key"

    result = get_csv(
        "https://xxxxxxx.xxxx.xxxx.xxxxx.net/xxxxxxxxxxx/cans.csv",
        config,
        dialect="excel",
    )
    assert result is not None
    data = list(result)
    assert len(data) == 3
    assert data[0]["id"] == "1"
    assert data[0]["name"] == "DIV1"
    assert data[1]["id"] == "2"
    assert data[1]["name"] == "DIV2"
    assert data[2]["id"] == "3"
    assert data[2]["name"] == "DIV3"

    # Test with a local file
    result = get_csv("test_csv/can_invalid.tsv")
    assert result is not None
    data = list(result)
    assert len(data) == 17
    assert data[0]["SYS_CAN_ID"] == "500"
    assert data[0]["CAN_NBR"] == "G99HRF2"
    assert data[0]["CAN_DESCRIPTION"] == "Healthy Marriages Responsible Fatherhood - OPRE"


def test_get_csv_using_mi(mocker):
    # Test with a remote file using managed identity credentials
    csv_string = "id,name\n1,DIV1\n2,DIV2\n3,DIV3\n"

    bytes_data = io.BytesIO(csv_string.encode("utf-8")).read()

    mocker.patch("data_tools.src.azure_utils.utils.get_blob", return_value=bytes_data)

    parts = urlparse("https://xxxxx.xxxx.xxxx.net/container_name/blob_name")

    result = get_csv_using_mi_or_rbac(parts, dialect="unix", client_id="xxxxx")

    assert result is not None
    data = list(result)
    assert len(data) == 3
    assert data[0]["id"] == "1"
    assert data[0]["name"] == "DIV1"
    assert data[1]["id"] == "2"
    assert data[1]["name"] == "DIV2"
    assert data[2]["id"] == "3"
    assert data[2]["name"] == "DIV3"


def test_get_csv_strips_leading_utf8_bom_from_local_file(tmp_path):
    """A Windows/Excel-saved export commonly starts with a UTF-8 BOM, which would otherwise
    corrupt the first header's name (e.g. "﻿id" instead of "id")."""
    path = tmp_path / "bom.csv"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        f.write("id,name\n1,DIV1\n")

    result = get_csv(str(path), dialect="excel")

    assert result.fieldnames == ["id", "name"]
    assert list(result) == [{"id": "1", "name": "DIV1"}]


def test_get_csv_preserves_embedded_crlf_in_quoted_field(tmp_path):
    """csv's own docs recommend newline="" when reading; without it, an embedded CRLF inside a
    quoted field gets rewritten to a bare LF on read (cosmetic, but avoidable)."""
    path = tmp_path / "embedded_crlf.csv"
    with open(path, "wb") as f:
        f.write(b'id,notes\r\n1,"line1\r\nline2"\r\n2,next\r\n')

    result = get_csv(str(path), dialect="excel")
    rows = list(result)

    assert rows == [{"id": "1", "notes": "line1\r\nline2"}, {"id": "2", "notes": "next"}]


def test_get_csv_closes_local_file_handle(tmp_path, monkeypatch):
    """The DictReader get_csv() returns for a local path used to wrap a file object that was
    never closed, and held no reference back to it that a caller could close either. It must
    now read the file eagerly and close it immediately, before returning."""
    import data_tools.src.azure_utils.utils as module

    path = tmp_path / "sample.csv"
    path.write_text("id,name\n1,DIV1\n")

    real_open = open
    opened_files = []

    def spy_open(*args, **kwargs):
        f = real_open(*args, **kwargs)
        opened_files.append(f)
        return f

    monkeypatch.setattr(module, "open", spy_open, raising=False)

    result = get_csv(str(path), dialect="excel")

    assert len(opened_files) == 1
    assert opened_files[0].closed is True
    # The reader must still be fully usable after the file is closed.
    assert list(result) == [{"id": "1", "name": "DIV1"}]


def test_get_csv_local_file_still_uses_requested_dialect(tmp_path):
    """Guard against the eager-read refactor accidentally dropping the dialect argument."""
    path = tmp_path / "sample.tsv"
    path.write_text("id\tname\n1\tDIV1\n")

    result = get_csv(str(path), dialect="excel-tab")

    assert result.fieldnames == ["id", "name"]
    assert list(result) == [{"id": "1", "name": "DIV1"}]
