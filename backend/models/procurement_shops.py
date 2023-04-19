"""Module containing the Procurement Shop model."""

from models.base import BaseModel
from sqlalchemy import Column, Float, Integer, String
from sqlalchemy.orm import relationship


class ProcurementShop(BaseModel):
    """The Procurement Shop model."""

    __tablename__ = "procurement_shop"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    abbr = Column(String, nullable=False)
    fee = Column(Float, default=0.0)
