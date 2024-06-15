import asyncio

from flask import Response, current_app, jsonify
from flask.views import MethodView

from ops_api.ops.utils.health_check import check_all
from ops_api.ops.utils.response import make_response_with_headers


class HealthCheckAPI(MethodView):
    def get(self) -> Response:
        current_app.logger.debug("Health check request received")
        checks = asyncio.run(check_all())
        max_alarm_level = max(checks.values(), key=lambda obj: obj["alarm_level"])["alarm_level"]
        status = "OK" if max_alarm_level == 0 else "BAD" if max_alarm_level > 1 else "Maybe problems"
        response = jsonify({"status": status, "alarm_level": max_alarm_level, "checks": checks})
        make_response_with_headers(response)
        return response
