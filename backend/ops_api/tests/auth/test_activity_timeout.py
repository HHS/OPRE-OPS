import pytest
from flask_jwt_extended import verify_jwt_in_request

from ops_api.ops.auth.decorators import check_user_session
from ops_api.ops.auth.exceptions import InvalidUserSessionError


@pytest.mark.usefixtures("app_ctx")
def test_check_user_session_decorator_with_active_session(mocker):
    # Arrange
    mock_get_latest_user_session = mocker.patch("ops_api.ops.auth.decorators.get_latest_user_session")
    mock_user_session = mocker.MagicMock()
    mock_user_session.is_active = True
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
