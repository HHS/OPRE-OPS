from __future__ import annotations

from flask import Response, make_response


def make_response_with_headers(data: str | dict | list | None = None, status_code: int = 200) -> Response:
    response = make_response(data, status_code)  # nosemgrep
    # This function may be useless now, as setting anything CORS related manually seems
    # to breatk the flask-cors extension. ACAO is set /__init__.py now.
    # Will evaluate the continued need of this then refactor.
    # response.headers.add("Access-Control-Allow-Origin", current_app.config.get("OPS_FRONTEND_URL"))
    return response
