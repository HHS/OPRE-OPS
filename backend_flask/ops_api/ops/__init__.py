import logging.config

from flask import Flask

from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from ops.user.models import User
from ops.user.models import db

from ops import views


def configure_logging():
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


def create_app(config_overrides=None):
    configure_logging()  # should be configured before any access to app.logger
    app = Flask(__name__)
    app.config.from_object("ops.default_settings")
    app.config.from_prefixed_env()

    if config_overrides is not None:
        app.config.from_mapping(config_overrides)

    app.register_blueprint(views.bp)

    jwt = JWTManager(app)
    db.init_app(app)

    with app.app_context():
        db.drop_all()
        db.create_all()
        db.session.add(User(email="BWayne@gmail.com", username="batman"))
        db.session.add(User(email="aTan@gmail.com", username="panther"))
        db.session.add(User(email="whoyaknow@gmail.com", username="little_sapphire"))
        db.session.commit()

    return app
