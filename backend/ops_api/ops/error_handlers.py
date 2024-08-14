from flask_jwt_extended.exceptions import NoAuthorizationError
from marshmallow import ValidationError
from sqlalchemy.exc import PendingRollbackError
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from ops_api.ops.auth.exceptions import AuthenticationError, InvalidUserSessionError, NotActiveUserError
from ops_api.ops.utils.response import make_response_with_headers


def register_error_handlers(app):  # noqa: C901
    @app.errorhandler(KeyError)
    def handle_exception_key_error(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(RuntimeError)
    def handle_exception_runtime_error(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(PendingRollbackError)
    def handle_exception_pending_rollback_error(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(ValidationError)
    def handle_exception_validation_error(e):
        app.logger.exception(e)
        return make_response_with_headers(e.normalized_messages(), 400)

    @app.errorhandler(NotActiveUserError)
    def handle_exception_not_active_user_error(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 403)

    @app.errorhandler(InvalidUserSessionError)
    def handle_exception_invalid_user_session_error(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 403)

    @app.errorhandler(NoAuthorizationError)
    def handle_exception_no_authorization_error(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 401)

    @app.errorhandler(AuthenticationError)
    def handle_exception_authentication_error(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(NotFound)
    def handle_exception_not_found(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 404)

    @app.errorhandler(Forbidden)
    def handle_exception_forbidden(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 403)

    @app.errorhandler(BadRequest)
    def handle_exception_bad_request(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.exception(e)
        return make_response_with_headers({}, 500)
