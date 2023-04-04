"""Module containing the Procurement Shop model."""

from marshmallow import Schema as MMSchema
from marshmallow import fields
from models.base import BaseData, intpk, reg
from sqlalchemy.orm import Mapped, mapped_column

# This is a hack. Because Desert is apparently not creating "id" fields, and I had to
# move on. As such, it is required to make the Schema class, and then add an instance
# of it to the Schema class variable in the dataclass, as shown below. Once we can
# get desert to do this right, the cleaner functionality is possible.  - Cliff

class ProcurementShopSchema(MMSchema):
    id = fields.Int()
    name = fields.Str()
    abbr = fields.Str()
    fee = fields.Float()


@reg.mapped_as_dataclass
class ProcurementShop(BaseData):
    """The Procurement Shop model."""

    __tablename__ = "procurement_shop"

    id: Mapped[intpk]
    name: Mapped[str]
    abbr: Mapped[str]
    fee: Mapped[float] = mapped_column(default=0.0)

    Schema = ProcurementShopSchema()
