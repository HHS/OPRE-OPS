from sqlalchemy import select

from models.portfolios import PortfolioUrl
from ops_api.ops.services.portfolio_url import PortfolioUrlService
from ops_api.tests.utils import DummyContextManager


def test_portfolio_url_lookup(loaded_db, app_ctx):
    pUrl = loaded_db.get(PortfolioUrl, 1)
    assert pUrl is not None
    assert pUrl.url == "https://acf.gov/opre/topic/overview/abuse-neglect-adoption-foster-care"
    assert pUrl.portfolio_id == 1


def test_portfolio_url_creation():
    pUrl = PortfolioUrl(portfolio_id=2, url="https://acf.gov/opre/topic/head-start")
    assert pUrl.to_dict()["url"] == "https://acf.gov/opre/topic/head-start"


def test_portfolio_url_get_by_id(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/portfolios-url/1")
    assert response.status_code == 200
    assert response.json["url"] == "https://acf.gov/opre/topic/overview/abuse-neglect-adoption-foster-care"


def test_portfolio_url_get_by_id_404(auth_client, loaded_db, app_ctx):
    response = auth_client.get("/api/v1/portfolios-url/10000000")
    assert response.status_code == 404


def test_portfolio_url_get_all(auth_client, loaded_db, app_ctx):
    portfolio_urls = loaded_db.query(PortfolioUrl).count()

    response = auth_client.get("/api/v1/portfolios-url/")
    assert response.status_code == 200
    assert len(response.json) == portfolio_urls


def test_portfolio_url_post(budget_team_auth_client, mocker, loaded_db, app_ctx):
    input_data = {"portfolio_id": 10, "url": "https://acf.gov/opre/topic/overview/test"}
    mock_output_data = PortfolioUrl(portfolio_id=10, url="https://acf.gov/opre/topic/overview/test")

    mocker_create_portfolio_url = mocker.patch("ops_api.ops.services.portfolio_url.PortfolioUrlService.create")

    mocker_create_portfolio_url.return_value = mock_output_data
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    response = budget_team_auth_client.post("/api/v1/portfolios-url/", json=input_data)

    assert response.status_code == 201
    assert context_manager.metadata["new_portfolio_url"] is not None
    assert context_manager.metadata["new_portfolio_url"]["id"] == mock_output_data.id
    assert context_manager.metadata["new_portfolio_url"]["url"] == mock_output_data.url
    assert context_manager.metadata["new_portfolio_url"]["portfolio_id"] == mock_output_data.portfolio_id
    mocker_create_portfolio_url.assert_called_once_with(input_data)
    assert response.json["id"] == mock_output_data.id
    assert response.json["url"] == mock_output_data.url
    assert response.json["portfolio_id"] == mock_output_data.portfolio_id


def test_basic_user_cannot_post_portfolio_url(basic_user_auth_client, app_ctx):
    input_data = {"portfolio_id": 10, "url": "https://acf.gov/opre/topic/overview/test"}
    response = basic_user_auth_client.post("/api/v1/portfolios-url/", json=input_data)

    assert response.status_code == 403


def test_service_create_portfolio_url(loaded_db):
    input_data = {"portfolio_id": 10, "url": "https://acf.gov/opre/topic/overview/test"}
    service = PortfolioUrlService()

    new_portfolio_url = service.create(input_data)

    portfolio_url = loaded_db.execute(select(PortfolioUrl).where(PortfolioUrl.id == new_portfolio_url.id)).scalar_one()

    assert portfolio_url is not None
    assert portfolio_url.portfolio_id == 10
    assert portfolio_url.url == "https://acf.gov/opre/topic/overview/test"

    loaded_db.delete(new_portfolio_url)
    loaded_db.commit()


def test_portfolio_url_patch(budget_team_auth_client, mocker, app_ctx):
    test_portfolio_url_id = 10
    update_data = {
        "url": "https://acf.gov/opre/topic/overview/newtest",
    }

    old_portfolio_url = PortfolioUrl(portfolio_id=10, url="https://acf.gov/opre/topic/overview/test")
    portfolio_url = PortfolioUrl(portfolio_id=10, url="https://acf.gov/opre/topic/overview/newtest")

    mocker_update_portfolio_url = mocker.patch("ops_api.ops.services.portfolio_url.PortfolioUrlService.update")
    mocker_get_portfolio_url = mocker.patch("ops_api.ops.services.portfolio_url.PortfolioUrlService.get")

    mocker_get_portfolio_url.return_value = old_portfolio_url
    mocker_update_portfolio_url.return_value = portfolio_url
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")

    response = budget_team_auth_client.patch(f"/api/v1/portfolios-url/{test_portfolio_url_id}", json=update_data)
    assert context_manager.metadata["portfolio_url_updates"]["changes"] is not None
    changes = context_manager.metadata["portfolio_url_updates"]["changes"]
    assert len(changes.keys()) == 1
    assert changes["url"]["new_value"] == update_data["url"]
    assert changes["url"]["old_value"] == old_portfolio_url.url
    assert response.status_code == 200
    mocker_update_portfolio_url.assert_called_once_with(update_data, test_portfolio_url_id)
    assert response.json["url"] == portfolio_url.url


def test_portfolio_url_patch_404(budget_team_auth_client, app_ctx):
    test_portfolio_url_id = 999
    update_data = {
        "url": "https://acf.gov/opre/topic/overview/newtest",
    }

    response = budget_team_auth_client.patch(f"/api/v1/portfolios-url/{test_portfolio_url_id}", json=update_data)

    assert response.status_code == 404


def test_basic_user_cannot_patch_portfolio_url(basic_user_auth_client, app_ctx):
    data = {
        "url": "https://acf.gov/opre/topic/overview/newtest",
    }
    response = basic_user_auth_client.patch("/api/v1/portfolios-url/1", json=data)

    assert response.status_code == 403


def test_service_patch_portfolio_url(loaded_db):
    update_data = {
        "url": "https://acf.gov/opre/topic/overview/newtest",
    }

    input_data = {"portfolio_id": 10, "url": "https://acf.gov/opre/topic/overview/test"}

    portfolio_url_service = PortfolioUrlService()

    new_portfolio_url = portfolio_url_service.create(input_data)

    updated_portfolio_url_ = portfolio_url_service.update(update_data, new_portfolio_url.id)

    portfolio_url = loaded_db.execute(select(PortfolioUrl).where(PortfolioUrl.id == new_portfolio_url.id)).scalar_one()

    assert portfolio_url is not None
    assert updated_portfolio_url_.url == "https://acf.gov/opre/topic/overview/newtest"

    loaded_db.delete(new_portfolio_url)
    loaded_db.commit()


def test_portfolio_url_put(budget_team_auth_client, mocker, app_ctx):
    test_portfolio_url_id = 10
    update_data = {
        "portfolio_id": 11,
        "url": "https://acf.gov/opre/topic/overview/newtest",
    }

    old_portfolio_url = PortfolioUrl(portfolio_id=10, url="https://acf.gov/opre/topic/overview/test")
    portfolio_url = PortfolioUrl(portfolio_id=10, url="https://acf.gov/opre/topic/overview/newtest")

    mocker_update_portfolio_url = mocker.patch("ops_api.ops.services.portfolio_url.PortfolioUrlService.update")
    mocker_get_portfolio_url = mocker.patch("ops_api.ops.services.portfolio_url.PortfolioUrlService.get")

    mocker_get_portfolio_url.return_value = old_portfolio_url
    mocker_update_portfolio_url.return_value = portfolio_url
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")

    response = budget_team_auth_client.put(f"/api/v1/portfolios-url/{test_portfolio_url_id}", json=update_data)
    assert context_manager.metadata["portfolio_url_updates"]["changes"] is not None
    changes = context_manager.metadata["portfolio_url_updates"]["changes"]
    assert len(changes.keys()) == 1
    assert changes["url"]["new_value"] == update_data["url"]
    assert changes["url"]["old_value"] == old_portfolio_url.url
    assert response.status_code == 200
    mocker_update_portfolio_url.assert_called_once_with(update_data, test_portfolio_url_id)
    assert response.json["url"] == portfolio_url.url


def test_basic_user_cannot_put_portfolio_url(basic_user_auth_client, app_ctx):
    data = {
        "url": "https://acf.gov/opre/topic/overview/newtest",
    }
    response = basic_user_auth_client.put("/api/v1/portfolios-url/1", json=data)

    assert response.status_code == 403


def test_portfolio_url_put_404(budget_team_auth_client, app_ctx):
    test_funding_received_id = 600
    input_data = {"portfolio_id": 10, "url": "https://acf.gov/opre/topic/overview/test"}

    response = budget_team_auth_client.put(f"/api/v1/portfolios-url/{test_funding_received_id}", json=input_data)

    assert response.status_code == 404


def test_portfolio_url_delete(auth_client, mocker, test_budget_team_user, app_ctx):
    test_portfolio_url_id = 2

    response = auth_client.delete(f"/api/v1/portfolios-url/{test_portfolio_url_id}")

    assert response.status_code == 200


def test_portoflio_url_delete_404(budget_team_auth_client, mocker, app_ctx):
    test_portfolio_url_id = 600
    response = budget_team_auth_client.delete(f"/api/v1/portfolios-url{test_portfolio_url_id}")

    assert response.status_code == 404


def test_basic_user_cannot_delete_portfolio_url(basic_user_auth_client, mocker, app_ctx):
    response = basic_user_auth_client.delete("/api/v1/portfolios-url/1")
    context_manager = DummyContextManager()
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__enter__")
    mocker_ops_event_ctxt_mgr.return_value = context_manager
    mocker_ops_event_ctxt_mgr = mocker.patch("ops_api.ops.utils.events.OpsEventHandler.__exit__")
    assert response.status_code == 403


def test_service_delete_portfolio_url(loaded_db):
    portfolio_url_service = PortfolioUrlService()
    input_data = {"portfolio_id": 10, "url": "https://acf.gov/opre/topic/overview/test"}

    new_portfolio_url = portfolio_url_service.create(input_data)

    portfolio_url_service.delete(new_portfolio_url.id)

    stmt = select(PortfolioUrl).where(PortfolioUrl.id == new_portfolio_url.id)
    can = loaded_db.scalar(stmt)

    assert can is None
