import pytest

from data_tools.environment.azure import AzureConfig


@pytest.mark.parametrize(
    "job_name, expected_label, expected_url",
    [
        ("opre-ops-stg-app-disable-users", "Staging", "https://stg.ops.opre.acf.gov/"),
        ("opre-ops-prod-app-disable-users", "Production", "https://ops.opre.acf.gov/"),
        ("opre-ops-dev-app-disable-users", None, None),
        (None, None, None),
    ],
)
def test_environment_label_and_frontend_url_from_job_name(monkeypatch, job_name, expected_label, expected_url):
    if job_name is None:
        monkeypatch.delenv("CONTAINER_APP_JOB_NAME", raising=False)
    else:
        monkeypatch.setenv("CONTAINER_APP_JOB_NAME", job_name)

    config = AzureConfig()

    assert config.environment_label == expected_label
    assert config.frontend_url == expected_url
