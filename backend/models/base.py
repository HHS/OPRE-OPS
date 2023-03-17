"""Base model and other useful tools for project models."""
from typing import Annotated, Final, TypeAlias, TypedDict, TypeVar, cast

from desert import schema
from marshmallow import Schema as MMSchema
from models.mixins.repr import ReprMixin
from models.mixins.serialize import SerializeMixin
from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.orm import declarative_base, mapped_column, registry, declared_attr

Base = declarative_base()
reg = registry(metadata=Base.metadata)

intpk = Annotated[int, mapped_column(init=False, primary_key=True)]
# This is a simple type to make a standard int-base primary key field.

_T = TypeVar("_T")
_schema_registry: dict[str, MMSchema] = {}
_dict_registry: dict[str, TypeAlias] = {}


class _SchemaVar:
    """Dynamically create a marshmallow Schema for the object.

    This is implemented as a descriptor so that all the fields can be
    defined for the class before the Schema is created.
    """

    def __get__(self, obj: _T, objtype: type[_T] | None = None) -> MMSchema:
        """Get or create the schema for this object type.

        Note:
            This expects to be used at the class-level, rather than
            instance-level, so it expects that objtype will not be None.
        """
        if objtype is None:
            raise ValueError("Must be set at class-level.")
        name = objtype.__qualname__  # type: ignore [union-attr]
        try:
            return _schema_registry[name]
        except KeyError:
            _schema_registry[name] = schema(objtype)
            return _schema_registry[name]


class _DictVar:
    """Dynamically create a TypedDict for the object.

    This is implemented as a descriptor so that all the fields can be
    defined for the class prior to the TypedDict being created.
    """

    def __get__(self, obj: _T, objtype: type[_T] | None = None) -> TypeAlias:
        """Get or create the schema for this object type.

        Note:
            This expects to be used at the class-level, rather than
            instance-level, so it expects that objtype will not be None.
        """
        if objtype is None:
            raise ValueError("Must be set at class-level.")
        name = objtype.__qualname__  # type: ignore [union-attr]
        try:
            return _dict_registry[name]
        except KeyError:
            _dict_registry[name] = TypedDict(  # type: ignore [operator]
                f"{objtype.__name__}.Dict",  # type: ignore [union-attr]
                objtype.__annotations__,
            )
            return _dict_registry[name]


class BaseData:
    """Base class used for dataclass models.

    This provides some convenience attributes and methods to ease the
    development of models. Schema is a simple marshmallow Schema that
    is automatically generated for the dataclass model. Dict is an
    automatically generated TypedDict.

    Note:
        This means that "<Classname>" is the dataclass,
        while "<Classname>.Dict" is a TypedDict that has keys that match the dataclass
        attributes.
    """

    Schema: Final[MMSchema] = _SchemaVar()
    Dict: Final[TypeAlias] = _DictVar()  # type: ignore [valid-type]

    @classmethod
    def from_dict(cls, data: "BaseData.Dict") -> "BaseData":  # type: ignore [name-defined]
        """Load the instance data from the given dict structure."""
        return cls.Schema.load(data)  # type: ignore [no-any-return]

    def to_dict(self) -> "BaseData.Dict":  # type: ignore [name-defined]
        """Dump the instance data into a dict structure."""
        return self.Schema.dump(self)

    @classmethod
    def from_json(cls, data: str) -> "BaseData":
        """Load the instance data from the given json string."""
        return cls.Schema.loads(data)  # type: ignore [no-any-return]

    def to_json(self) -> str:
        """Dump the instance data into a json string."""
        return cast(str, self.Schema.dumps(self))


class BaseModel(Base, SerializeMixin, ReprMixin):  # type: ignore [misc, valid-type]
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
