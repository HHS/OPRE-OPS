import datetime

from sqlalchemy import Integer, cast, func, select

from models import CAN, BudgetLineItem, CANFundingSource, CANStatus
from models.cans import CANFundingDetails
from ops.services.cans import CANService
from ops_api.tests.utils import DummyContextManager


def test_can_retrieve(loaded_db, mocker, app_ctx):
    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2023, 8, 1)
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()

    assert can is not None
    assert can.number == "G99HRF2"
    assert can.description == "Healthy Marriages Responsible Fatherhood - OPRE"
    assert can.nick_name == "HMRF-OPRE"
    assert can.active_period == 1
    assert can.portfolio_id == 6
    assert can.funding_details.funding_source == CANFundingSource.OPRE
    assert can.funding_budgets[0].fiscal_year == 2023
    assert can.funding_received[0].fiscal_year == 2023
    assert can.status == CANStatus.ACTIVE
    assert (
        len(can.budget_line_items)
        == loaded_db.execute(
            select(func.count()).select_from(BudgetLineItem).where(BudgetLineItem.can_id == can.id)
        ).scalar()
    )


def test_can_is_expired_1_year_can(loaded_db, mocker, app_ctx):
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()
    assert can is not None

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2022, 8, 1)
    assert can.is_expired is True, "can is not active in 2023 because it is appropriated in 2023 for 1 year"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2023, 8, 1)
    assert can.is_expired is False, "can is active in 2023"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2024, 8, 1)
    assert can.is_expired is True, "can is not active in 2024 because it is appropriated in 2023 for 1 year"


def test_can_is_expired_5_year_can(loaded_db, mocker, app_ctx):
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99IA14")).scalar_one()
    assert can is not None

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2020, 8, 1)
    assert can.is_expired is True, "can is active in 2021-2025"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2021, 8, 1)
    assert can.is_expired is False, "can is active in 2021-2025"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2022, 8, 1)
    assert can.is_expired is False, "can is active in 2021-2025"

    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2025, 10, 1)
    assert can.is_expired is True, "can is active in 2021-2025"


def test_can_is_inactive(loaded_db, mocker, app_ctx):
    date_mock = mocker.patch("models.cans.date")
    date_mock.today.return_value = datetime.date(2024, 10, 1)
    can = loaded_db.execute(select(CAN).where(CAN.number == "G99HRF2")).scalar_one()

    assert can is not None
    assert can.status == CANStatus.INACTIVE


def test_can_get_all(auth_client, mocker, test_can, app_ctx):
    mocker_get_can = mocker.patch("ops_api.ops.services.cans.CANService.get_list")
    metadata = {"count": 1, "limit": 10, "offset": 0}
    mocker_get_can.return_value = ([test_can], metadata)
    response = auth_client.get("/api/v1/cans/")
    assert response.status_code == 200
    assert "data" in response.json
    assert "count" in response.json
    assert "limit" in response.json
    assert "offset" in response.json
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == test_can.id
    assert response.json["count"] == 1
    mocker_get_can.assert_called_once()


def test_can_get_list_by_fiscal_year(auth_client, mocker, test_can, app_ctx):
    mocker_get_can = mocker.patch("ops_api.ops.services.cans.CANService.get_list")
    metadata = {"count": 1, "limit": 10, "offset": 0}
    mocker_get_can.return_value = ([test_can], metadata)
    response = auth_client.get("/api/v1/cans/?fiscal_year=2023")
    assert response.status_code == 200
    assert "data" in response.json
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == test_can.id
    mocker_get_can.assert_called_once()


def test_service_can_get_all(auth_client, loaded_db):
    count = loaded_db.query(CAN).count()
    can_service = CANService()
    cans, metadata = can_service.get_list()
    assert len(cans) == count
    assert metadata["count"] == count
    assert metadata["limit"] == count
    assert metadata["offset"] == 0


