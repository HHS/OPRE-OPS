from unittest.mock import Mock

import pytest

from models import ChangeRequestNotification, Notification, NotificationType
from ops_api.ops.services.notifications import NotificationService
from ops_api.ops.services.ops_service import ResourceNotFoundError


@pytest.fixture
def mock_db_session():
    return Mock()


def test_create_notification_default_type(mock_db_session):
    service = NotificationService(mock_db_session)
    data = {
        "title": "Test notification",
        "message": "This is a test",
        "is_read": False,
        "notification_type": NotificationType.NOTIFICATION,
    }

    notification = service.create(data)

    # Should create a base Notification instance
    assert isinstance(notification, Notification)
    assert notification.title == "Test notification"
    mock_db_session.add.assert_called_once_with(notification)
    mock_db_session.commit.assert_called_once()


def test_create_notification_change_request_type(mock_db_session):
    service = NotificationService(mock_db_session)
    data = {"notification_type": NotificationType.CHANGE_REQUEST_NOTIFICATION}

    notification = service.create(data)

    # Should create a ChangeRequestNotification instance
    assert isinstance(notification, ChangeRequestNotification)
    mock_db_session.add.assert_called_once_with(notification)
    mock_db_session.commit.assert_called_once()


def test_update_notification_success(mock_db_session):
    existing_notification = Mock(spec=Notification)
    existing_notification.title = "old title"
    mock_db_session.get.return_value = existing_notification

    service = NotificationService(mock_db_session)
    updated_fields = {"title": "new title", "non_existent_field": "ignored"}

    notification, status = service.update(1, updated_fields)

    assert notification == existing_notification
    assert notification.title == "new title"
    assert status == 200
    mock_db_session.commit.assert_called_once()


def test_update_notification_not_found(mock_db_session):
    mock_db_session.get.return_value = None
    service = NotificationService(mock_db_session)
    with pytest.raises(ResourceNotFoundError):
        service.update(1, {"some_field": "value"})


def test_delete_notification_success(mock_db_session):
    notification_to_delete = Mock(spec=Notification)
    mock_db_session.get.return_value = notification_to_delete

    service = NotificationService(mock_db_session)
    service.delete(1)

    mock_db_session.delete.assert_called_once_with(notification_to_delete)
    mock_db_session.commit.assert_called_once()


def test_delete_notification_not_found(mock_db_session):
    mock_db_session.get.return_value = None
    service = NotificationService(mock_db_session)
    with pytest.raises(ResourceNotFoundError):
        service.delete(1)


def test_get_notification_success(mock_db_session):
    notification = Mock(spec=Notification)
    mock_db_session.get.return_value = notification

    service = NotificationService(mock_db_session)
    result = service.get(1)

    assert result == notification


def test_get_notification_not_found(mock_db_session):
    mock_db_session.get.return_value = None
    service = NotificationService(mock_db_session)
    with pytest.raises(ResourceNotFoundError):
        service.get(1)


def test_get_list_notifications(mock_db_session):
    notification1 = Mock(spec=Notification)
    notification2 = Mock(spec=Notification)
    query_mock = Mock()
    query_mock.all.return_value = [notification1, notification2]
    mock_db_session.query.return_value = query_mock

    service = NotificationService(mock_db_session)
    results, pagination = service.get_list()

    assert results == [notification1, notification2]
    assert pagination is None
    mock_db_session.query.assert_called_once_with(Notification)
    query_mock.all.assert_called_once()
