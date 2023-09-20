"""Module containing the Procurement Shop model."""

from models.base import BaseModel
from sqlalchemy import Column, Float, Integer, String, Numeric
from sqlalchemy.orm import relationship


class ProcurementShop(BaseModel):
    """The Procurement Shop model."""

    __tablename__ = "procurement_shop"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    abbr = Column(String, nullable=False)
    fee = Column(Numeric(12, 5), default=0.0)
    agreements = relationship("Agreement", back_populates="procurement_shop")

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name
