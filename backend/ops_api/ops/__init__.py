import os
import sys
import time
import uuid
from contextvars import ContextVar
from urllib.parse import urlparse

from authlib.integrations.flask_client import OAuth
from flask import Blueprint, Flask, Request, request
from flask_cors import CORS
from flask_jwt_extended import current_user, verify_jwt_in_request
from loguru import logger
from sqlalchemy import event
from sqlalchemy.orm import Session

from models import OpsEventType
from models.utils import (
    track_db_history_after,
    track_db_history_before,
    track_db_history_catch_errors,
)
from ops_api.ops.auth.decorators import check_user_session_function
from ops_api.ops.auth.exceptions import NoAuthorizationError
from ops_api.ops.auth.extension_config import jwtMgr
from ops_api.ops.db import handle_create_update_by_attrs, init_db
from ops_api.ops.error_handlers import register_error_handlers
from ops_api.ops.events.procurement_tracker_events import procurement_tracker_trigger
from ops_api.ops.home_page.views import home
from ops_api.ops.services.agreement_messages import agreement_history_trigger
from ops_api.ops.services.can_messages import can_history_trigger
from ops_api.ops.services.message_bus import MessageBus
from ops_api.ops.urls import register_api
from ops_api.ops.utils.api_helpers import is_deployed_system
from ops_api.ops.utils.core import is_fake_user, is_unit_test

# Set the timezone to UTC
os.environ["TZ"] = "UTC"
time.tzset()

request_id: ContextVar[str] = ContextVar("request_id", default="")


def create_app() -> Flask:  # noqa: C901
    from ops_api.ops.utils.core import is_unit_test

    log_level = "INFO" if not is_unit_test() else "DEBUG"

    app = Flask(__name__)

    # logger configuration
    # Disable default Flask/Werkzeug logging
    import logging

    app.logger.handlers = []
    werkzeug_logger = logging.getLogger("werkzeug")
    werkzeug_logger.disabled = True

    format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<magenta>{extra[request_id]!s:->8}</magenta> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    logger.remove()
    logger.configure(extra={"request_id": "-" * 8})
    logger.add(sys.stdout, format=format, level=log_level)

    app.config.from_object("ops_api.ops.environment.default_settings")
    if os.getenv("OPS_CONFIG"):
        app.config.from_envvar("OPS_CONFIG")
    app.config.from_prefixed_env()  # type: ignore [attr-defined]

    # fall back for pytest to use
    app.config.setdefault(
        "SQLALCHEMY_DATABASE_URI",
        "postgresql+psycopg2://ops:ops@localhost:5432/postgres",
    )

    api_version = app.config.get("API_VERSION", "v1")

    cors_resources = {
        r"/api/*": {
            "origins": app.config.get("OPS_FRONTEND_URL"),
            "supports_credentials": True,
        },
        r"/auth/*": {
            "origins": app.config.get("OPS_FRONTEND_URL"),
            "supports_credentials": True,
        },
    }
    CORS(app, resources=cors_resources)

    app.register_blueprint(home)

    from ops_api.ops.auth import bp as auth_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")

    api_bp = Blueprint("api", __name__, url_prefix=f"/api/{api_version}")
    register_api(api_bp)
    app.register_blueprint(api_bp)

    jwtMgr.init_app(app)
    oauth = OAuth()
    oauth.init_app(app)

    db_session, engine = init_db(app.config)
    app.db_session = db_session
    app.engine = engine

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        app.db_session.remove()

    @app.teardown_request
    def teardown_request(exception=None):
        # Only handle message bus and commit if no exception occurred
        if not exception and hasattr(request, "message_bus"):
            # Check if any events were published before handling
            has_events = len(request.message_bus.published_events) > 0

            request.message_bus.handle()
            request.message_bus.cleanup()

            # Only commit if events were actually published and handled
            # This prevents unnecessary commits that could interfere with history tracking
            if has_events:
                try:
                    app.db_session.commit()
                except Exception as e:
                    logger.error(f"Failed to commit message bus changes: {e}", exc_info=True)
                    app.db_session.rollback()

    @event.listens_for(db_session, "before_commit")
    def receive_before_commit(session: Session):
        track_db_history_before(session, current_user)

    @event.listens_for(db_session, "after_flush")
    def receive_after_flush(session: Session, flush_context):
        track_db_history_after(session, current_user)

    @event.listens_for(engine, "handle_error")
    def receive_error(exception_context):
        track_db_history_catch_errors(exception_context)

    @event.listens_for(db_session, "before_commit")
    def update_create_update_by(session: Session):
        handle_create_update_by_attrs(session)

    # Initialize event subscriptions once at app startup
    initialize_event_subscriptions()

    @app.before_request
    def before_request():
        request_id.set(str(uuid.uuid4())[:8])
        before_request_function(app, request)

    @app.after_request
    def after_request(response):
        log_response(response)
        return response

    register_error_handlers(app)

    return app


