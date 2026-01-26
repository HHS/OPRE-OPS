from unittest.mock import Mock, patch

from flask import current_app


def test_get_health(client, app_ctx):
    """
    test /api/v1/health/ for several scenarios
    Currently, this could work without docker/db, but it's in the session
    already (from 'ops/conftest'). It does need the Flask app. If we end up
    creating a separate folder for Flask tests with no docker, then we could
    move this there.
    """

    # mock response for auth services check
    mock_auth_resp = Mock()
    mock_auth_resp.status_code = 200
    mock_auth_resp.json.return_value = {"key": "value"}

    with patch("requests.get") as mock_auth_get, patch.object(current_app.db_session, "execute") as mock_execute:
        mock_auth_get.return_value = mock_auth_resp

        # test with all checks are good
        response = client.get("/api/v1/health/")
        assert response.status_code == 200
        resp_json = response.json
        assert "status" in resp_json
        assert resp_json["status"] == "OK"
        assert "checks" in resp_json
        db_conn_is_ok = resp_json.get("checks", {}).get("database_connection", {}).get("db_conn_is_ok", None)
        assert db_conn_is_ok is True
        assert 0 == resp_json.get("checks", {}).get("auth_services", {}).get("alarm_level", None)
        assert 0 == resp_json.get("checks", {}).get("database_connection", {}).get("alarm_level", None)
        assert 0 == resp_json.get("alarm_level", None)

        # test with failure from db execution
        mock_execute.side_effect = Exception("Fake Error for session.execute")
        response = client.get("/api/v1/health/")
        resp_json = response.json
        db_conn_is_ok = resp_json.get("checks", {}).get("database_connection", {}).get("db_conn_is_ok", None)
        assert db_conn_is_ok is False
        assert 0 == resp_json.get("checks", {}).get("auth_services", {}).get("alarm_level", None)
        assert 2 == resp_json.get("checks", {}).get("database_connection", {}).get("alarm_level", None)
        assert 2 == resp_json.get("alarm_level", None)

        # test with failure from auth services check (and db OK)
        mock_auth_get.side_effect = Exception("Fake Error for auth GET")
        mock_execute.side_effect = None
        response = client.get("/api/v1/health/")
        resp_json = response.json
        assert 2 == resp_json.get("checks", {}).get("auth_services", {}).get("alarm_level", None)
        assert 0 == resp_json.get("checks", {}).get("database_connection", {}).get("alarm_level", None)
        assert 2 == resp_json.get("alarm_level", None)

        # test with failures from auth services check and db execution
        mock_auth_get.side_effect = Exception("Fake Error for auth GET")
        mock_execute.side_effect = Exception("Fake Error for session.execute")
        # also trip the pool stats exception (for coverage)
        with patch.object(current_app.engine.pool, "size") as mock_pool_size:
            mock_pool_size.side_effect = Exception("Fake Error for pool stats")
            response = client.get("/api/v1/health/")
            resp_json = response.json
            assert 2 == resp_json.get("checks", {}).get("auth_services", {}).get("alarm_level", None)
            assert 2 == resp_json.get("checks", {}).get("database_connection", {}).get("alarm_level", None)
            assert 2 == resp_json.get("alarm_level", None)
            assert "pool_status" not in resp_json.get("checks", {}).get("database_connection", {})

        # test alarm_level=1, example for maybe something less than failure,
        # but may be a problem
        mock_execute.side_effect = None
        mock_auth_get.side_effect = None
        mock_auth_resp.status_code = 418

        response = client.get("/api/v1/health/")
        resp_json = response.json
        assert 0 == resp_json.get("checks", {}).get("database_connection", {}).get("alarm_level", None)
        assert 1 == resp_json.get("checks", {}).get("auth_services", {}).get("alarm_level", None)
        assert 1 == resp_json.get("alarm_level", None)
        assert "pool_status" in resp_json.get("checks", {}).get("database_connection", {})
