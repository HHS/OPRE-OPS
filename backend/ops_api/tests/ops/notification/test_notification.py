import pytest
from models import User
from models.notifications import Notification
from sqlalchemy import select


@pytest.mark.usefixtures("app_ctx")
def test_notification_retrieve(loaded_db):
    notification = loaded_db.get(Notification, 1)

    assert notification is not None
    assert notification.title == "System Notification"
    assert notification.message == "This is a system notification"
    assert notification.status is False
    assert notification.recipients is not None
    assert notification.expires is None


@pytest.fixture()
@pytest.mark.usefixtures("app_ctx")
def notification(loaded_db):
    john = User(
        oidc_id="41b88469-b7e8-4dbc-83d1-7e9a61d596b3",
        email="john@example.com",
    )
    jane = User(
        oidc_id="41b88469-b7e8-4dbc-83d1-7e9a61d596b4",
        email="jane@example.com",
    )
    notification = Notification(
        title="System Notification",
        message="This is a system notification",
        status=False,
    )
    notification.recipients.append(john)
    notification.recipients.append(jane)

    loaded_db.add(notification)
    loaded_db.add(john)
    loaded_db.add(jane)
    loaded_db.commit()

    yield notification

    loaded_db.delete(notification)
    loaded_db.delete(john)
    loaded_db.delete(jane)
    loaded_db.commit()


def test_notification_creation(loaded_db, notification):
    assert notification is not None
    assert notification.recipients is not None
    assert len(notification.recipients) == 2

    stmt = select(User).where(User.email == "john@example.com")
    john = loaded_db.scalar(stmt)
    assert john.notifications is not None
    assert john.notifications[0] == notification

    stmt = select(User).where(User.email == "jane@example.com")
    jane = loaded_db.scalar(stmt)
    assert jane.notifications is not None
    assert jane.notifications[0] == notification


@pytest.mark.usefixtures("app_ctx")
def test_notifications_get_all(auth_client, loaded_db):
    assert loaded_db.query(Notification).count() == 1

    response = auth_client.get("/api/v1/notifications/")
    assert response.status_code == 200
    assert len(response.json) == 1


# @pytest.mark.usefixtures("app_ctx")
# def test_notifications_get_by_user(auth_client, loaded_db, notification):
#     response = auth_client.get("/api/v1/notifications/?user_id=1")
#     assert response.status_code == 200
#     assert len(response.json) == 1


@pytest.mark.usefixtures("app_ctx")
def test_can_get_by_id(auth_client, loaded_db):
    response = auth_client.get("/api/v1/notifications/1")
    assert response.status_code == 200
    assert response.json["title"] == "System Notification"


#
#
# @pytest.mark.usefixtures("app_ctx")
# def test_can_get_portfolio_cans(auth_client, loaded_db):
#     response = auth_client.get("/api/v1/cans/portfolio/1")
#     assert response.status_code == 200
#     assert len(response.json) == 2
#     assert response.json[0]["id"] == 2


# @pytest.mark.usefixtures("app_ctx")
# def test_get_cans_search_filter(auth_client, loaded_db):
#     response = auth_client.get("/api/v1/cans/?search=XXX8")
#     assert response.status_code == 200
#     assert len(response.json) == 1
#     assert response.json[0]["id"] == 13
#
#     response = auth_client.get("/api/v1/cans/?search=G99HRF2")
#     assert response.status_code == 200
#     assert len(response.json) == 1
#     assert response.json[0]["id"] == 1
#
#     response = auth_client.get("/api/v1/cans/?search=")
#     assert response.status_code == 200
#     assert len(response.json) == 0
