# from sqlalchemy_mixins import ReprMixin, SerializeMixin
from models.mixins.repr import ReprMixin
from models.mixins.serialize import SerializeMixin
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class BaseModel(Base, SerializeMixin, ReprMixin):
    __abstract__ = True
    __repr__ = ReprMixin.__repr__

    class Validator:
        @staticmethod
        def validate(item, data):  # type: ignore [no-untyped-def]
            pass
