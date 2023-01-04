from functools import wraps
import json
import logging
import os
import sys

from flask import request
from flask_jwt_extended import jwt_required
import requests

logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)
opa_url = os.getenv("OPA_ADDR", "http://opal_client:8181")
# opa_url = current_app.config["OPA_URL"]
policy_path = os.getenv("OPA_PATH", "v1/data/httpapi/authz")
url = "http://opal_client:8181/v1/data/httpapi/authz"


def policy_check(policy: str):
    """
    Performs a policy check by hitting the OPA Endpoint
    """

    @jwt_required
    def _policy_check(f):
        @wraps(f)
        def __policy_check(*args, **kwargs):
            # Call the policy enpoint
            # {url}/policy/authz
            allowed = check_auth(policy, request.method, request.path, None)
            return f(allowed, *args, **kwargs)

        return __policy_check

    return _policy_check


def get_token() -> str:
    auth_header = request.headers.get("Authorization")
    logging.info(f"Auth-Header: {auth_header}")
    if auth_header:
        auth_token = auth_header.split(" ")[1]
    else:
        auth_token = None
    return auth_token


def check_auth(
    policy_path: str, method: str, url_as_array: list[str], user_id: str
) -> bool:
    input_dict = {
        "input": {
            "path": url_as_array,
            "method": method,
            "user_id": user_id,
        }
    }
    token = get_token()
    logging.debug(f"Token: {token}")
    if token is not None:
        input_dict["input"]["token"] = token

    logging.info("Checking auth...")
    logging.info(f"OPA Input: { json.dumps(input_dict, indent=2) }")
    try:
        rsp = requests.post(f"{opa_url}/{policy_path}", data=json.dumps(input_dict))
        logging.info(f"OPA Response: {rsp}")
    except Exception as err:
        logging.info(err)
        return {}
    j = rsp.json()
    if rsp.status_code >= 300:
        logging.info(
            f"Error checking auth, got status {j.status_code} and message: {j.text}"
        )
        return {}
    logging.info("Auth response:")
    logging.info(json.dumps(j, indent=2))

    allow = j["result"]["allow"]
    logging.debug(f"Auth Status: {allow}")
    return allow
