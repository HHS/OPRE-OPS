import pytest
from sqlalchemy import func, select

from models import ChangeRequestNotification, Notification, NotificationType
from ops_api.ops.services.notifications import NotificationService
from ops_api.ops.services.ops_service import ResourceNotFoundError


@pytest.fixture
def service(loaded_db):
    return NotificationService(loaded_db)


def _reload(session, notification_id):
    session.expire_all()
    return session.get(Notification, notification_id)


@pytest.mark.parametrize(
    "notification_type, expected_cls",
    [
        (NotificationType.NOTIFICATION, Notification),
        (NotificationType.CHANGE_REQUEST_NOTIFICATION, ChangeRequestNotification),
    ],
)
def test_create_persists_notification_of_requested_type(
    service, loaded_db, test_admin_user, notification_type, expected_cls
):
    notification = service.create(
        {
            "title": "Test notification",
            "message": "This is a test",
            "notification_type": notification_type,
            "recipient_id": test_admin_user.id,
        }
    )

    saved = _reload(loaded_db, notification.id)
    assert type(saved) is expected_cls
    assert saved.notification_type == notification_type
    assert saved.title == "Test notification"
    assert saved.message == "This is a test"
    assert saved.recipient_id == test_admin_user.id
    assert saved.is_read is False


def test_create_without_commit_still_assigns_id(service, loaded_db):
    notification = service.create({"title": "Deferred"}, commit=False)

    assert notification.id is not None
    assert _reload(loaded_db, notification.id).title == "Deferred"


def test_update_persists_known_fields_and_ignores_unknown(service, loaded_db):
    notification = service.create({"title": "old title", "is_read": False})

    _, status = service.update(notification.id, {"title": "new title", "is_read": True, "non_existent_field": "x"})

    saved = _reload(loaded_db, notification.id)
    assert status == 200
    assert saved.title == "new title"
    assert saved.is_read is True
    assert not hasattr(saved, "non_existent_field")


def test_delete_removes_notification(service, loaded_db):
    notification = service.create({"title": "to delete"})

    service.delete(notification.id)

    assert _reload(loaded_db, notification.id) is None


def test_get_returns_persisted_notification(service):
    notification = service.create({"title": "fetch me"})

    assert service.get(notification.id).title == "fetch me"


def test_get_list_includes_created_notifications(service, loaded_db):
    first = service.create({"title": "first"})
    second = service.create({"title": "second"})

    results, pagination = service.get_list()

    assert {first.id, second.id} <= {n.id for n in results}
    assert len(results) == loaded_db.scalar(select(func.count()).select_from(Notification))
    assert pagination is None


@pytest.mark.parametrize("method_name, args", [("get", ()), ("delete", ()), ("update", ({"title": "x"},))])
def test_missing_notification_raises_not_found(service, method_name, args):
    with pytest.raises(ResourceNotFoundError):
        getattr(service, method_name)(0, *args)
