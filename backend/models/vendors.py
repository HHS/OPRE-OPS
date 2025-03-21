from enum import Enum, auto
from typing import List, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, Sequence, String
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import BaseModel


class VendorContacts(BaseModel):
    __tablename__ = "vendor_contacts"

    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendor.id"), primary_key=True)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contact.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"vendor_id={self.vendor_id};contact_id={self.contact_id}"


class ContactType(Enum):
    FINANCIAL = auto()
    CONTRACT = auto()
    CUSTOMER = auto()


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
    contact_type: Mapped[ContactType] = mapped_column(ENUM(ContactType), nullable=True)

    vendors: Mapped[List["Vendor"]] = relationship(
        "Vendor",
        back_populates="contacts",
        secondary="vendor_contacts",
        viewonly=True,
    )

    iaa_customer_agencies: Mapped[List["IAACustomerAgency"]] = relationship(
        "IAACustomerAgency",
        back_populates="contacts",
        secondary="iaa_customer_agency_contacts",
        viewonly=True,
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return f"{self.first_name} {self.last_name}"


class Vendor(BaseModel):
    __tablename__ = "vendor"

    id: Mapped[int] = BaseModel.get_pk_column(sequence=Sequence("vendor_id_seq", start=100, increment=1))
    name: Mapped[str]
    duns: Mapped[Optional[str]] = mapped_column(String(), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean(), default=True, nullable=False)

    contacts: Mapped[List[Contact]] = relationship(
        Contact,
        secondary="vendor_contacts",
        back_populates="vendors",
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.duns


class IAACustomerAgencyContacts(BaseModel):
    __tablename__ = "iaa_customer_agency_contacts"

    iaa_customer_agency_id: Mapped[int] = mapped_column(ForeignKey("iaa_customer_agency.id"), primary_key=True)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contact.id"), primary_key=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"iaa_customer_agency_id={self.iaa_customer_agency_id};contact_id={self.contact_id}"


class IAACustomerAgency(BaseModel):
    __tablename__ = "iaa_customer_agency"

    id: Mapped[int] = BaseModel.get_pk_column(sequence=Sequence("iaa_customer_agency_id_seq", start=100, increment=1))
    name: Mapped[str]
    customer_duns: Mapped[Optional[str]] = mapped_column(String(), nullable=True)
    object_class_code_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("object_class_code.id"))
    object_class_code: Mapped[Optional["ObjectClassCode"]] = relationship("ObjectClassCode")
    customer_agency_nbr: Mapped[Optional[str]] = mapped_column(String(), nullable=True)

    contacts: Mapped[List[Contact]] = relationship(
        Contact,
        secondary="iaa_customer_agency_contacts",
        back_populates="iaa_customer_agencies",
    )

    @BaseModel.display_name.getter
    def display_name(self):
        return self.customer_duns
