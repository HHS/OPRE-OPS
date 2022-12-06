"""App-wide utility functions/classes."""
from typing import Any, Generator
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_mixins import ReprMixin
from sqlalchemy_mixins import SerializeMixin

Base = declarative_base()


class BaseModel(Base, SerializeMixin, ReprMixin):  # type: ignore [misc,valid-type]
    """Base class for all application Models."""
    __abstract__ = True
    __repr__ = ReprMixin.__repr__

    class Validator:
        @staticmethod
        def validate(item, data):
            pass


db = SQLAlchemy(model_class=BaseModel)
