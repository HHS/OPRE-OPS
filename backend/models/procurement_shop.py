"""Module containing the Procurement Shop model."""

from models.base import BaseData, intpk, reg
from sqlalchemy.orm import Mapped, mapped_column


@reg.mapped_as_dataclass
class ProcurementShop(BaseData):
    """The Procurement Shop model."""

    __tablename__ = "procurement_shop"

    id: Mapped[intpk]
    name: Mapped[str]
    shortname: Mapped[str]
    fee: Mapped[float] = mapped_column(default=0.0)
