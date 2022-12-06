import logging.config
import os
from typing import Optional

from flask import Blueprint
from flask import Flask
from flask_cors import CORS
import ops.auth.urls
from ops.auth.utils import jwtMgr
from ops.auth.utils import oauth
import ops.can.urls
from ops.home_page.views import home
import ops.portfolio.urls
import ops.summary.urls
from ops.urls import register_api
from ops.user.models import db
import ops.user.urls


def configure_logging() -> None:
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
            "root": {"level": "INFO", "handlers": ["wsgi"]},
        }
    )


def create_app(config_overrides: Optional[dict] = None) -> Flask:
    configure_logging()  # should be configured before any access to app.logger
    app = Flask(__name__)
    CORS(app)
    app.config.from_object("ops.environment.default_settings")
    if os.getenv("OPS_CONFIG"):
        app.config.from_envvar("OPS_CONFIG")
    app.config.from_prefixed_env()

    if config_overrides is not None:
        app.config.from_mapping(config_overrides)

    app.register_blueprint(ops.auth.urls.bp)
    app.register_blueprint(ops.can.urls.bp)
    app.register_blueprint(ops.portfolio.urls.bp_portfolio)
    app.register_blueprint(ops.portfolio.urls.bp_portfolio_status)
    app.register_blueprint(ops.portfolio.urls.bp_division)
    app.register_blueprint(ops.user.urls.bp)
    app.register_blueprint(ops.summary.urls.bp)
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
        db.drop_all()
        db.create_all()
        db.session.commit()

    return app
