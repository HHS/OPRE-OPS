import logging.config

from flask import Flask

from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from ops_api.ops_api.user.user import User

from ops_api import views



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
    app.config.from_object("ops_api.default_settings")
    app.config.from_prefixed_env()

    if config_overrides is not None:
        app.config.from_mapping(config_overrides)

    app.register_blueprint(views.bp)

    jwt = JWTManager(app)
    db = SQLAlchemy(app)

    db.create_all()
    db.session.add(User(full_name="Bruce Wayne", username="batman"))
    db.session.add(User(full_name="Ann Takamaki", username="panther"))
    db.session.add(User(full_name="Jester Lavore", username="little_sapphire"))
    db.session.commit()


    return app
