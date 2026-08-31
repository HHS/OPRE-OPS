"""Vendor service."""

from typing import List

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Vendor


class VendorService:
    """Service for vendor operations."""

    def __init__(self, session: Session):
        self.session = session

    def get_active_vendors(self) -> List[Vendor]:
        """Get all active vendors ordered by name."""
        stmt = select(Vendor).where(Vendor.active == True).order_by(Vendor.name)  # noqa: E712
        return list(self.session.scalars(stmt).all())
