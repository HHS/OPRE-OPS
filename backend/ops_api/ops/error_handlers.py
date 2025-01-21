from flask_jwt_extended.exceptions import NoAuthorizationError
from sqlalchemy.exc import PendingRollbackError
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from marshmallow import ValidationError
from ops_api.ops.auth.exceptions import AuthenticationError, InvalidUserSessionError, NotActiveUserError
from ops_api.ops.utils.response import make_response_with_headers


def register_error_handlers(app):  # noqa: C901
    @app.errorhandler(RuntimeError)
    def handle_exception_runtime_error(e):
        """
        Handle generic runtime error

        Deprecated - better to use custom exceptions for the specific error
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(PendingRollbackError)
    def handle_exception_pending_rollback_error(e):
        """
        This error is raised when a transaction is rolled back usually due to a DB error

        Deprecated - these errors should be handled in the API layer or in the service layer and not the data layer.
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(ValidationError)
    def handle_exception_validation_error(e):
        """
        Handle validation error from marshmallow
        """
        app.logger.exception(e)
        return make_response_with_headers(e.normalized_messages(), 400)

    @app.errorhandler(NotActiveUserError)
    def handle_exception_not_active_user_error(e):
        """
        Handle exception when the user is not active
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 401)

    @app.errorhandler(InvalidUserSessionError)
    def handle_exception_invalid_user_session_error(e):
        """
        Handle exception when the user session is invalid or doesn't exist
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 401)

    @app.errorhandler(NoAuthorizationError)
    def handle_exception_no_authorization_error(e):
        """
        Handle exception when the HTTP request is missing the Authorization header
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 401)

    @app.errorhandler(AuthenticationError)
    def handle_exception_authentication_error(e):
        """
        Handle exception during login or authentication when the auth code is invalid.
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(NotFound)
    def handle_exception_not_found(e):
        """
        Handle exception when the requested resource is not found, e.g. the resource id doesn't exist
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 404)

    @app.errorhandler(Forbidden)
    def handle_exception_forbidden(e):
        """
        Handle exception when the user is not authorized to access the resource.
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 403)

    @app.errorhandler(BadRequest)
    def handle_exception_bad_request(e):
        """
        Handle exception when the request is malformed or invalid

        Deprecated - better to use marshmallow validation error
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 400)

    @app.errorhandler(Exception)
    def handle_exception(e):
        """
        Handle generic exception - catch all
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 500)