def test_service_can_get_list_by_fiscal_year(auth_client, loaded_db):
    fiscal_year = 2025
    base_stmt = select(CAN).join(CANFundingDetails, CAN.funding_details_id == CANFundingDetails.id)
    active_period_expr = cast(func.substr(CANFundingDetails.fund_code, 11, 1), Integer)

    one_year_stmt = base_stmt.where(active_period_expr == 1, CANFundingDetails.fiscal_year == fiscal_year)
    one_year_cans = loaded_db.execute(one_year_stmt).scalars().all()
    one_year_cans_count = len(one_year_cans)

    multiple_year_stmt = base_stmt.where(
        active_period_expr > 1,
        CANFundingDetails.fiscal_year <= fiscal_year,
        CANFundingDetails.fiscal_year + active_period_expr > fiscal_year,
    )
    multiple_year_cans = loaded_db.execute(multiple_year_stmt).scalars().all()
    multiple_year_cans_count = len(multiple_year_cans)

    zero_year_stmt = base_stmt.where(active_period_expr == 0, CANFundingDetails.fiscal_year >= fiscal_year)
    zero_year_cans = loaded_db.execute(zero_year_stmt).scalars().all()
    zero_year_cans_count = len(zero_year_cans)

    count = one_year_cans_count + multiple_year_cans_count + zero_year_cans_count

    can_service = CANService()
    # Service now expects parameters as lists (from schema)
    cans, metadata = can_service.get_list(search=[""], fiscal_year=[fiscal_year])
    assert len(cans) == count
    assert metadata["count"] == count


def test_can_get_by_id(auth_client, mocker, test_can, app_ctx):
    mocker_get_can = mocker.patch("ops_api.ops.services.cans.CANService.get")
    mocker_get_can.return_value = test_can
    response = auth_client.get(f"/api/v1/cans/{test_can.id}")
    assert response.status_code == 200
    assert response.json["number"] == "G99HRF2"


def test_can_service_get_by_id(test_can):
    service = CANService()
    can = service.get(test_can.id)
    assert test_can.id == can.id
    assert test_can.number == can.number


