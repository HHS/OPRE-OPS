from models.base import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String

class ResearchMethodology(BaseModel):
    """
    A Research Methodology (RM) outlines the "how" when referring to an Agreement.
    It details the specific methods and approaches that will be employed to conduct research under a given Agreement.

    This model contains all the relevant
    descriptive information about a given Research Methodology

    name - The name of the Research Methodology
    """

    __tablename__ = "research_methodology"

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(String, nullable=False)


    @property
    def display_title(self):
        return f"Research Methodology: {self.name}"
