"""Module containing the Procurement Shop model."""

from models.base import BaseModel
from sqlalchemy import Column, Float, String
from sqlalchemy.orm import relationship


class ProcurementShop(BaseModel):
    """The Procurement Shop model."""

    __tablename__ = "procurement_shop"

    id = BaseModel.get_pk_column()
    name = Column(String, nullable=False)
    abbr = Column(String, nullable=False)
    fee = Column(Float, default=0.0)
    agreements = relationship("Agreement", back_populates="procurement_shop")

    @BaseModel.display_name.getter
    def display_name(self):
        return self.name
