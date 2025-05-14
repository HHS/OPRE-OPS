"""Module containing the Procurement Shop model."""

import decimal
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.ext.hybrid import hybrid_property
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

    @hybrid_property
    def fee_percentage(self):
        """Get the current fee percentage for the procurement shop based on the current date."""
        from datetime import date

        today = date.today()
        active_fees = [
            fee
            for fee in self.procurement_shop_fees
            if (fee.start_date is None or fee.start_date <= today)
            and (fee.end_date is None or today <= fee.end_date)
        ]
        return active_fees[0].fee if active_fees else Decimal(0.0)

    @fee_percentage.expression
    def fee_percentage(cls):
        """Get the current fee percentage for the procurement shop based on the current date."""
        from sqlalchemy import func, select
        from sqlalchemy.orm import aliased

        today = func.current_date()
        ProcurementShopFeeAlias = aliased(ProcurementShopFee)

        # Subquery to find the active fee for each procurement shop
        subq = (
            select(ProcurementShopFeeAlias.fee)
            .where(
                ProcurementShopFeeAlias.procurement_shop_id == cls.id,
                ProcurementShopFeeAlias.start_date <= today,
                (ProcurementShopFeeAlias.end_date == None)
                | (ProcurementShopFeeAlias.end_date >= today),
            )
            .order_by(ProcurementShopFeeAlias.start_date.desc())
            .limit(1)
            .scalar_subquery()
        )

        # Return the active fee or 0 if none exists
        return func.coalesce(subq, Decimal("0.0"))

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name


class ProcurementShopFee(BaseModel):
    """The Procurement Shop Fee model."""

    __tablename__ = "procurement_shop_fee"

    __table_args__ = (
        UniqueConstraint(
            "procurement_shop_id",
            "end_date",
            name="procurement_shop_fee_unique_active_period",
        ),
    )

    id = BaseModel.get_pk_column()
    procurement_shop_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_shop.id"), nullable=False
    )
    # fee percentage - if the fee is 5%, it should be stored as 5.0
    fee: Mapped[Optional[decimal]] = mapped_column(Numeric(12, 2), default=Decimal(0.0))
    procurement_shop = relationship(
        "ProcurementShop", back_populates="procurement_shop_fees"
    )
    start_date: Mapped[Optional[Date]] = mapped_column(Date(), nullable=True)
    end_date: Mapped[Optional[Date]] = mapped_column(Date(), nullable=True)
    budget_line_items = relationship(
        "BudgetLineItem", back_populates="procurement_shop_fee"
    )
