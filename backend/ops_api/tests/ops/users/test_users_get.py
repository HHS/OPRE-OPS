import pytest
from flask import url_for
from flask_jwt_extended import create_access_token

from models.users import User


def get_expected_roles(user):
    return [{"id": role.id, "is_superuser": False, "name": role.name} for role in user.roles]


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


def test_get_users_by_id_without_auth(client, test_user, app_ctx):
    response = client.get(url_for("api.users-item", id=test_user.id))
    assert response.status_code == 401


def test_get_all_users_without_auth(client, app_ctx):
    response = client.get(url_for("api.users-group"))
    assert response.status_code == 401


# Standard GET related tests


def test_get_user_by_id_same_user(auth_client, loaded_db, test_admin_user, app_ctx):
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
    assert response.json["roles"] == get_expected_roles(test_admin_user)
    assert response.json["is_superuser"] is False


def test_get_user_by_id_admin_gets_all_user_details(auth_client, loaded_db, test_user, app_ctx):
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
    assert response.json["roles"] == get_expected_roles(test_user)
    assert response.json["is_superuser"] is False


def test_get_user_with_admin_user(auth_client, loaded_db, new_user, app_ctx):
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
    assert response.json["roles"] == get_expected_roles(new_user)
    assert response.json["is_superuser"] is False


def test_get_safe_user_with_regular_user(client, loaded_db, test_non_admin_user, new_user, app_ctx):
    """
    Test that a regular user can get a safe version of another user.
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.get(
        url_for("api.users-item", id=new_user.id),
        headers={"Authorization": f"Bearer {str(access_token)}"},
    )
    assert response.status_code == 200
    user = response.json
    assert user["id"] == new_user.id
    assert user["full_name"] == new_user.full_name
    assert "created_by" not in user
    assert "updated_by" not in user
    assert "oidc_id" not in user


def test_own_user_details(client, loaded_db, test_non_admin_user, app_ctx):
    """
    Test that a regular user can get their own (full) user details.
    """
    access_token = create_access_token(identity=test_non_admin_user)
    response = client.get(
        url_for("api.users-item", id=test_non_admin_user.id),
        headers={"Authorization": f"Bearer {str(access_token)}"},
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
    assert user["status"] == test_non_admin_user.status.name
    assert user["roles"] == get_expected_roles(test_non_admin_user)
    assert user["is_superuser"] is False


def test_get_all_users(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.users-group"))
    assert response.status_code == 200
    assert len(response.json) > 1
    expected_user = loaded_db.get(User, 68)
    assert response.json[0]["id"] == expected_user.id
    assert response.json[0]["status"] == expected_user.status.name
    assert response.json[0]["display_name"] == expected_user.display_name
    assert response.json[0]["division"] == expected_user.division
    assert response.json[0]["email"] == expected_user.email
    assert response.json[0]["first_name"] == expected_user.first_name
    assert response.json[0]["last_name"] == expected_user.last_name
    assert response.json[0]["roles"] == get_expected_roles(expected_user)
    assert response.json[0]["is_superuser"] is False


def test_get_all_users_by_id(auth_client, loaded_db, app_ctx):
    response = auth_client.get(url_for("api.users-group", id=500))
    assert response.status_code == 200
    assert len(response.json) == 1
    expected_user = loaded_db.get(User, 500)
    assert response.json[0]["id"] == expected_user.id


def test_get_all_users_by_oidc(auth_client, loaded_db, app_ctx):
    expected_user = loaded_db.get(User, 500)
    response = auth_client.get(url_for("api.users-group", oidc_id=expected_user.oidc_id))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["oidc_id"] == str(expected_user.oidc_id)


def test_get_all_users_by_hhs_id(auth_client, loaded_db, app_ctx):
    expected_user = loaded_db.get(User, 500)
    response = auth_client.get(url_for("api.users-group", hhs_id=expected_user.hhs_id))
    assert response.status_code == 200
    assert len(response.json) > 1
    assert response.json[0]["hhs_id"] == expected_user.hhs_id


def test_get_all_users_by_email(auth_client, loaded_db, app_ctx):
    expected_user = loaded_db.get(User, 500)
    response = auth_client.get(url_for("api.users-group", email=expected_user.email))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["email"] == expected_user.email


def test_get_all_users_by_status(auth_client, loaded_db, app_ctx):
    expected_user = loaded_db.get(User, 500)
    response = auth_client.get(url_for("api.users-group", status=expected_user.status.name))
    assert response.status_code == 200
    assert len(response.json) > 1
    assert response.json[0]["status"] == expected_user.status.name


def test_get_all_users_by_role(auth_client, loaded_db, app_ctx):
    expected_user = loaded_db.get(User, 68)
    response = auth_client.get(url_for("api.users-group", roles=[role.name for role in expected_user.roles]))
    assert response.status_code == 200
    assert len(response.json) > 1
    assert response.json[0]["roles"] == get_expected_roles(expected_user)


def test_get_all_users_by_division(auth_client, loaded_db, app_ctx):
    expected_user = loaded_db.get(User, 500)
    response = auth_client.get(url_for("api.users-group", division=expected_user.division))
    assert response.status_code == 200
    assert len(response.json) > 1
    assert response.json[0]["division"] == expected_user.division


def test_get_all_users_by_first_name(auth_client, loaded_db, app_ctx):
    expected_user = loaded_db.get(User, 500)
    response = auth_client.get(url_for("api.users-group", first_name=expected_user.first_name))
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["first_name"] == expected_user.first_name


def test_get_all_users_by_last_name(auth_client, loaded_db, app_ctx):
    expected_user = loaded_db.get(User, 500)
    response = auth_client.get(
        url_for(
            "api.users-group",
            last_name=expected_user.last_name,
        )
    )
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["last_name"] == expected_user.last_name


def test_get_all_users_safe_user(basic_user_auth_client, loaded_db, app_ctx):
    """Non-admin (basic user) gets safe schema; auth client ensures valid session."""
    response = basic_user_auth_client.get(url_for("api.users-group"))
    assert response.status_code == 200
    assert len(response.json) > 1
    expected_user = loaded_db.get(User, 68)
    assert response.json[0]["id"] == expected_user.id
    assert response.json[0]["full_name"] == expected_user.full_name
    assert "status" not in response.json[0]
    assert "division" not in response.json[0]
    assert "oidc_id" not in response.json[0]
    assert "first_name" not in response.json[0]
    assert "last_name" not in response.json[0]
    assert "roles" not in response.json[0]


def test_get_all_users_by_multiple_filters(auth_client, loaded_db, app_ctx):
    # Use a user that has non-null first_name, last_name, division (500 may have nulls)
    expected_user = loaded_db.get(User, 503)
    response = auth_client.get(
        url_for(
            "api.users-group",
            first_name=expected_user.first_name,
            last_name=expected_user.last_name,
            division=expected_user.division,
        )
    )
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["first_name"] == expected_user.first_name
    assert response.json[0]["last_name"] == expected_user.last_name
    assert response.json[0]["division"] == expected_user.division
