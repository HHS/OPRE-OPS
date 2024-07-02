from datetime import date

import marshmallow_dataclass as mmdc
import pytest

from models import User
from models.notifications import Notification
from ops_api.ops.resources.notifications import Recipient, UpdateSchema


@pytest.mark.usefixtures("app_ctx")
def test_notification_retrieve(loaded_db):
    notification = loaded_db.get(Notification, 1)

    assert notification is not None
    assert notification.title == "System Notification"
    assert notification.message == "This is a system notification"
    assert notification.is_read is False
    assert notification.recipient is not None
    assert notification.expires == date(2031, 12, 31)


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def notification(loaded_db, test_admin_user):
    notification = Notification(
        title="System Notification",
        message="This is a system notification",
        is_read=False,
        recipient_id=test_admin_user.id,  # user associated to the auth_client
        expires=date(2031, 12, 31),
    )

    loaded_db.add(notification)
    loaded_db.commit()

    yield notification

    loaded_db.delete(notification)
    loaded_db.commit()


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def notification_for_another_user(loaded_db):
    john = User(
        oidc_id="41b88469-b7e8-4dbc-83d1-7e9a61d596b3",
        email="john@example.com",
        division=1,
    )

    loaded_db.add(john)
    loaded_db.commit()
    notification = Notification(
        title="System Notification",
        message="This is a system notification",
        is_read=False,
        recipient_id=john.id,
        expires=date(2031, 12, 31),
    )

    loaded_db.add(notification)
    loaded_db.commit()

    yield notification

    loaded_db.delete(notification)
    loaded_db.delete(john)
    loaded_db.commit()


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def notification_is_read_is_true(loaded_db):
    john = User(
        oidc_id="41b88469-b7e8-4dbc-83d1-7e9a61d596b3",
        email="john@example.com",
        division=1,
    )

    loaded_db.add(john)
    loaded_db.commit()

    notification = Notification(
        title="System Notification",
        message="This is a system notification",
        is_read=True,
        recipient_id=john.id,
        expires=date(2031, 12, 31),
    )

    loaded_db.add(notification)
    loaded_db.commit()

    yield notification

    loaded_db.delete(notification)
    loaded_db.delete(john)
    loaded_db.commit()


def test_notification_creation(loaded_db, notification):
    assert notification is not None
    assert notification.recipient is not None

    user = loaded_db.get(User, notification.recipient_id)
    assert user.notifications is not None
    assert notification in user.notifications


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_all(auth_client, loaded_db):
    assert loaded_db.query(Notification).count() == 42

    response = auth_client.get("/api/v1/notifications/")
    assert response.status_code == 200
    assert len(response.json) == 42


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_by_user_id(auth_client, loaded_db, notification):
    user_id = notification.recipient.id
    response = auth_client.get(f"/api/v1/notifications/?user_id={user_id}")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["title"] == "System Notification"
    assert response.json[0]["message"] == "This is a system notification"
    assert response.json[0]["is_read"] is False
    assert response.json[0]["expires"] == "2031-12-31"
    assert response.json[0]["recipient"]["id"] == user_id


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_by_oidc_id(auth_client, loaded_db, notification):
    oidc_id = str(notification.recipient.oidc_id)
    response = auth_client.get(f"/api/v1/notifications/?oidc_id={oidc_id}")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["title"] == "System Notification"
    assert response.json[0]["message"] == "This is a system notification"
    assert response.json[0]["is_read"] is False
    assert response.json[0]["expires"] == "2031-12-31"
    assert response.json[0]["recipient"]["oidc_id"] == oidc_id


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_by_is_read(auth_client, loaded_db, notification_is_read_is_true):
    response = auth_client.get("/api/v1/notifications/?is_read=False")
    assert response.status_code == 200
    assert len(response.json) == 41
    assert response.json[0]["title"] == "System Notification"
    assert response.json[0]["message"] == "This is a system notification"
    assert response.json[0]["is_read"] is False
    assert response.json[0]["expires"] == "2031-12-31"
    assert response.json[0]["recipient"] is not None

    response = auth_client.get("/api/v1/notifications/?is_read=True")
    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["title"] == "System Notification"
    assert response.json[0]["message"] == "This is a system notification"
    assert response.json[0]["is_read"] is True
    assert response.json[0]["recipient"] is not None
    assert response.json[0]["expires"] == "2031-12-31"


