import io
from unittest.mock import MagicMock
from urllib.parse import parse_qs, urlparse

import pytest

from data_tools.environment.azure import AzureConfig
from data_tools.src.azure_utils.utils import build_blob_sas_url, get_csv, get_csv_using_mi_or_rbac, get_secret


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


def test_build_blob_sas_url_shape(mocker):
    generate = mocker.patch(
        "data_tools.src.azure_utils.utils.generate_blob_sas",
        return_value="sig=abc&se=2026-11-17T00%3A00%3A00Z",
    )

    url = build_blob_sas_url(
        "https://opreopsprodappsa.blob.core.windows.net",
        "data",
        "reports/usage-metrics-2026-08-19.xlsx",
        "the-account-key",
        90,
    )

    # The account name is derived from the host, and the blob path + SAS query are appended.
    kwargs = generate.call_args.kwargs
    assert kwargs["account_name"] == "opreopsprodappsa"
    assert kwargs["container_name"] == "data"
    assert kwargs["blob_name"] == "reports/usage-metrics-2026-08-19.xlsx"
    assert kwargs["account_key"] == "the-account-key"
    assert kwargs["permission"].read is True

    parsed = urlparse(url)
    assert parsed.scheme == "https"
    assert parsed.path == "/data/reports/usage-metrics-2026-08-19.xlsx"
    assert "sig" in parse_qs(parsed.query)


@pytest.mark.parametrize("bad_expiry", [0, -1])
def test_build_blob_sas_url_rejects_non_positive_expiry(bad_expiry):
    with pytest.raises(ValueError):
        build_blob_sas_url("https://acct.blob.core.windows.net", "data", "reports/x.xlsx", "key", bad_expiry)


def test_get_secret_pins_user_assigned_mi_client_id(mocker):
    # A user-assigned MI must be selected explicitly; a bare DefaultAzureCredential cannot resolve
    # it when no system-assigned identity exists (regression: get_secret used a bare credential).
    credential = mocker.patch("data_tools.src.azure_utils.utils.DefaultAzureCredential")
    secret_client = mocker.patch("data_tools.src.azure_utils.utils.SecretClient")
    secret_client.return_value.get_secret.return_value.value = "the-key"

    result = get_secret("https://vault.example.com", "file-storage-access-key", client_id="mi-client-id")

    assert result == "the-key"
    credential.assert_called_once_with(managed_identity_client_id="mi-client-id")


def test_get_secret_falls_back_to_bare_credential_without_client_id(mocker):
    credential = mocker.patch("data_tools.src.azure_utils.utils.DefaultAzureCredential")
    secret_client = mocker.patch("data_tools.src.azure_utils.utils.SecretClient")
    secret_client.return_value.get_secret.return_value.value = "the-key"

    get_secret("https://vault.example.com", "file-storage-access-key", client_id=None)

    credential.assert_called_once_with()


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
