from sqlalchemy.exc import PendingRollbackError
from werkzeug.exceptions import BadRequest, Forbidden, NotFound

from marshmallow import ValidationError
from ops_api.ops.auth.auth_types import LoginErrorResponse, LoginErrorResponseSchema, LoginErrorTypes
from ops_api.ops.auth.exceptions import (
    AuthenticationError,
    ExtraCheckError,
    InvalidUserSessionError,
    NoAuthorizationError,
    NoUserFoundError,
    PrivateKeyError,
    UserInactiveError,
    UserLockedError,
)
from ops_api.ops.services.ops_service import (
    AuthorizationError,
    DatabaseError,
    DuplicateResourceError,
    ResourceNotFoundError,
)
from ops_api.ops.services.ops_service import ValidationError as ServiceValidationError
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
        return make_response_with_headers(e.normalized_messages(), 400)

    @app.errorhandler(NotFound)
    def handle_exception_not_found(e):
        """
        Handle exception when the requested resource is not found, e.g. the resource id doesn't exist
        """
        return make_response_with_headers({}, 404)

    @app.errorhandler(Forbidden)
    def handle_exception_forbidden(e):
        """
        Handle exception when the user is not authorized to access the resource.
        """
        return make_response_with_headers({}, 403)

    @app.errorhandler(BadRequest)
    def handle_exception_bad_request(e):
        """
        Handle exception when the request is malformed or invalid

        Deprecated - better to use marshmallow validation error
        """
        return make_response_with_headers({}, 400)

    @app.errorhandler(Exception)
    def handle_exception(e):
        """
        Handle generic exception - catch all
        """
        app.logger.exception(e)
        return make_response_with_headers({}, 500)

    @app.errorhandler(ResourceNotFoundError)
    def handle_resource_not_found_error(e):
        return make_response_with_headers({"message": e.message, "details": e.details}, 404)

    @app.errorhandler(ServiceValidationError)
    def handle_validation_error(e):
        return make_response_with_headers({"message": e.message, "errors": e.validation_errors}, 400)

    @app.errorhandler(DuplicateResourceError)
    def handle_duplicate_resource_error(e):
        app.logger.exception(e)
        return make_response_with_headers({"message": e.message, "details": e.details}, 409)

    @app.errorhandler(DatabaseError)
    def handle_database_error(e):
        app.logger.exception(e)
        return make_response_with_headers({"message": e.message}, 500)

    @app.errorhandler(AuthorizationError)
    def handle_authorization_error(e):
        return make_response_with_headers({"message": e.message}, 403)

    @app.errorhandler(UserInactiveError)
    def handle_auth_exception_user_inactive_error(e):
        """
        Handle exception when the user is INACTIVE.
        """
        response_data = LoginErrorResponse(
            error_type=LoginErrorTypes.USER_INACTIVE,
            message="The user is INACTIVE. Please contact the system administrator.",
        )
        schema = LoginErrorResponseSchema()
        return make_response_with_headers(schema.dump(response_data), 401)

    @app.errorhandler(UserLockedError)
    def handle_auth_exception_user_locked_error(e):
        """
        Handle exception when the user is LOCKED.
        """
        response_data = LoginErrorResponse(
            error_type=LoginErrorTypes.USER_LOCKED,
            message="The user is LOCKED. Please contact the system administrator.",
        )
        schema = LoginErrorResponseSchema()
        return make_response_with_headers(schema.dump(response_data), 401)

    @app.errorhandler(ExtraCheckError)
    def handle_auth_exception_extra_check_error(e):
        """
        Handle exception when ExtraCheckError is raised (authz error).
        """
        response_data = LoginErrorResponse(
            error_type=LoginErrorTypes.AUTHN_ERROR,
            message="An unknown error occurred during login. Please contact the system administrator.",
        )
        schema = LoginErrorResponseSchema()
        return make_response_with_headers(schema.dump(response_data), 401)

    @app.errorhandler(PrivateKeyError)
    def handle_auth_exception_private_key_error(e):
        """
        Handle exception when PrivateKeyError is raised (auth provider error).
        """
        response_data = LoginErrorResponse(
            error_type=LoginErrorTypes.PROVIDER_ERROR,
            message="There was an error with the authentication provider. Please contact the system administrator.",
        )
        schema = LoginErrorResponseSchema()
        return make_response_with_headers(schema.dump(response_data), 401)

    @app.errorhandler(AuthenticationError)
    def handle_auth_exception_authentication_error(e):
        """
        Handle exception when AuthenticationError is raised (authn error).
        """
        response_data = LoginErrorResponse(
            error_type=LoginErrorTypes.AUTHN_ERROR,
            message="There was an error with authentication. Please contact the system administrator.",
        )
        schema = LoginErrorResponseSchema()
        return make_response_with_headers(schema.dump(response_data), 401)

    @app.errorhandler(InvalidUserSessionError)
    def handle_auth_exception_invalid_user_session_error(e):
        """
        Handle exception when InvalidUserSessionError is raised (authz error).
        """
        response_data = LoginErrorResponse(
            error_type=LoginErrorTypes.AUTHN_ERROR,
            message="The user session is invalid or has expired. Please log in again.",
        )
        schema = LoginErrorResponseSchema()
        return make_response_with_headers(schema.dump(response_data), 401)

    @app.errorhandler(NoAuthorizationError)
    def handle_auth_exception_no_authorization_error(e):
        """
        Handle exception when NoAuthorizationError is raised (missing auth header).
        """
        response_data = LoginErrorResponse(
            error_type=LoginErrorTypes.AUTHN_ERROR,
            message="The request is not authorized. Please log in again.",
        )
        schema = LoginErrorResponseSchema()
        return make_response_with_headers(schema.dump(response_data), 401)

    @app.errorhandler(NoUserFoundError)
    def handle_no_user_found_error(e):
        """
        Handle exception when the user is not found.
        """
        response_data = LoginErrorResponse(
            error_type=LoginErrorTypes.USER_NOT_FOUND,
            message="No user found. Please contact the system administrator.",
        )
        schema = LoginErrorResponseSchema()
        return make_response_with_headers(schema.dump(response_data), 401)
