import pytest
from models.cans import CAN


@pytest.mark.usefixtures("app_ctx")
def test_can_retrieve(loaded_db):
    can = loaded_db.session.query(CAN).filter(CAN.number == "G990205").one()

    assert can is not None
    assert can.number == "G990205"
    assert can.description == "Secondary Analyses Data On Child Care & Early Edu"
    assert can.purpose == "Secondary Analyses of Child Care and Early Education Data (2022)"
    assert can.nickname == "ABCD"
    assert can.arrangement_type_id == 2
    assert can.authorizer_id == 1
    assert can.managing_portfolio_id == 2
    assert can.arrangement_type_id == 2
    assert can.funding_sources == []
    assert can.shared_portfolios == []
    # assert can.budget_line_items == []


def test_can_creation():
    can = CAN(
        number="G990991-X",
        description="Secondary Analyses Data On Child Care & Early Edu",
        purpose="Secondary Analyses of Child Care and Early Education Data (2022)",
        nickname="ABCD",
        arrangement_type_id=2,
        authorizer_id=1,
        managing_portfolio_id=2,
    )

    serialized = can.to_dict()

    assert can is not None
    assert serialized["number"] == "G990991-X"


@pytest.mark.usefixtures("app_ctx")
def test_can_get_all(client, loaded_db):
    assert loaded_db.session.query(CAN).count() == 3

    response = client.get("/api/v1/cans/")
    assert response.status_code == 200
    assert len(response.json) == 3


@pytest.mark.usefixtures("app_ctx")
def test_can_get_by_id(client, loaded_db):
    response = client.get("/api/v1/cans/1")
    assert response.status_code == 200
    assert response.json["number"] == "G99WRGB"


@pytest.mark.usefixtures("app_ctx")
def test_can_get_portfolio_cans(client, loaded_db):
    response = client.get("/api/v1/cans/portfolio/1")
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]["id"] == 1
