"""App-wide utility functions/classes."""
from typing import Any, Generator
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy_mixins import ReprMixin
from sqlalchemy_mixins import SerializeMixin

Base = declarative_base()


def keyvalgen(obj: object) -> Generator[tuple[str, Any], None, None]:
    """Generate attr name/val pairs, filtering out SQLA attrs."""
    excl = ("_sa_adapter", "_sa_instance_state")
    for k, v in vars(obj).items():
        if not k.startswith("_") and not any(hasattr(v, a) for a in excl):
            yield k, v


class BaseModel(Base, SerializeMixin, ReprMixin):  # type: ignore [misc,valid-type]
    __abstract__ = True
    __repr__ = ReprMixin.__repr__


# class BaseModel(db.Model):
#     __abstract__ = True

#     id = db.Column(db.Integer, primary_key=True)
#     created_on = db.Column(db.DateTime, default=db.func.now())
#     updated_on = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

#     def __repr__(self):
#         params = ", ".join(f"{k}={v}" for k, v in keyvalgen(self))
#         return f"{self.__class__.__name__}({params})"


db = SQLAlchemy(model_class=BaseModel)
