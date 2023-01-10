from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_mixins import ReprMixin
from sqlalchemy_mixins import SerializeMixin

Base = declarative_base()


class BaseModel(Base, SerializeMixin, ReprMixin):
    __abstract__ = True
    __repr__ = ReprMixin.__repr__

    class Validator:
        @staticmethod
        def validate(item, data):  # type: ignore [no-untyped-def]
            pass


db = SQLAlchemy(model_class=BaseModel)
