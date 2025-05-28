"""Module containing the Procurement Shop model."""

from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class ProcurementShopFee(BaseModel):
    """The Procurement Shop Fee model."""

    __tablename__ = "procurement_shop_fee"

    __table_args__ = (
        UniqueConstraint(
            "procurement_shop_id",
            "start_date",
            "end_date",
            name="procurement_shop_fee_unique_active_period",
        ),
    )

    id = BaseModel.get_pk_column()
    procurement_shop_id: Mapped[int] = mapped_column(
        ForeignKey("procurement_shop.id"), nullable=False
    )
    # fee percentage - if the fee is 5%, it should be stored as 5.0
    fee: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), default=Decimal(0.0))
    procurement_shop = relationship(
        "ProcurementShop", back_populates="procurement_shop_fees"
    )
    start_date: Mapped[Optional[Date]] = mapped_column(Date(), nullable=True)
    end_date: Mapped[Optional[Date]] = mapped_column(Date(), nullable=True)
    budget_line_items = relationship(
        "BudgetLineItem", back_populates="procurement_shop_fee"
    )


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
    def fee_percentage(self) -> Decimal:
        """Get the current fee percentage for the procurement shop based on the current date."""
        return self.current_fee.fee if self.current_fee else Decimal(0.0)

    @fee_percentage.expression
    def fee_percentage(cls) -> Decimal:
        """Get the current fee percentage for the procurement shop based on the current date."""
        from sqlalchemy import func, select
        from sqlalchemy.orm import aliased

        today = func.current_date()
        ProcurementShopFeeAlias = aliased(ProcurementShopFee)

        # Subquery to find the active fee for each procurement shop
        # Order by start_date descending to get the most recent start date first
        # when there are overlapping ranges
        subq = (
            select(ProcurementShopFeeAlias.fee)
            .where(
                ProcurementShopFeeAlias.procurement_shop_id == cls.id,
                (ProcurementShopFeeAlias.start_date.is_(None))
                | (ProcurementShopFeeAlias.start_date <= today),
                (ProcurementShopFeeAlias.end_date.is_(None))
                | (ProcurementShopFeeAlias.end_date >= today),
            )
            .order_by(ProcurementShopFeeAlias.start_date.desc().nullslast())
            .limit(1)
            .scalar_subquery()
        )

        # Return the active fee or 0 if none exists
        return func.coalesce(subq, Decimal("0.0"))

    @hybrid_property
    def current_fee(self) -> Optional[ProcurementShopFee]:
        """Get the current fee for the procurement shop based on the current date."""
        from datetime import date

        today = date.today()
        active_fees = [
            fee
            for fee in self.procurement_shop_fees
            if (fee.start_date is None or fee.start_date <= today)
            and (fee.end_date is None or today <= fee.end_date)
        ]
        # Sort by start_date in descending order (None values last)
        # This ensures that when there are overlapping date ranges,
        # we select the fee with the most recent start date
        active_fees.sort(key=lambda fee: fee.start_date or date.min, reverse=True)

        return active_fees[0] if active_fees else None

    @current_fee.expression
    def current_fee(cls) -> Optional[ProcurementShopFee]:
        """Get the current fee for the procurement shop based on the current date."""
        from sqlalchemy import func, select
        from sqlalchemy.orm import aliased

        today = func.current_date()
        ProcurementShopFeeAlias = aliased(ProcurementShopFee)

        subq = (
            select(ProcurementShopFeeAlias.id)
            .where(
                ProcurementShopFeeAlias.procurement_shop_id == cls.id,
                (ProcurementShopFeeAlias.start_date.is_(None))
                | (ProcurementShopFeeAlias.start_date <= today),
                (ProcurementShopFeeAlias.end_date.is_(None))
                | (ProcurementShopFeeAlias.end_date >= today),
            )
            .order_by(ProcurementShopFeeAlias.start_date.desc().nullslast())
            .limit(1)
            .scalar_subquery()
        )

        # Return the active fee or None if none exists
        return subq

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name
