import logging.config
import os
from typing import Any, Optional

from flask import Blueprint, Flask
from flask_cors import CORS
from ops_api.ops.db import db
from ops_api.ops.home_page.views import home
from ops_api.ops.urls import register_api
from ops_api.ops.utils.auth import jwtMgr, oauth


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
    configure_logging()  # should be configured before any access to app.logger
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

    api_bp = Blueprint(
        "api", __name__, url_prefix=f"/api/{app.config.get('API_VERSION', 'v1')}"
    )
    register_api(api_bp)
    app.register_blueprint(api_bp)

    jwtMgr.init_app(app)
    db.init_app(app)
    oauth.init_app(app)

    # Add some basic data to test with
    # TODO change this out for a proper fixture.
    with app.app_context():
        db.create_all()
        db.session.commit()

    return app
