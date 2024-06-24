from typing import List

from sqlalchemy import Boolean, ForeignKey, Sequence, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class VendorContacts(BaseModel):
    __tablename__ = "vendor_contacts"

    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendor.id"), primary_key=True)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contact.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"vendor_id={self.vendor_id};contact_id={self.contact_id}"


class Contact(BaseModel):
    __tablename__ = "contact"

    id: Mapped[int] = BaseModel.get_pk_column()
    first_name: Mapped[str] = mapped_column(String(), nullable=True)
    last_name: Mapped[str] = mapped_column(String(), nullable=True)
    middle_name: Mapped[str] = mapped_column(String(), nullable=True)
    address: Mapped[str] = mapped_column(String(), nullable=True)
    city: Mapped[str] = mapped_column(String(), nullable=True)
    state: Mapped[str] = mapped_column(String(), nullable=True)
    zip: Mapped[str] = mapped_column(String(), nullable=True)
    phone_area_code: Mapped[str] = mapped_column(String(), nullable=True)
    phone_number: Mapped[str] = mapped_column(String(), nullable=True)
    email: Mapped[str] = mapped_column(String(), nullable=True)

    vendors: Mapped[List["Vendor"]] = relationship(
        "Vendor",
        back_populates="contacts",
        secondary="vendor_contacts",
        viewonly=True,
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"{self.first_name} {self.last_name}"


class Vendor(BaseModel):
    __tablename__ = "vendor"

    id: Mapped[int] = BaseModel.get_pk_column(
        sequence=Sequence("vendor_id_seq", start=100, increment=1)
    )
    name: Mapped[str]
    duns: Mapped[str]
    active: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=False)

    contacts: Mapped[List[Contact]] = relationship(
        Contact,
        secondary="vendor_contacts",
        back_populates="vendors",
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.duns
