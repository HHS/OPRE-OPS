from __future__ import annotations

from flask import Response, make_response


def make_response_with_headers(data: str | dict | list = None, status_code: int = 200) -> Response:
    response = make_response(data, status_code)  # nosemgrep
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response