def log_response(response):
    if request.url != request.url_root:
        req_id = request_id.get()
        with logger.contextualize(request_id=req_id):
            response_data = {
                "method": request.method,
                "url": request.url,
                "request_headers": request.headers,
                "status_code": response.status_code,
                "json": response.get_data(as_text=True),
                "response_headers": response.headers,
            }
            logger.info(f"Response: {response_data}")


def log_request():
    request_data = {
        "method": request.method,
        "url": request.url,
        "json": request.get_json(silent=True),
        "args": request.args,
        "headers": request.headers,
    }
    logger.info(f"Request: {request_data}")


def initialize_event_subscriptions():
    """
    Initialize all event subscriptions once at app startup.

    This function sets up signal subscriptions that are process-level
    and persist across all requests. Subscriptions are configured once during
    app initialization rather than per-request to avoid redundant setup.
    """
    # Subscribe to events that should generate CAN history events
    MessageBus.subscribe_globally(OpsEventType.CREATE_NEW_CAN, can_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.UPDATE_CAN, can_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.CREATE_CAN_FUNDING_BUDGET, can_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.UPDATE_CAN_FUNDING_BUDGET, can_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.CREATE_CAN_FUNDING_RECEIVED, can_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.UPDATE_CAN_FUNDING_RECEIVED, can_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.DELETE_CAN_FUNDING_RECEIVED, can_history_trigger)

    # Subscribe to events that should generate agreement history events
    MessageBus.subscribe_globally(OpsEventType.UPDATE_AGREEMENT, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.CREATE_BLI, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.UPDATE_BLI, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.DELETE_BLI, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.CREATE_NEW_AGREEMENT, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.CREATE_CHANGE_REQUEST, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.UPDATE_CHANGE_REQUEST, agreement_history_trigger)
    # Subscribe to UPDATE_CHANGE_REQUEST for procurement tracker creation
    MessageBus.subscribe_globally(OpsEventType.UPDATE_CHANGE_REQUEST, procurement_tracker_trigger)
    MessageBus.subscribe_globally(OpsEventType.UPDATE_PROCUREMENT_SHOP, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.CREATE_SERVICES_COMPONENT, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.UPDATE_SERVICES_COMPONENT, agreement_history_trigger)
    MessageBus.subscribe_globally(OpsEventType.DELETE_SERVICES_COMPONENT, agreement_history_trigger)


def before_request_function(app: Flask, request: request):
    req_id = request_id.get()
    logger.configure(extra={"request_id": req_id})
    log_request()

    # check the CSRF protection if the request.endpoint is not the api.health-check endpoint
    # and the request method is not OPTIONS or HEAD
    if request.endpoint != "api.health-check" and request.method not in [
        "OPTIONS",
        "HEAD",
    ]:
        check_csrf(app, request)

    # check that the UserSession is valid
    all_valid_endpoints = [
        rule.endpoint
        for rule in app.url_map.iter_rules()
        if rule.endpoint
        not in [
            "auth.login_post",
            "auth.logout_post",
            "auth.refresh_post",
            "home.show",
            "api.health-check",
        ]
    ]
    if request.endpoint in all_valid_endpoints and request.method not in [
        "OPTIONS",
        "HEAD",
    ]:
        verify_jwt_in_request()  # needed to load current_user
        if not is_unit_test() and not is_fake_user(app, current_user):
            logger.info(f"Checking user session for {current_user.oidc_id}")
            check_user_session_function(current_user)

    # Create a new MessageBus instance for this request
    # Event subscriptions are initialized once at app startup (see initialize_event_subscriptions)
    request.message_bus = MessageBus()


def check_csrf(app: Flask, flask_request: Request) -> None:
    """
    Check the CSRF protection for Azure production environment.

    N.B. We are not using a CSRF token here, but rather checking the Host and Referer headers for security.

    :param app: Flask application instance.
    :param flask_request: Flask request object.

    :raises NoAuthorizationError: If the request does not meet the CSRF protection requirements.
    """
    host = flask_request.headers.get("Host")
    referer = flask_request.headers.get("Referer")
    host_prefix = app.config.get("HOST_HEADER_PREFIX", "localhost")
    frontend_url = app.config.get("OPS_FRONTEND_URL")
    is_deployed = is_deployed_system(host_prefix)

    if not is_deployed:
        return

    if not referer:
        raise NoAuthorizationError("Missing Referer header.")

    referer_hostname = urlparse(referer).hostname
    frontend_hostname = urlparse(frontend_url).hostname if frontend_url else None
    if referer_hostname != frontend_hostname:
        raise NoAuthorizationError("Referer header hostname does not match OPS_FRONTEND_URL.")

    if not host:
        raise NoAuthorizationError("Missing Host header.")

    if not host.upper().startswith(host_prefix.upper()):
        raise NoAuthorizationError("Host header does not match HOST_HEADER_PREFIX.")

    if not host.endswith(":443"):
        raise NoAuthorizationError("Host header port must be 443 when running in Azure.")

    if urlparse(referer).scheme != "https":
        raise NoAuthorizationError("Referer header protocol must be https when running in Azure.")
