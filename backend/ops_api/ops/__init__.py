import logging.config
import os
from typing import Any, Optional

from flask import Blueprint, Flask
from flask_cors import CORS
from sqlalchemy import event
from sqlalchemy.orm import Session

from ops_api.ops.auth.auth import jwtMgr, oauth
from ops_api.ops.db import handle_create_update_by_attrs, init_db
from ops_api.ops.history import track_db_history_after, track_db_history_before, track_db_history_catch_errors
from ops_api.ops.home_page.views import home
from ops_api.ops.urls import register_api


def configure_logging(log_level: str = "INFO") -> None:
    logging.config.dictConfig(
        {
            "version": 1,
            "formatters": {
                "default": {
                    "format": "[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
                }
            },
            "handlers": {
                "wsgi": {
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                    "formatter": "default",
                }
            },
            "root": {"level": f"{log_level}", "handlers": ["wsgi"]},
        }
    )


def create_app(config_overrides: Optional[dict[str, Any]] = None) -> Flask:
    is_unit_test = False if config_overrides is None else config_overrides.get("TESTING") is True
    log_level = "INFO" if not is_unit_test else "DEBUG"
    configure_logging(log_level)  # should be configured before any access to app.logger
    app = Flask(__name__)

    app.config.from_object("ops_api.ops.environment.default_settings")
    if os.getenv("OPS_CONFIG"):
        app.config.from_envvar("OPS_CONFIG")
    app.config.from_prefixed_env()  # type: ignore [attr-defined]

    # manually setting the public key path here, until we know where it will live longterm
    app.config.setdefault(
        "JWT_PUBLIC_KEY",
        app.open_resource(app.config.get("JWT_PUBLIC_KEY_PATH")).read(),
    )
    # fall back for pytest to use
    app.config.setdefault(
        "SQLALCHEMY_DATABASE_URI",
        "postgresql+psycopg2://ops:ops@localhost:5432/postgres",
    )

    if config_overrides is not None:
        app.config.from_mapping(config_overrides)

    api_version = app.config.get("API_VERSION", "v1")

    cors_resources = {
        r"/api/*": {
            "origins": app.config.get("OPS_FRONTEND_URL"),
            "supports_credentials": True,
        }
    }
    CORS(app, resources=cors_resources)

    app.register_blueprint(home)

    from ops_api.ops.auth import bp as auth_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")

    api_bp = Blueprint("api", __name__, url_prefix=f"/api/{api_version}")
    register_api(api_bp)
    app.register_blueprint(api_bp)

    jwtMgr.init_app(app)
    oauth.init_app(app)

    db_session, engine = init_db(app.config.get("SQLALCHEMY_DATABASE_URI"))
    app.db_session = db_session
    app.engine = engine

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        app.db_session.remove()

    @event.listens_for(db_session, "before_commit")
    def receive_before_commit(session: Session):
        track_db_history_before(session)

    @event.listens_for(db_session, "after_flush")
    def receive_after_flush(session: Session, flush_context):
        track_db_history_after(session)

    @event.listens_for(engine, "handle_error")
    def receive_error(exception_context):
        track_db_history_catch_errors(exception_context)

    @event.listens_for(db_session, "before_commit")
    def update_create_update_by(session: Session):
        handle_create_update_by_attrs(session)

    return app
