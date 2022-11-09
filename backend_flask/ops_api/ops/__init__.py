import logging.config
from typing import Optional

from flask import Flask
from flask_cors import CORS
import ops.auth.urls
from ops.auth.utils import jwtMgr
from ops.auth.utils import oauth
from ops.can.models import CAN
from ops.can.models import FundingPartner
import ops.can.urls
from ops.portfolio.models import Portfolio
import ops.portfolio.urls
from ops.user.models import db
from ops.user.models import User
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

    app.config.from_object("ops.default_settings")
    app.config.from_prefixed_env()

    if config_overrides is not None:
        app.config.from_mapping(config_overrides)

    app.register_blueprint(ops.auth.urls.bp)
    app.register_blueprint(ops.can.urls.bp)
    app.register_blueprint(ops.portfolio.urls.bp)
    app.register_blueprint(ops.user.urls.bp)

    jwtMgr.init_app(app)
    db.init_app(app)
    oauth.init_app(app)

    # Add some basic data to test with
    # TODO change this out for a proper fixture.
    with app.app_context():
        db.drop_all()
        db.create_all()
        db.session.add(User(email="BWayne@gmail.com", username="batman"))
        db.session.add(User(email="aTan@gmail.com", username="panther"))
        db.session.add(User(email="whoyaknow@gmail.com", username="little_sapphire"))
        db.session.add(
            Portfolio(
                name="WRGB (CCE)",
                description="",
                status_id=1,
                current_fiscal_year_funding=814000,
            )
        )
        db.session.add(FundingPartner(name="Funder1", nickname="Funder1"))
        db.session.add(
            CAN(
                number="G99WRGB",
                description="Secondary Analyses Data On Child Care & Early Edu",
                purpose="Secondary Analyses of Child Care and Early Education Data (2022)",
                nickname="CCE",
                arrangement_type_id="1",
                authorizer_id=1,
                portfolio_id=1,
            )
        )
        db.session.commit()

    CORS(
        app,
        origins=[
            "http://localhost:3000",
            "https://*.app.cloud.gov",
            "https://*.fr.cloud.gov",
        ],
    )
    return app
