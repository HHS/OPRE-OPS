from contextlib import suppress
from functools import wraps
from typing import Callable

from flask import Response, request

from ops_api.ops.utils.response import make_response_with_headers


def error_simulator(func: Callable[..., Response]) -> Callable[..., Response]:
    """Decorator to add an ability to simulate an error response through an endpoint.

    This makes a new query parameter `simulatedError` for the endpoint which kicks
    back an automatic error response. Allowable options are:

    * `/some/endpoint/?simulatedError=true` - returns an error with status of 500.
    * `/some/endpoint/?simulatedError=<int>` - returns an error with the given int as the status code.
    * `/some/endpoint/?simulatedError=false` - ignores this and endpoint works as normal.
      none, null, 0, or an empty string works as well.
    * set to any other value returns an error with status of 500.
    """

    @wraps(func)
    def wrapper(*args, **kwargs) -> Response:
        with suppress(KeyError):
            error_param = request.args["simulatedError"].casefold()
            status_code = 500
            match error_param:
                case "true":
                    pass
                case "false" | "" | "none" | "null" | "0":
                    raise KeyError  # break out of this and ignore it.
                case _:
                    with suppress(ValueError):
                        status_code = int(error_param)
            return make_response_with_headers({}, status_code)

        return func(*args, **kwargs)

    return wrapper
