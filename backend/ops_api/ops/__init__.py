import logging.config
import os
from typing import Any, Optional

from flask import Blueprint, Flask
from flask_cors import CORS
from ops_api.ops.db import init_db
from ops_api.ops.history import track_db_history_before, track_db_history_catch_errors, track_db_history_after
from ops_api.ops.home_page.views import home
from ops_api.ops.urls import register_api
from ops_api.ops.utils.auth import jwtMgr, oauth
from sqlalchemy import event
from sqlalchemy.orm import Session


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


def create_app(config_overrides: Optional[dict[str, Any]] = {}) -> Flask:
    is_unit_test = config_overrides.get("TESTING") is True
    log_level = "INFO" if not is_unit_test else "DEBUG"
    configure_logging(log_level)  # should be configured before any access to app.logger
    app = Flask(__name__)
    CORS(app)
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
        "postgresql+psycopg2://postgres:local_password@localhost:5432/postgres",
    )

    if config_overrides is not None:
        app.config.from_mapping(config_overrides)

    app.register_blueprint(home)

    api_bp = Blueprint("api", __name__, url_prefix=f"/api/{app.config.get('API_VERSION', 'v1')}")
    register_api(api_bp)
    app.register_blueprint(api_bp)

    jwtMgr.init_app(app)
    oauth.init_app(app)

    db_session, engine = init_db(app.config.get("SQLALCHEMY_DATABASE_URI"), is_unit_test)
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

    return app
