import pytest
from models.notifications import Notification


@pytest.mark.usefixtures("app_ctx")
def test_can_retrieve(loaded_db):
    notification = loaded_db.get(Notification, 1)

    assert notification is not None
    assert notification.title == "System Notification"


# def test_can_creation():
#     can = CAN(
#         number="G990991-X",
#         description="Secondary Analyses Data On Child Care & Early Edu",
#         purpose="Secondary Analyses of Child Care and Early Education Data (2022)",
#         nickname="ABCD",
#         arrangement_type=CANArrangementType.COST_SHARE,
#         authorizer_id=1,
#         managing_portfolio_id=2,
#     )
#
#     serialized = can.to_dict()
#
#     assert can is not None
#     assert serialized["number"] == "G990991-X"
#
#
# @pytest.mark.usefixtures("app_ctx")
# def test_can_get_all(auth_client, loaded_db):
#     assert loaded_db.query(CAN).count() == 16
#
#     response = auth_client.get("/api/v1/cans/")
#     assert response.status_code == 200
#     assert len(response.json) == 16
#
#
# @pytest.mark.usefixtures("app_ctx")
# def test_can_get_by_id(auth_client, loaded_db):
#     response = auth_client.get("/api/v1/cans/1")
#     assert response.status_code == 200
#     assert response.json["number"] == "G99HRF2"
#
#
# @pytest.mark.usefixtures("app_ctx")
# def test_can_get_portfolio_cans(auth_client, loaded_db):
#     response = auth_client.get("/api/v1/cans/portfolio/1")
#     assert response.status_code == 200
#     assert len(response.json) == 2
#     assert response.json[0]["id"] == 2


@pytest.mark.usefixtures("app_ctx")
def test_get_cans_search_filter(auth_client, loaded_db):
    response = auth_client.get("/api/v1/cans/?search=XXX8")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["id"] == 13

    response = auth_client.get("/api/v1/cans/?search=G99HRF2")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["id"] == 1

    response = auth_client.get("/api/v1/cans/?search=")
    assert response.status_code == 200
    assert len(response.json) == 0
