import pytest
from flask import request, url_for
from flask_jwt_extended import verify_jwt_in_request

from ops_api.ops.auth.decorators import check_user_session
from ops_api.ops.auth.exceptions import InvalidUserSessionError


@pytest.mark.usefixtures("app_ctx")
def test_check_user_session_decorator_with_active_session(mocker):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = True
    mock_user_session.ip_address = request.remote_addr  # make sure the ips match
    mock_get_latest_user_session.return_value = mock_user_session

    @check_user_session
    def dummy_function(*args, **kwargs):
        return "success"

    # Act
    verify_jwt_in_request(optional=True)  # This is needed to set the current_user
    mock_current_user = mocker.patch("ops_api.ops.auth.decorators.current_user")
    mock_current_user.id = 4
    result = dummy_function()

    # Assert
    assert result == "success"


@pytest.mark.usefixtures("app_ctx")
def test_check_user_session_decorator_without_active_session(mocker):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = False
    mock_get_latest_user_session.return_value = mock_user_session

    @check_user_session
    def dummy_function(*args, **kwargs):
        return "success"

    # Act
    verify_jwt_in_request(optional=True)  # This is needed to set the current_user
    mock_current_user = mocker.patch("ops_api.ops.auth.decorators.current_user")
    mock_current_user.id = 4

    # Assert
    with pytest.raises(InvalidUserSessionError):
        dummy_function()


def test_any_endpoint_active_session(auth_client, loaded_db, mocker):
    response = auth_client.get(url_for("api.agreements-group"))
    assert response.status_code == 200


@pytest.mark.usefixtures("app_ctx")
def test_check_user_session_token_doesnt_match(mocker, loaded_db):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = True
    mock_user_session.access_token = "1234"  # UserSession access_token is different from the access token
    mock_get_latest_user_session.return_value = mock_user_session

    mocker.patch("ops_api.ops.auth.decorators.get_bearer_token", return_value="Bearer 5678")  # Request access token

    @check_user_session
    def dummy_function(*args, **kwargs):
        return "success"

    # Act
    verify_jwt_in_request(optional=True)  # This is needed to set the current_user
    mock_current_user = mocker.patch("ops_api.ops.auth.decorators.current_user")
    mock_current_user.id = 4

    # Assert
    with pytest.raises(InvalidUserSessionError):
        dummy_function()


@pytest.mark.usefixtures("app_ctx")
def test_ip_address_doesnt_match(mocker, loaded_db):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = True
    mock_user_session.ip_address = "192.168.0.1"  # UserSession ip_address is different from the request
    mock_get_latest_user_session.return_value = mock_user_session

    mocker.patch("flask.request.remote_addr", return_value="127.0.0.1")  # Request ip_address

    @check_user_session
    def dummy_function(*args, **kwargs):
        return "success"

    # Act
    verify_jwt_in_request(optional=True)  # This is needed to set the current_user
    mock_current_user = mocker.patch("ops_api.ops.auth.decorators.current_user")
    mock_current_user.id = 4

    # Assert
    with pytest.raises(InvalidUserSessionError):
        dummy_function()