@pytest.mark.usefixtures("app_ctx")
def test_notification_get_by_id(auth_client, loaded_db, test_user):
    response = auth_client.get("/api/v1/notifications/1")
    assert response.status_code == 200
    assert response.json["title"] == "System Notification"
    assert response.json["message"] == "This is a system notification"
    assert response.json["is_read"] is False
    assert response.json["expires"] == "2031-12-31"
    assert response.json["recipient"] is not None
    assert response.json["recipient"]["id"] == test_user.id
    assert response.json["recipient"]["email"] == "chris.fortunato@example.com"
    assert response.json["recipient"]["full_name"] == "Chris Fortunato"


@pytest.mark.usefixtures("app_ctx")
def test_notification_auth(client, loaded_db):
    response = client.get("/api/v1/notifications/1")
    assert response.status_code == 401

    response = client.get("/api/v1/notifications/")
    assert response.status_code == 401


@pytest.mark.usefixtures("app_ctx")
def test_put_notification(auth_client, notification, test_user):
    data = UpdateSchema(
        is_read=False,
        title="Updated Notification",
        message="This is an updated notification",
        recipient_id=test_user.id,
        expires="2041-12-31",
    )
    response = auth_client.put(f"/api/v1/notifications/{notification.id}", json=data.__dict__)
    assert response.status_code == 200
    assert response.json["id"] == notification.id
    assert response.json["title"] == "Updated Notification"
    assert response.json["message"] == "This is an updated notification"
    assert response.json["expires"] == "2041-12-31"
    assert response.json["recipient"] == {
        "email": "chris.fortunato@example.com",
        "full_name": "Chris Fortunato",
        "id": test_user.id,
        "oidc_id": "00000000-0000-1111-a111-000000000001",
    }
    assert response.json["is_read"] is False
    assert response.json["created_on"] != response.json["updated_on"]


@pytest.mark.usefixtures("app_ctx")
def test_put_notification_ack(auth_client, notification, test_user):
    data = UpdateSchema(
        is_read=True,
        title="Updated Notification",
        message="This is an updated notification",
        recipient_id=test_user.id,
        expires="2041-12-31",
    )
    response = auth_client.put(f"/api/v1/notifications/{notification.id}", json=data.__dict__)
    assert response.status_code == 200
    assert response.json["id"] == notification.id
    assert response.json["title"] == "Updated Notification"
    assert response.json["message"] == "This is an updated notification"
    assert response.json["expires"] == "2041-12-31"
    assert response.json["recipient"] == {
        "email": "chris.fortunato@example.com",
        "full_name": "Chris Fortunato",
        "id": test_user.id,
        "oidc_id": "00000000-0000-1111-a111-000000000001",
    }
    assert response.json["is_read"] is True
    assert response.json["created_on"] != response.json["updated_on"]


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_notification(auth_client, notification):
    response = auth_client.patch(f"/api/v1/notifications/{notification.id}", json={"is_read": False})
    recipient = mmdc.class_schema(Recipient)()
    assert response.json["id"] == notification.id
    assert response.json["title"] == notification.title
    assert response.json["message"] == notification.message
    assert response.json["recipient"] == recipient.dump(notification.recipient)
    assert response.json["is_read"] is False
    assert response.json["expires"] == notification.expires.isoformat()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_notification_ack(auth_client, notification):
    response = auth_client.patch(f"/api/v1/notifications/{notification.id}", json={"is_read": True})
    recipient = mmdc.class_schema(Recipient)()
    assert response.json["id"] == notification.id
    assert response.json["title"] == notification.title
    assert response.json["message"] == notification.message
    assert response.json["recipient"] == recipient.dump(notification.recipient)
    assert response.json["is_read"] is True
    assert response.json["created_on"] != response.json["updated_on"]
    assert response.json["expires"] == notification.expires.isoformat()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_notification_ack_must_be_user(auth_client, notification_for_another_user):
    # Test that a user cannot acknowledge a notification that is not theirs
    response = auth_client.patch(
        f"/api/v1/notifications/{notification_for_another_user.id}",
        json={"is_read": True},
    )
    assert response.status_code == 400
