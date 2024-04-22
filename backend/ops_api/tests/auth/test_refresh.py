from datetime import timedelta

import pytest
from flask import url_for


@pytest.mark.skip(
    reason="""
This test should only be run manually as it is dependent on timing and the JWT token expiration.
"""
)
def test_refresh_token(app, client, loaded_db, mocker):
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=1)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(minutes=10)
    login_response = client.post("/auth/login/", json={"provider": "fakeauth", "code": "admin_user"})
    assert login_response.status_code == 200
    access_token = login_response.json["access_token"]
    refresh_token = login_response.json["refresh_token"]

    response = client.get(url_for("api.agreements-group"), headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json is not None

    # wait 1 minute for the access token to expire
    import time

    time.sleep(61)
    response = client.get(url_for("api.agreements-group"), headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 401

    response = client.post("/auth/refresh/", headers={"Authorization": f"Bearer {refresh_token}"})
    assert response.status_code == 200
    assert response.json is not None
    assert "access_token" in response.json
    access_token = response.json["access_token"]

    response = client.get(url_for("api.agreements-group"), headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert response.json is not None