def test_can_get_portfolio_cans(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/cans/portfolio/1")
    assert response.status_code == 200
    assert len(response.json) == 3
    assert response.json[0]["id"] == 501


def test_get_cans_search_filter(auth_client, loaded_db, test_can, app_ctx):
    response = auth_client.get("/api/v1/cans/?search=XXX8")
    assert response.status_code == 200
    assert "data" in response.json
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == 512

    response = auth_client.get("/api/v1/cans/?search=G99HRF2")
    assert response.status_code == 200
    assert len(response.json["data"]) == 1
    assert response.json["data"][0]["id"] == test_can.id

    response = auth_client.get("/api/v1/cans/?search=")
    assert response.status_code == 200
    assert len(response.json["data"]) == 0


def test_service_get_cans_search_filter(test_can):
    can_service = CANService()
    # Service now expects parameters as lists (from schema)
    cans, metadata = can_service.get_list(search=["XXX8"])
    assert len(cans) == 1
    assert cans[0].id == 512
    assert metadata["count"] == 1

    cans, metadata = can_service.get_list(search=["G99HRF2"])
    assert len(cans) == 1
    assert cans[0].id == test_can.id
    assert metadata["count"] == 1

    cans, metadata = can_service.get_list(search=[""])
    assert len(cans) == 0
    assert metadata["count"] == 0


# Testing CAN Pagination
def test_can_get_list_with_pagination(auth_client, loaded_db, app_ctx):
    """Test pagination with limit and offset parameters"""
    # Test with limit=5, offset=0
    response = auth_client.get("/api/v1/cans/?limit=5&offset=0")
    assert response.status_code == 200
    assert "data" in response.json
    assert "count" in response.json
    assert "limit" in response.json
    assert "offset" in response.json
    assert response.json["limit"] == 5
    assert response.json["offset"] == 0
    assert len(response.json["data"]) <= 5
    assert response.json["count"] >= len(response.json["data"])


def test_can_get_list_pagination_with_offset(auth_client, loaded_db, app_ctx):
    """Test pagination with offset beyond first page"""
    # Get total count first
    response1 = auth_client.get("/api/v1/cans/")
    total_count = response1.json["count"]

    # Test with offset=5
    response2 = auth_client.get("/api/v1/cans/?limit=3&offset=5")
    assert response2.status_code == 200
    assert response2.json["limit"] == 3
    assert response2.json["offset"] == 5
    assert response2.json["count"] == total_count  # Total count should be the same
    assert len(response2.json["data"]) <= 3


def test_can_get_list_pagination_with_search(auth_client, loaded_db, app_ctx):
    """Test pagination works with search filter"""
    response = auth_client.get("/api/v1/cans/?search=G99&limit=2&offset=0")
    assert response.status_code == 200
    assert "data" in response.json
    assert response.json["limit"] == 2
    assert response.json["offset"] == 0
    assert len(response.json["data"]) <= 2


def test_can_get_list_pagination_offset_beyond_total(auth_client, loaded_db, app_ctx):
    """Test pagination when offset is beyond total count"""
    response = auth_client.get("/api/v1/cans/?limit=10&offset=1000")
    assert response.status_code == 200
    assert response.json["limit"] == 10
    assert response.json["offset"] == 1000
    assert len(response.json["data"]) == 0  # No results beyond total


def test_service_can_get_list_with_pagination(loaded_db):
    """Test service layer pagination"""
    can_service = CANService()

    # Test with limit and offset
    cans, metadata = can_service.get_list(limit=[5], offset=[2])
    assert len(cans) <= 5
    assert metadata["limit"] == 5
    assert metadata["offset"] == 2
    assert metadata["count"] >= len(cans)


def test_service_can_get_list_pagination_edge_cases(loaded_db):
    """Test service layer pagination edge cases"""
    can_service = CANService()

    # Test with limit=1
    cans, metadata = can_service.get_list(limit=[1], offset=[0])
    assert len(cans) <= 1
    assert metadata["limit"] == 1
    assert metadata["offset"] == 0

    # Test with large limit
    cans, metadata = can_service.get_list(limit=[50], offset=[0])
    assert len(cans) <= 50
    assert metadata["limit"] == 50


# Testing CAN Creation
def test_can_post_creates_can(budget_team_auth_client, mocker, loaded_db, app_ctx):
    input_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
        "nick_name": "MockNickname",
    }

    mock_output_data = CAN(
        id=517,
        portfolio_id=6,
        number="G998235",
        description="Test CAN Created by unit test",
        nick_name="MockNickname",
    )
    mocker_create_can = mocker.patch("ops_api.ops.services.cans.CANService.create")
    mocker_create_can.return_value = mock_output_data
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.post("/api/v1/cans/", json=input_data)

    assert context_manager.metadata["new_can"]["id"] == 517
    assert context_manager.metadata["new_can"]["number"] == "G998235"

    # Add fields that are default populated on load.
    input_data["funding_details_id"] = None
    assert response.status_code == 201
    mocker_create_can.assert_called_once_with(input_data)
    assert response.json["id"] == mock_output_data.id
    assert response.json["portfolio_id"] == mock_output_data.portfolio_id
    assert response.json["number"] == mock_output_data.number
    assert response.json["description"] == mock_output_data.description
    assert response.json["nick_name"] == mock_output_data.nick_name


def test_basic_user_cannot_post_creates_can(basic_user_auth_client, app_ctx):
    data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }
    response = basic_user_auth_client.post("/api/v1/cans/", json=data)

    assert response.status_code == 403


def test_service_create_can(loaded_db):
    data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }

    can_service = CANService()

    new_can = can_service.create(data)

    can = loaded_db.execute(select(CAN).where(CAN.number == "G998235")).scalar_one()

    assert can is not None
    assert can.number == "G998235"
    assert can.description == "Test CAN Created by unit test"
    assert can.portfolio_id == 6
    assert can.id == 528
    assert can == new_can

    loaded_db.delete(new_can)
    loaded_db.commit()


