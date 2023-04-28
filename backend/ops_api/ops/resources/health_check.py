from flask import Response, jsonify
from flask.views import MethodView


class HealthCheckAPI(MethodView):
    def get(self) -> Response:
        response = jsonify({"status": "OK"})
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
