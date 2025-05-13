"""Module containing the Procurement Shop model."""

import decimal
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class ProcurementShop(BaseModel):
    """The Procurement Shop model."""

    __tablename__ = "procurement_shop"

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[String] = mapped_column(String, nullable=False)
    abbr: Mapped[String] = mapped_column(String, nullable=False)
    agreements = relationship("Agreement", back_populates="procurement_shop")
    procurement_shop_fees = relationship(
        "ProcurementShopFee", back_populates="procurement_shop"
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class ProcurementShopFee(BaseModel):
    """The Procurement Shop Fee model."""

    __tablename__ = "procurement_shop_fee"

    id = BaseModel.get_pk_column()
    procurement_shop_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_shop.id"), nullable=False
    )
    fee: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 2), default=Decimal(0.0))
    procurement_shop = relationship(
        "ProcurementShop", back_populates="procurement_shop_fees"
    )
    start_date: Mapped[Optional[Date]] = mapped_column(Date(), nullable=True)
    end_date: Mapped[Optional[Date]] = mapped_column(Date(), nullable=True)
