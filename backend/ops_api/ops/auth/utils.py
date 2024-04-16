from functools import wraps

from flask import current_app
from marshmallow import ValidationError
from sqlalchemy.exc import PendingRollbackError

from ops_api.ops.auth.authentication_gateway import NotActiveUserError
from ops_api.ops.utils.response import make_response_with_headers


def handle_api_error(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except (KeyError, RuntimeError, PendingRollbackError) as er:
            current_app.logger.error(er)
            return make_response_with_headers({}, 400)
        except ValidationError as ve:
            current_app.logger.error(ve)
            return make_response_with_headers(ve.normalized_messages(), 400)
        except NotActiveUserError as e:
            current_app.logger.error(e)
            return make_response_with_headers({}, 403)
        except Exception as e:
            current_app.logger.exception(e)
            return make_response_with_headers({}, 500)

    return decorated
