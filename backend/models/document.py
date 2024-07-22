import uuid
from enum import Enum, auto

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column

from models.base import BaseModel


class DocumentType(Enum):
    CERTIFICATION_OF_FUNDING = auto()
    STATEMENT_OF_REQUIREMENTS = auto()
    ITAR_CHECKLIST_FOR_ALL_IT_PROCUREMENT_ACTIONS = auto()
    INDEPENDENT_GOVERNMENT_COST_ESTIMATE = auto()
    SECTION_508_EXCEPTION_DOCUMENTATION = auto()
    COR_NOMINATION_AND_CERTIFICATION_DOCUMENT = auto()
    ADDITIONAL_DOCUMENT = auto()


class Document(BaseModel):
    """Base Document model."""

    __tablename__ = "document"

    id = BaseModel.get_pk_column()
    agreement_id: Mapped[int] = mapped_column(ForeignKey("agreement.id"), nullable=False)
    document_id: Mapped[str] = mapped_column(default=str(uuid.uuid4()), nullable=False, unique=True)
    document_type: Mapped[DocumentType] = mapped_column(ENUM(DocumentType), nullable=False)
    file_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default='', nullable=True)

    @BaseModel.display_name.getter
    def display_name(self):
        return f"document id: {self.id};file name: {self.file_name};document type: {self.document_type};agreement id:{self.agreement_id}"
