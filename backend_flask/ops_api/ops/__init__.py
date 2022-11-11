import logging.config
import os
from typing import Optional

from flask import Flask
from flask_cors import CORS
import ops.auth.urls
from ops.auth.utils import jwtMgr
from ops.auth.utils import oauth
from ops.can.models import BudgetLineItem
from ops.can.models import BudgetLineItemStatus
from ops.can.models import CAN
from ops.can.models import CANFiscalYear
from ops.can.models import FundingPartner
import ops.can.urls
from ops.home_page.views import home
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
    CORS(app)
    app.config.from_object("ops.environment.default_settings")
    if os.getenv("OPS_CONFIG"):
        app.config.from_envvar("OPS_CONFIG")
    app.config.from_prefixed_env()

    if config_overrides is not None:
        app.config.from_mapping(config_overrides)

    app.register_blueprint(ops.auth.urls.bp)
    app.register_blueprint(ops.can.urls.bp)
    app.register_blueprint(ops.portfolio.urls.bp)
    app.register_blueprint(ops.user.urls.bp)
    app.register_blueprint(home)

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
                managing_portfolio_id=1,
            )
        )
        db.session.add(
            BudgetLineItem(
                name="Line-Item-1",
                fiscal_year=2022,
                can_id=1,
                funding=1222222,
                status_id=1,
            )
        )
        db.session.add(
            BudgetLineItem(
                name="Line-Item-1",
                fiscal_year=2022,
                can_id=1,
                funding=22222,
                status_id=1,
            )
        )
        db.session.add(
            CANFiscalYear(
                can_id=1,
                fiscal_year=2022,
                total_fiscal_year_funding=12333123,
                potential_additional_funding=89000,
                can_lead="Tim",
                notes="No notes here.",
            )
        )
        db.session.add(
            CANFiscalYear(
                can_id=1,
                fiscal_year=2023,
                total_fiscal_year_funding=44333123,
                potential_additional_funding=12000,
                can_lead="John",
                notes="No notes here.",
            )
        )
        db.session.add(BudgetLineItemStatus(status="Planned"))
        db.session.add(BudgetLineItemStatus(status="In Execution"))
        db.session.add(BudgetLineItemStatus(status="Obligated"))
        db.session.commit()

    return app