# Testing updating CANs by PATCH
def test_can_patch(budget_team_auth_client, mocker, unadded_can, app_ctx):
    test_can_id = 517
    update_data = {"description": "New Description", "nick_name": "My nick name"}

    old_can = CAN(
        portfolio_id=6,
        number="G998235",
        description="Test CAN created by unit tests",
        nick_name="Old nickname",
    )
    mocker_get_can = mocker.patch("ops_api.ops.services.cans.CANService.get")
    mocker_get_can.return_value = old_can
    mocker_update_can = mocker.patch("ops_api.ops.services.cans.CANService.update")
    unadded_can.description = update_data["description"]
    mocker_update_can.return_value = unadded_can
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.patch(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert context_manager.metadata["can_updates"]["changes"] is not None
    changes = context_manager.metadata["can_updates"]["changes"]
    assert len(changes.keys()) == 2
    # assert that new data
    assert changes["nick_name"]["new_value"] == update_data["nick_name"]
    assert changes["nick_name"]["old_value"] == old_can.nick_name
    assert changes["description"]["new_value"] == update_data["description"]
    assert changes["description"]["old_value"] == old_can.description

    assert response.status_code == 200
    mocker_update_can.assert_called_once_with(update_data, test_can_id)
    assert response.json["number"] == unadded_can.number
    assert response.json["description"] == unadded_can.description


def test_can_patch_404(budget_team_auth_client, mocker, loaded_db, unadded_can, app_ctx):
    test_can_id = 528
    update_data = {
        "description": "Test CAN Created by unit test",
    }

    response = budget_team_auth_client.patch(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert response.status_code == 404


def test_basic_user_cannot_patch_cans(basic_user_auth_client, app_ctx):
    data = {
        "description": "An updated can description",
    }
    response = basic_user_auth_client.patch("/api/v1/cans/517", json=data)

    assert response.status_code == 403


def test_service_patch_can(loaded_db):
    update_data = {
        "description": "Test Test Test",
    }

    test_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }

    can_service = CANService()

    new_can = can_service.create(test_data)

    updated_can = can_service.update(update_data, new_can.id)

    can = loaded_db.execute(select(CAN).where(CAN.number == "G998235")).scalar_one()

    assert can is not None
    assert can.number == "G998235"
    assert updated_can.number == "G998235"
    assert can.description == "Test Test Test"
    assert updated_can.description == "Test Test Test"

    loaded_db.delete(new_can)
    loaded_db.commit()


# Testing updating CANs by PUT
def test_can_put(budget_team_auth_client, mocker, unadded_can, app_ctx):
    test_can_id = 517
    update_data = {
        "number": "G998235",
        "description": "New Description",
        "portfolio_id": 6,
        "funding_details_id": 1,
        "nick_name": "My nick name",
    }

    old_can = CAN(
        portfolio_id=6,
        number="G998235",
        description="Test CAN created by unit tests",
        nick_name="Old nickname",
        funding_details_id=1,
    )
    mocker_get_can = mocker.patch("ops_api.ops.services.cans.CANService.get")
    mocker_get_can.return_value = old_can
    mocker_update_can = mocker.patch("ops_api.ops.services.cans.CANService.update")
    unadded_can.description = update_data["description"]
    mocker_update_can.return_value = unadded_can
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.put(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert context_manager.metadata["can_updates"]["changes"] is not None
    changes = context_manager.metadata["can_updates"]["changes"]
    assert len(changes.keys()) == 3
    # assert that new data
    assert changes["nick_name"]["new_value"] == update_data["nick_name"]
    assert changes["nick_name"]["old_value"] == old_can.nick_name
    assert changes["description"]["new_value"] == update_data["description"]
    assert changes["description"]["old_value"] == old_can.description

    mocker_update_can = mocker.patch("ops_api.ops.services.cans.CANService.update")
    unadded_can.description = update_data["description"]
    mocker_update_can.return_value = unadded_can
    response = budget_team_auth_client.put(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert response.status_code == 200
    mocker_update_can.assert_called_once_with(update_data, test_can_id)
    assert response.json["number"] == unadded_can.number
    assert response.json["description"] == unadded_can.description
    assert response.json["nick_name"] == unadded_can.nick_name


def test_basic_user_cannot_put_cans(basic_user_auth_client, app_ctx):
    data = {
        "description": "An updated can description",
    }
    response = basic_user_auth_client.put("/api/v1/cans/517", json=data)

    assert response.status_code == 403


def test_can_put_404(budget_team_auth_client, app_ctx):
    test_can_id = 550
    update_data = {
        "number": "G123456",
        "description": "Test CAN Created by unit test",
        "portfolio_id": 6,
        "funding_details_id": 1,
        "nick_name": "MockNickname",
    }

    response = budget_team_auth_client.put(f"/api/v1/cans/{test_can_id}", json=update_data)

    assert response.status_code == 404


def test_service_update_can_with_nones(loaded_db):
    update_data = {
        "nick_name": None,
        "number": "G123456",
        "description": "Test Test Test",
        "portfolio_id": 6,
        "funding_details_id": 1,
    }

    test_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "nick_name": "My Nickname",
        "funding_details_id": 1,
        "description": "Test CAN Created by unit test",
    }

    can_service = CANService()

    new_can = can_service.create(test_data)

    updated_can = can_service.update(update_data, new_can.id)

    can = loaded_db.execute(select(CAN).where(CAN.id == updated_can.id)).scalar_one()

    assert can is not None
    assert can.number == "G123456"
    assert updated_can.number == "G123456"
    assert can.nick_name is None
    assert updated_can.nick_name is None
    assert can.portfolio_id == 6
    assert updated_can.portfolio_id == 6
    assert can.description == "Test Test Test"
    assert updated_can.description == "Test Test Test"
    assert can.funding_details_id == 1
    assert updated_can.funding_details_id == 1

    loaded_db.delete(new_can)
    loaded_db.commit()


# Testing deleting CANs
def test_can_delete(budget_team_auth_client, mocker, unadded_can, app_ctx):
    test_can_id = 517

    mocker_delete_can = mocker.patch("ops_api.ops.services.cans.CANService.delete")
    response = budget_team_auth_client.delete(f"/api/v1/cans/{test_can_id}")

    assert response.status_code == 200
    mocker_delete_can.assert_called_once_with(test_can_id)
    assert response.json["message"] == "CAN deleted"
    assert response.json["id"] == test_can_id


def test_can_delete_404(budget_team_auth_client, app_ctx):
    test_can_id = 1

    response = budget_team_auth_client.delete(f"/api/v1/cans/{test_can_id}")

    assert response.status_code == 404


def test_basic_user_cannot_delete_cans(basic_user_auth_client, app_ctx):
    response = basic_user_auth_client.delete("/api/v1/cans/517")

    assert response.status_code == 403


def test_service_delete_can(loaded_db):

    test_data = {
        "portfolio_id": 6,
        "number": "G998235",
        "description": "Test CAN Created by unit test",
    }

    can_service = CANService()

    new_can = can_service.create(test_data)

    can_service.delete(new_can.id)

    stmt = select(CAN).where(CAN.id == new_can.id)
    can = loaded_db.scalar(stmt)

    assert can is None


def test_can_active_years_one_year_can(loaded_db):
    can = CAN(
        portfolio_id=1,
        number="G99TEST1",
        funding_details=CANFundingDetails(fiscal_year=2022, fund_code="AAXXXX20221DAD"),
    )
    loaded_db.add(can)
    loaded_db.commit()

    assert can.active_years == [2022]

    loaded_db.delete(can)
    loaded_db.commit()


def test_can_active_years_five_year_can(loaded_db):
    can = CAN(
        portfolio_id=1,
        number="G99TEST1",
        funding_details=CANFundingDetails(fiscal_year=2022, fund_code="AAXXXX20225DAD"),
    )
    loaded_db.add(can)
    loaded_db.commit()

    assert can.active_years == [2022, 2023, 2024, 2025, 2026]

    loaded_db.delete(can)
    loaded_db.commit()


def test_can_active_years_zero_year_can(loaded_db):
    can = CAN(
        portfolio_id=1,
        number="G99TEST1",
        funding_details=CANFundingDetails(fiscal_year=2022, fund_code="AAXXXX20220DAD"),
    )
    loaded_db.add(can)
    loaded_db.commit()

    assert can.active_years == [
        2022,
        2023,
        2024,
        2025,
        2026,
        2027,
        2028,
        2029,
        2030,
        2031,
    ]

    loaded_db.delete(can)
    loaded_db.commit()


# ============================================================================
# Testing CAN Filters
# ============================================================================


# Testing Active Period Filter
def test_can_get_list_filter_by_active_period(auth_client, loaded_db, app_ctx):
    """Test filtering CANs by active period"""
    response = auth_client.get("/api/v1/cans/?active_period=1")
    assert response.status_code == 200
    assert "data" in response.json

    # Verify all returned CANs have active_period == 1
    for can in response.json["data"]:
        assert can["active_period"] == 1


def test_can_get_list_filter_by_multiple_active_periods(auth_client, loaded_db, app_ctx):
    """Test filtering CANs by multiple active period values"""
    response = auth_client.get("/api/v1/cans/?active_period=1&active_period=5")
    assert response.status_code == 200
    assert "data" in response.json

    # Verify all returned CANs have active_period in [1, 5]
    for can in response.json["data"]:
        assert can["active_period"] in [1, 5]


def test_service_filter_by_active_period(loaded_db):
    """Test service layer filtering by active period"""
    can_service = CANService()

    # Filter by active period 1
    cans, metadata = can_service.get_list(active_period=[1])
    assert len(cans) > 0
    for can in cans:
        assert can.active_period == 1

    # Filter by multiple active periods
    cans, metadata = can_service.get_list(active_period=[1, 5])
    assert len(cans) > 0
    for can in cans:
        assert can.active_period in [1, 5]


# Testing Transfer Method Filter
def test_can_get_list_filter_by_transfer_method(auth_client, loaded_db, app_ctx):
    """Test filtering CANs by transfer method"""
    response = auth_client.get("/api/v1/cans/?transfer=DIRECT")
    assert response.status_code == 200
    assert "data" in response.json

    # Verify all returned CANs have the correct transfer method
    for can in response.json["data"]:
        if can.get("funding_details"):
            assert can["funding_details"]["method_of_transfer"] == "DIRECT"


def test_service_filter_by_transfer_method(loaded_db):
    """Test service layer filtering by transfer method"""
    can_service = CANService()

    # Filter by DIRECT transfer method
    cans, metadata = can_service.get_list(transfer=["DIRECT"])
    for can in cans:
        if can.funding_details:
            assert can.funding_details.method_of_transfer.name == "DIRECT"


# Testing Portfolio Filter
def test_can_get_list_filter_by_portfolio(auth_client, loaded_db, app_ctx):
    """Test filtering CANs by portfolio abbreviation"""
    response = auth_client.get("/api/v1/cans/?portfolio=HMRF")
    assert response.status_code == 200
    assert "data" in response.json

    # Verify all returned CANs belong to the HMRF portfolio
    for can in response.json["data"]:
        if can.get("portfolio"):
            assert can["portfolio"]["abbreviation"] == "HMRF"


def test_service_filter_by_portfolio(loaded_db):
    """Test service layer filtering by portfolio"""
    can_service = CANService()

    # Filter by portfolio abbreviation
    cans, metadata = can_service.get_list(portfolio=["HMRF"])
    for can in cans:
        if can.portfolio:
            assert can.portfolio.abbreviation == "HMRF"

    # Filter by multiple portfolios
    cans, metadata = can_service.get_list(portfolio=["HMRF", "IA"])
    for can in cans:
        if can.portfolio:
            assert can.portfolio.abbreviation in ["HMRF", "IA"]


# Testing Budget Range Filter
def test_can_get_list_filter_by_budget_min(auth_client, loaded_db, app_ctx):
    """Test filtering CANs by minimum budget"""
    min_budget = 100000.0
    response = auth_client.get(f"/api/v1/cans/?budget_min={min_budget}&fiscal_year=2023")
    assert response.status_code == 200
    assert "data" in response.json


def test_can_get_list_filter_by_budget_max(auth_client, loaded_db, app_ctx):
    """Test filtering CANs by maximum budget"""
    max_budget = 500000.0
    response = auth_client.get(f"/api/v1/cans/?budget_max={max_budget}&fiscal_year=2023")
    assert response.status_code == 200
    assert "data" in response.json


def test_can_get_list_filter_by_budget_range(auth_client, loaded_db, app_ctx):
    """Test filtering CANs by budget range"""
    min_budget = 100000.0
    max_budget = 500000.0
    response = auth_client.get(f"/api/v1/cans/?budget_min={min_budget}&budget_max={max_budget}&fiscal_year=2023")
    assert response.status_code == 200
    assert "data" in response.json


def test_service_filter_by_budget_range(loaded_db):
    """Test service layer filtering by budget range"""
    can_service = CANService()

    # Filter by minimum budget
    cans, metadata = can_service.get_list(fiscal_year=[2023], budget_min=[100000.0])
    # All returned CANs should have at least one budget >= 100000 for fiscal year 2023
    for can in cans:
        budgets = [fb.budget for fb in can.funding_budgets if fb.fiscal_year == 2023 and fb.budget]
        assert any(b >= 100000.0 for b in budgets)

    # Filter by budget range
    cans, metadata = can_service.get_list(fiscal_year=[2023], budget_min=[100000.0], budget_max=[500000.0])
    for can in cans:
        budgets = [fb.budget for fb in can.funding_budgets if fb.fiscal_year == 2023 and fb.budget]
        # At least one budget should be in range
        assert any(100000.0 <= b <= 500000.0 for b in budgets)


def test_service_filter_by_budget_no_fiscal_year_required(loaded_db):
    """Test that budget filters work when fiscal_year is not provided"""
    can_service = CANService()

    # Filter by active_period without fiscal year
    cans, _ = can_service.get_list(active_period=[1])
    assert len(cans) > 0

    # Filter by budget_min without fiscal year
    # Should return no results as fiscal year is required for budget filtering
    cans, _ = can_service.get_list(budget_min=[0])
    assert len(cans) == 0


# Testing Combined Filters
def test_can_get_list_combined_filters(auth_client, loaded_db, app_ctx):
    """Test combining multiple filters together"""
    response = auth_client.get("/api/v1/cans/?fiscal_year=2023&active_period=1&portfolio=HMRF")
    assert response.status_code == 200
    assert "data" in response.json

    for can in response.json["data"]:
        assert can["active_period"] == 1
        if can.get("portfolio"):
            assert can["portfolio"]["abbreviation"] == "HMRF"


def test_service_combined_filters(loaded_db):
    """Test service layer with multiple filters combined"""
    can_service = CANService()

    cans, metadata = can_service.get_list(fiscal_year=[2023], active_period=[1], portfolio=["HMRF"])

    for can in cans:
        assert can.active_period == 1
        if can.portfolio:
            assert can.portfolio.abbreviation == "HMRF"


# Testing Filters with Pagination
def test_can_get_list_filters_with_pagination(auth_client, loaded_db, app_ctx):
    """Test that filters work correctly with pagination"""
    # Get filtered results with pagination
    response = auth_client.get("/api/v1/cans/?active_period=1&limit=5&offset=0")
    assert response.status_code == 200
    assert "data" in response.json
    assert "count" in response.json
    assert response.json["limit"] == 5
    assert response.json["offset"] == 0
    assert len(response.json["data"]) <= 5

    # Verify all results match filter
    for can in response.json["data"]:
        assert can["active_period"] == 1


def test_service_filters_with_pagination(loaded_db):
    """Test service layer filters with pagination"""
    can_service = CANService()

    # Filter with pagination
    cans, metadata = can_service.get_list(active_period=[1], limit=[5], offset=[0])

    assert len(cans) <= 5
    assert metadata["limit"] == 5
    assert metadata["offset"] == 0
    for can in cans:
        assert can.active_period == 1


# Testing Empty Filter Results
def test_can_get_list_filter_no_results(auth_client, loaded_db, app_ctx):
    """Test filters that return no results"""
    response = auth_client.get("/api/v1/cans/?budget_min=999999999&fiscal_year=2023")
    assert response.status_code == 200
    assert "data" in response.json
    assert len(response.json["data"]) == 0
    assert response.json["count"] == 0


def test_service_filter_no_results(loaded_db):
    """Test service layer filter that returns no results"""
    can_service = CANService()

    cans, metadata = can_service.get_list(fiscal_year=[2023], budget_min=[999999999.0])

    assert len(cans) == 0
    assert metadata["count"] == 0
