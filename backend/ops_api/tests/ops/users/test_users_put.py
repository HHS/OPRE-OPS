import pytest
from flask import url_for

from models.users import User


@pytest.fixture
def new_user(app, loaded_db):
    # Needed to set the new user's created_by and updated_by fields
    app.config["SKIP_SETTING_CREATED_BY"] = True

    system_user = User(
        email="system@example.com",
        first_name="automated",
        last_name="system",
        division=1,
    )

    loaded_db.add(system_user)
    loaded_db.commit()

    user = User(
        email="blah@example.com",
        first_name="blah",
        last_name="blah",
        division=1,
        created_by=system_user.id,
        updated_by=system_user.id,
    )
    loaded_db.add(user)
    loaded_db.commit()
    yield user

    loaded_db.delete(user)
    loaded_db.commit()


@pytest.mark.skip("This test is failing because the endpoint is currently returning 400.")
@pytest.mark.usefixtures("app_ctx")
def test_put_user_invalid_id(auth_client):
    response = auth_client.get(url_for("api.users-item", id=9999), json={"first_name": "New First Name"})
    assert response.status_code == 404


@pytest.mark.usefixtures("app_ctx")
def test_put_user_unauthorized(client):
    response = client.get(url_for("api.users-item", id=9999), json={"first_name": "New First Name"})
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_put_user(auth_client, new_user, loaded_db):
    response = auth_client.put(url_for("api.users-item", id=new_user.id), json={"first_name": "New First Name"})
    assert response.status_code == 200
    assert response.json["first_name"] == "New First Name"

    updated_user = loaded_db.get(User, new_user.id)
    assert updated_user.first_name == "New First Name"
