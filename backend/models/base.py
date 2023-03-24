from models.mixins.repr import ReprMixin
from models.mixins.serialize import SerializeMixin
from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.orm import declarative_base, declared_attr

Base = declarative_base()


class BaseModel(Base, SerializeMixin, ReprMixin):
    __abstract__ = True
    __repr__ = ReprMixin.__repr__

    @declared_attr
    def created_by(cls):
        return Column("created_by", ForeignKey("users.id"))

    created_on = Column(DateTime, default=func.now())
    updated_on = Column(DateTime, default=func.now(), onupdate=func.now())

    class Validator:
        @staticmethod
        def validate(item, data):  # type: ignore [no-untyped-def]
            pass
