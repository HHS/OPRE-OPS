from datetime import date

import pytest

from models import AgreementChangeRequest, ChangeRequestStatus, User
from models.notifications import ChangeRequestNotification, Notification
from ops_api.ops.resources.notifications import RecipientSchema, UpdateSchema


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
def change_request_notification(loaded_db, test_user, test_admin_user):
    change_request = AgreementChangeRequest()
    change_request.agreement_id = 1
    change_request.status = ChangeRequestStatus.APPROVED
    change_request.managing_division_id = 1
    change_request.requested_change_info = {"target_display_name": "Agreement#1"}
    change_request.requested_change_data = {"something": "value"}
    change_request.requested_change_diff = {"something": {"old": "old_value", "new": "new_value"}}
    change_request.created_by = test_user.id
    loaded_db.add(change_request)

    notification = ChangeRequestNotification(
        title="Test Change Request Notification",
        message="This is a change request notification",
        is_read=False,
        recipient_id=test_user.id,
        expires=date(2031, 12, 31),
        change_request=change_request,
        created_by=test_admin_user.id,
    )

    loaded_db.add(notification)
    loaded_db.commit()

    yield notification

    loaded_db.delete(notification)
    loaded_db.delete(change_request)
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
    db_count = loaded_db.query(Notification).count()
    assert db_count > 0

    response = auth_client.get("/api/v1/notifications/")
    assert response.status_code == 200
    assert len(response.json) == db_count


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_by_user_id(auth_client, loaded_db, notification):
    user_id = notification.recipient.id
    db_count = loaded_db.query(Notification).filter(Notification.recipient_id == user_id).count()
    assert db_count > 0
    response = auth_client.get(f"/api/v1/notifications/?user_id={user_id}")
    assert response.status_code == 200
    assert len(response.json) == db_count
    assert response.json[0]["title"] == "System Notification"
    assert response.json[0]["message"] == "This is a system notification"
    assert response.json[0]["is_read"] is False
    assert response.json[0]["expires"] == "2031-12-31"
    assert response.json[0]["recipient"]["id"] == user_id


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_by_oidc_id(auth_client, loaded_db, notification):
    oidc_id = str(notification.recipient.oidc_id)
    db_count = loaded_db.query(Notification).filter(Notification.recipient_id == notification.recipient_id).count()
    assert db_count > 0
    response = auth_client.get(f"/api/v1/notifications/?oidc_id={oidc_id}")
    assert response.status_code == 200
    assert len(response.json) == db_count
    assert response.json[0]["title"] == "System Notification"
    assert response.json[0]["message"] == "This is a system notification"
    assert response.json[0]["is_read"] is False
    assert response.json[0]["expires"] == "2031-12-31"
    assert response.json[0]["recipient"]["oidc_id"] == oidc_id


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_by_is_read(auth_client, loaded_db, notification, notification_is_read_is_true):
    db_count = loaded_db.query(Notification).filter(Notification.is_read.is_(False)).count()
    assert db_count > 0
    response = auth_client.get("/api/v1/notifications/?is_read=False")
    assert response.status_code == 200
    assert len(response.json) > 0
    assert len(response.json) == db_count
    assert response.json[0]["title"] == "System Notification"
    assert response.json[0]["message"] == "This is a system notification"
    assert response.json[0]["is_read"] is False
    assert response.json[0]["expires"] == "2031-12-31"
    assert response.json[0]["recipient"] is not None

    db_count = loaded_db.query(Notification).filter(Notification.is_read.is_(True)).count()
    assert db_count > 0
    response = auth_client.get("/api/v1/notifications/?is_read=True")
    assert response.status_code == 200
    assert len(response.json) == db_count
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
    recipient_schema = RecipientSchema()
    assert response.json["id"] == notification.id
    assert response.json["title"] == notification.title
    assert response.json["message"] == notification.message
    assert response.json["recipient"] == recipient_schema.dump(notification.recipient)
    assert response.json["is_read"] is False
    assert response.json["expires"] == notification.expires.isoformat()


@pytest.mark.usefixtures("app_ctx")
@pytest.mark.usefixtures("loaded_db")
def test_patch_notification_ack(auth_client, notification):
    response = auth_client.patch(f"/api/v1/notifications/{notification.id}", json={"is_read": True})
    recipient_schema = RecipientSchema()
    assert response.json["id"] == notification.id
    assert response.json["title"] == notification.title
    assert response.json["message"] == notification.message
    assert response.json["recipient"] == recipient_schema.dump(notification.recipient)
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


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_by_agreement_id(
    auth_client, loaded_db, notification, change_request_notification, test_user
):
    agreement_id = change_request_notification.change_request.agreement_id
    test_user_oidc_id = str(change_request_notification.recipient.oidc_id)
    db_count = (
        loaded_db.query(ChangeRequestNotification)
        .join(AgreementChangeRequest, ChangeRequestNotification.change_request_id == AgreementChangeRequest.id)
        .where(AgreementChangeRequest.agreement_id == agreement_id)
        .where(ChangeRequestNotification.recipient_id == change_request_notification.recipient_id)
        .count()
    )
    assert db_count > 0
    total_db_count = loaded_db.query(Notification).count()
    assert total_db_count > db_count

    response = auth_client.get(
        f"/api/v1/notifications/?agreement_id={agreement_id}&oidc_id={test_user_oidc_id}&is_read=False"
    )
    assert response.status_code == 200
    assert len(response.json) == db_count
    assert response.json[0]["notification_type"] == "CHANGE_REQUEST_NOTIFICATION"
    assert response.json[0]["title"] == "Test Change Request Notification"
    assert response.json[0]["message"] == "This is a change request notification"
    assert response.json[0]["is_read"] is False
    assert response.json[0]["expires"] == "2031-12-31"
    assert response.json[0]["recipient"] is not None
    assert response.json[0]["change_request"] is not None
    assert response.json[0]["change_request"]["agreement_id"] == agreement_id
    assert response.json[0]["change_request"]["status"] == "APPROVED"
    assert response.json[0]["change_request"]["requested_change_diff"]["something"]["old"] == "old_value"
    assert response.json[0]["change_request"]["requested_change_diff"]["something"]["new"] == "new_value"
