from data_tools.src.azure_utils.utils import get_csv

from azure_utils.utils import AzureVaultPath


def test_get_csv(mocker):
    # Test with a remote file using storage key credentials
    csv_string = "id,name\n1,DIV1\n2,DIV2\n3,DIV3\n"
    mocker.patch("data_tools.src.azure_utils.utils.get_blob_string", return_value=csv_string)
    mocker.patch("data_tools.src.azure_utils.utils.get_secret", return_value="")
    result = get_csv(
        "https://xxxxxxx.xxxx.xxxx.xxxxx.net/xxxxxxxxxxx/cans.csv",
        dialect="excel",
        vault_path=AzureVaultPath(
            url="https://xxxxx.xxxx.xxxx.net/",
            secret_name="xxxxx",
        ),
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
    result = get_csv("test_csv/can.tsv")
    assert result is not None
    data = list(result)
    assert len(data) == 17
    assert data[0]["SYS_CAN_ID"] == "500"
    assert data[0]["CAN_NBR"] == "G99HRF2"
    assert data[0]["CAN_DESCRIPTION"] == "Healthy Marriages Responsible Fatherhood - OPRE"
