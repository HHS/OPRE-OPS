import asyncio
import re

from flask import Response, current_app, jsonify
from flask.views import MethodView
from ops_api.ops.utils.health_check import check_all
from ops_api.ops.utils.response import make_response_with_headers


class HealthCheckAPI(MethodView):
    def get(self) -> Response:
        checks = asyncio.run(check_all())
        max_alarm_level = max(checks.values(), key=lambda obj: obj["alarm_level"])["alarm_level"]
        status = "OK" if max_alarm_level == 0 else "BAD" if max_alarm_level > 1 else "Maybe problems"

        config = {
            "db_connection_string": re.sub(
                "(?<=:)[^.]+(?=@)", "//---REDACTED---", current_app.config["SQLALCHEMY_DATABASE_URI"]
            ),
            "authlib_clients": current_app.config["AUTHLIB_OAUTH_CLIENTS"],
            "DEBUG": current_app.config["DEBUG"],
        }
        response = jsonify(
            {
                "status": status,
                "alarm_level": max_alarm_level,
                "checks": checks,
                "config": config,
            }
        )
        make_response_with_headers(response)
        return response
