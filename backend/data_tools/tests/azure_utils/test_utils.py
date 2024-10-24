import io
from unittest.mock import MagicMock
from urllib.parse import urlparse

from data_tools.environment.azure import AzureConfig
from data_tools.src.azure_utils.utils import get_csv, get_csv_using_mi


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

    result = get_csv_using_mi(parts, dialect="unix", client_id="xxxxx")

    assert result is not None
    data = list(result)
    assert len(data) == 3
    assert data[0]["id"] == "1"
    assert data[0]["name"] == "DIV1"
    assert data[1]["id"] == "2"
    assert data[1]["name"] == "DIV2"
    assert data[2]["id"] == "3"
    assert data[2]["name"] == "DIV3"
