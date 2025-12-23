from models.base import BaseModel
from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String

class ResearchMethodology(BaseModel):
    """
    A Research Methodology (RM) outlines the "how" when referring to an Agreement.
    It details the specific methods and approaches that will be employed to conduct research under a given Agreement.

    This model contains all the relevant
    descriptive information about a given Research Methodology

    name - The name of the Research Methodology
    detailed_name - The detailed name of the Research Methodology
    """

    __tablename__ = "research_methodology"

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(String, nullable=False)
    detailed_name: Mapped[str] = mapped_column(String, nullable=False)

    agreements: Mapped[List["Agreement"]] = relationship(
        "Agreement",
        secondary="agreement_research_methodologies",
        back_populates="research_methodologies",
        primaryjoin="ResearchMethodology.id == AgreementResearchMethodologies.research_methodology_id",
        secondaryjoin="Agreement.id == AgreementResearchMethodologies.agreement_id",
    )

    @property
    def display_title(self):
        return f"Research Methodology: {self.name}"
