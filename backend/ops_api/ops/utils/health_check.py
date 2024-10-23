import asyncio
import logging

import requests
from flask import current_app
from sqlalchemy import text


async def check_auth_services() -> dict:
    """check the health of the OAuth server with a GET of the
    OAuth server_metadata_url
    Returns:
        dict: with alarm_level>0 if there is a problem
    """

    resp = {"status_code": None, "alarm_level": 0}
    try:
        authlib_client_config = current_app.config["AUTHLIB_OAUTH_CLIENTS"]["hhsams"]
        server_metadata_url = authlib_client_config["server_metadata_url"]
        r = requests.get(server_metadata_url, timeout=10)
        resp["status_code"] = r.status_code
        if r.status_code != 200:
            resp["alarm_level"] = 1
    except Exception as e:
        logging.error("Auth Services check failed: " + str(e), exc_info=True)
        resp["alarm_level"] = 2
    return resp


async def check_db_conn() -> dict:
    """check the DB by executing a test query
    Returns:
        dict: alarm_level>0 if there is a problem
    """
    resp = {"db_conn_is_ok": True, "alarm_level": 0}
    try:
        current_app.db_session.execute(
            text("SELECT 'OK';"),
            execution_options={"timeout": 5},  # just pool wait timeout ?
        )
    except Exception as e:
        logging.error("Database test query failed: " + str(e), exc_info=True)
        resp["db_conn_is_ok"] = False
        resp["alarm_level"] = 2
    try:
        pool = current_app.engine.pool
        pool_status = {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "overflow": pool.overflow(),
            "checked_out": pool.checkedout(),
        }
        resp["pool_status"] = pool_status
    except Exception as e:
        logging.error("Connection pool status failed: " + str(e), exc_info=True)
    return resp


async def check_all() -> dict:
    """run all checks (DB and Auth services)
    Returns:
        dict: a map of the responses from each check
    """
    auth, db_conn = await asyncio.gather(check_auth_services(), check_db_conn())
    checks = {"auth_services": auth, "database_connection": db_conn}
    return checks
