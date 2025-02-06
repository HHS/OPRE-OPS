import os
import sys
import time

from authlib.integrations.flask_client import OAuth
from flask import Blueprint, Flask, current_app, request
from flask_cors import CORS
from flask_jwt_extended import current_user, verify_jwt_in_request
from loguru import logger
from sqlalchemy import event
from sqlalchemy.orm import Session

from models import OpsEventType
from models.utils import track_db_history_after, track_db_history_before, track_db_history_catch_errors
from ops_api.ops.auth.decorators import check_user_session_function
from ops_api.ops.auth.extension_config import jwtMgr
from ops_api.ops.db import handle_create_update_by_attrs, init_db
from ops_api.ops.error_handlers import register_error_handlers
from ops_api.ops.home_page.views import home
from ops_api.ops.services.can_messages import can_history_trigger
from ops_api.ops.services.message_bus import MessageBus
from ops_api.ops.urls import register_api
from ops_api.ops.utils.core import is_fake_user, is_unit_test

# Set the timezone to UTC
os.environ["TZ"] = "UTC"
time.tzset()


def create_app() -> Flask:  # noqa: C901
    from ops_api.ops.utils.core import is_unit_test

    log_level = "INFO" if not is_unit_test() else "DEBUG"

    # logger configuration
    format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    logger.add(sys.stdout, format=format, level=log_level)
    logger.add(sys.stderr, format=format, level=log_level)

    app = Flask(__name__)

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

    db_session, engine = init_db(app.config.get("SQLALCHEMY_DATABASE_URI"))
    app.db_session = db_session
    app.engine = engine

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        app.db_session.remove()

    @app.teardown_request
    def teardown_request(exception=None):
        if hasattr(request, "message_bus"):
            request.message_bus.handle()
            request.message_bus.cleanup()

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

    @app.before_request
    def before_request():
        before_request_function(app, request)

    @app.after_request
    def after_request(response):
        log_response(response)
        return response

    register_error_handlers(app)

    return app


def log_response(response):
    if request.url != request.url_root:
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


def before_request_function(app: Flask, request: request):
    log_request()
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
    if request.endpoint in all_valid_endpoints and request.method not in ["OPTIONS", "HEAD"]:
        verify_jwt_in_request()  # needed to load current_user
        if not is_unit_test() and not is_fake_user(app, current_user):
            current_app.logger.info(f"Checking user session for {current_user.oidc_id}")
            check_user_session_function(current_user)

    request.message_bus = MessageBus()
    request.message_bus.subscribe(OpsEventType.CREATE_NEW_CAN, can_history_trigger)
    request.message_bus.subscribe(OpsEventType.UPDATE_CAN, can_history_trigger)
    request.message_bus.subscribe(OpsEventType.CREATE_CAN_FUNDING_BUDGET, can_history_trigger)
    request.message_bus.subscribe(OpsEventType.UPDATE_CAN_FUNDING_BUDGET, can_history_trigger)
    request.message_bus.subscribe(OpsEventType.CREATE_CAN_FUNDING_RECEIVED, can_history_trigger)
    request.message_bus.subscribe(OpsEventType.UPDATE_CAN_FUNDING_RECEIVED, can_history_trigger)
    request.message_bus.subscribe(OpsEventType.DELETE_CAN_FUNDING_RECEIVED, can_history_trigger)
