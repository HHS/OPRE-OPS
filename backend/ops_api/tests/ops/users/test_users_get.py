import pytest
from flask import url_for
from flask_jwt_extended import create_access_token

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


# Authorization tests


@pytest.mark.usefixtures("app_ctx")
def test_get_users_by_id_without_auth(client, test_user):
    response = client.get(url_for("api.users-item", id=test_user.id))
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_get_all_users_without_auth(client):
    response = client.get(url_for("api.users-group"))
    assert response.status_code == 401


# Standard GET related tests


@pytest.mark.usefixtures("app_ctx")
def test_get_user_by_id_same_user(auth_client, loaded_db, test_admin_user):
    """
    Test that an admin user can get their own user details.
    """
    response = auth_client.get(url_for("api.users-item", id=test_admin_user.id))
    assert response.status_code == 200
    assert response.json["id"] == test_admin_user.id
    assert response.json["status"] == test_admin_user.status.name
    assert response.json["display_name"] == test_admin_user.display_name
    assert response.json["division"] == test_admin_user.division
    assert response.json["email"] == test_admin_user.email
    assert response.json["oidc_id"] == str(test_admin_user.oidc_id)
    assert response.json["first_name"] == test_admin_user.first_name
    assert response.json["last_name"] == test_admin_user.last_name
    assert response.json["roles"] == [role.name for role in test_admin_user.roles]


@pytest.mark.usefixtures("app_ctx")
def test_get_user_by_id_admin_gets_all_user_details(auth_client, loaded_db, test_user):
    """
    Test that an admin user can get all user details for another user.
    """
    response = auth_client.get(url_for("api.users-item", id=test_user.id))
    assert response.status_code == 200
    assert response.json["id"] == test_user.id
    assert response.json["status"] == test_user.status.name
    assert response.json["display_name"] == test_user.display_name
    assert response.json["division"] == test_user.division
    assert response.json["email"] == test_user.email
    assert response.json["oidc_id"] == str(test_user.oidc_id)
    assert response.json["first_name"] == test_user.first_name
    assert response.json["last_name"] == test_user.last_name
    assert response.json["roles"] == [role.name for role in test_user.roles]


@pytest.mark.usefixtures("app_ctx")
def test_get_user_with_admin_user(auth_client, loaded_db, new_user):
    """
    Test that an admin user can get all user details for another user.
    """
    response = auth_client.get(url_for("api.users-item", id=new_user.id))
    assert response.status_code == 200
    assert response.json["id"] == new_user.id
    assert response.json["status"] == new_user.status.name
    assert response.json["display_name"] == new_user.display_name
    assert response.json["division"] == new_user.division
    assert response.json["email"] == new_user.email
    assert response.json["oidc_id"] is None
    assert response.json["first_name"] == new_user.first_name
    assert response.json["last_name"] == new_user.last_name
    assert response.json["roles"] == [{"id": role.id, "name": role.name} for role in new_user.roles]


@pytest.mark.usefixtures("app_ctx")
def test_get_safe_user_with_regular_user(client, loaded_db, test_non_admin_user, new_user):
    """
    Test that a regular user can get a safe version of another user.
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.get(
        url_for("api.users-item", id=new_user.id), headers={"Authorization": f"Bearer {str(access_token)}"}
    )
    assert response.status_code == 200
    user = response.json
    assert user["id"] == new_user.id
    assert user["full_name"] == new_user.full_name
    assert "created_by" not in user
    assert "updated_by" not in user
    assert "oidc_id" not in user


@pytest.mark.usefixtures("app_ctx")
def test_own_user_details(client, loaded_db, test_non_admin_user):
    """
    Test that a regular user can get their own (full) user details.
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.get(
        url_for("api.users-item", id=test_non_admin_user.id), headers={"Authorization": f"Bearer {str(access_token)}"}
    )
    assert response.status_code == 200
    user = response.json
    assert user["id"] == test_non_admin_user.id
    assert user["full_name"] == test_non_admin_user.full_name
    assert user["display_name"] == test_non_admin_user.display_name
    assert user["division"] == test_non_admin_user.division
    assert user["email"] == test_non_admin_user.email
    assert user["oidc_id"] == str(test_non_admin_user.oidc_id)
    assert user["first_name"] == test_non_admin_user.first_name
    assert user["last_name"] == test_non_admin_user.last_name
    assert user["roles"] == [role.name for role in test_non_admin_user.roles]
    assert user["status"] == test_non_admin_user.status.name


@pytest.mark.usefixtures("app_ctx")
def test_get_all_users(auth_client, loaded_db):
    expected_user = loaded_db.get(User, 500)

    response = auth_client.get(url_for("api.users-group"))
    assert response.status_code == 200
    assert len(response.json) > 1
    assert response.json[0]["id"] == expected_user.id
    assert response.json[0]["status"] == expected_user.status.name
    assert response.json[0]["display_name"] == expected_user.display_name
    assert response.json[0]["division"] == expected_user.division
    assert response.json[0]["email"] == expected_user.email
    assert response.json[0]["oidc_id"] == str(expected_user.oidc_id)
    assert response.json[0]["first_name"] == expected_user.first_name
    assert response.json[0]["last_name"] == expected_user.last_name
    assert response.json[0]["roles"] == [role.name for role in expected_user.roles]
