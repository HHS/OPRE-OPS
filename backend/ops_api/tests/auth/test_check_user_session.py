from datetime import datetime, timedelta

import pytest
from flask import request, url_for
from flask_jwt_extended import verify_jwt_in_request

from ops_api.ops.auth.decorators import check_user_session
from ops_api.ops.auth.exceptions import InvalidUserSessionError
from ops_api.ops.auth.utils import get_all_active_user_sessions


def test_check_user_session_decorator_with_active_session(mocker, app_ctx):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = True
    mock_user_session.ip_address = request.remote_addr  # make sure the ips match
    mock_get_latest_user_session.return_value = mock_user_session

    mock_check_last_active_at = mocker.patch("ops_api.ops.auth.decorators.check_last_active_at")
    mock_check_last_active_at.return_value = False

    mocker.patch("flask.current_app.db_session")

    @check_user_session
    def dummy_function(*args, **kwargs):
        return "success"

    # Act
    verify_jwt_in_request(optional=True)  # This is needed to set the current_user
    mock_current_user = mocker.patch("ops_api.ops.auth.decorators.current_user")
    mock_current_user.id = 503
    result = dummy_function()

    # Assert
    assert result == "success"


def test_check_user_session_decorator_without_active_session(loaded_db, mocker, app_ctx):
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
    mock_current_user.id = 503

    # Assert
    with pytest.raises(InvalidUserSessionError):
        dummy_function()

    user_sessions = get_all_active_user_sessions(503, loaded_db)
    assert all([not user_session.is_active for user_session in user_sessions])


def test_any_endpoint_active_session(auth_client, loaded_db, mocker):
    response = auth_client.get(url_for("api.agreements-group"))
    assert response.status_code == 200


def test_check_user_session_token_doesnt_match(mocker, loaded_db, app_ctx):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = True
    # UserSession access_token is different from the access token in request
    mock_user_session.access_token = "1234"  # noqa: S105
    mock_get_latest_user_session.return_value = mock_user_session

    mocker.patch("ops_api.ops.auth.decorators.get_bearer_token", return_value="Bearer 5678")  # Request access token

    @check_user_session
    def dummy_function(*args, **kwargs):
        return "success"

    # Act
    verify_jwt_in_request(optional=True)  # This is needed to set the current_user
    mock_current_user = mocker.patch("ops_api.ops.auth.decorators.current_user")
    mock_current_user.id = 503

    # Assert
    with pytest.raises(InvalidUserSessionError):
        dummy_function()

    user_sessions = get_all_active_user_sessions(503, loaded_db)
    assert all([not user_session.is_active for user_session in user_sessions])


def test_idle_timeout(mocker, loaded_db, app_ctx):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = True
    mock_user_session.ip_address = None
    mock_user_session.last_active_at = datetime.now() - timedelta(minutes=31)
    mock_get_latest_user_session.return_value = mock_user_session

    @check_user_session
    def dummy_function(*args, **kwargs):
        return "success"

    # Act
    verify_jwt_in_request(optional=True)  # This is needed to set the current_user
    mock_current_user = mocker.patch("ops_api.ops.auth.decorators.current_user")
    mock_current_user.id = 503

    # Assert
    with pytest.raises(InvalidUserSessionError):
        dummy_function()

    user_sessions = get_all_active_user_sessions(503, loaded_db)
    assert all([not user_session.is_active for user_session in user_sessions])


def test_idle_no_timeout(mocker, loaded_db, app_ctx):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = True
    mock_user_session.ip_address = None
    mock_user_session.last_active_at = datetime.now()
    mock_get_latest_user_session.return_value = mock_user_session

    mocker.patch("flask.current_app.db_session")

    @check_user_session
    def dummy_function(*args, **kwargs):
        return "success"

    # Act
    verify_jwt_in_request(optional=True)  # This is needed to set the current_user
    mock_current_user = mocker.patch("ops_api.ops.auth.decorators.current_user")
    mock_current_user.id = 503

    # Assert
    result = dummy_function()

    assert result == "success"


def test_check_user_session_exclude_options(auth_client, mocker, app_ctx):
    # If the request method is OPTIONS, then the check_user_session function should not be called
    mock = mocker.patch("ops_api.ops.__init__.check_user_session_function")
    result = auth_client.options(url_for("api.agreements-group"))
    assert result.status_code == 200
    assert not mock.called
