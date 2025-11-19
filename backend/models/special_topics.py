from models.base import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String

class SpecialTopic(BaseModel):
    """
    Special Topics outlines the specific areas of focus within an Agreement.
    It details the unique aspects and considerations that are relevant to the research being conducted.

    This model contains all the relevant
    descriptive information about a given Special Topic or Population

    name - The name of the Special Topic
    """

    __tablename__ = "special_topics"

    id: Mapped[int] = BaseModel.get_pk_column()
    name: Mapped[str] = mapped_column(String, nullable=False)


    @property
    def display_name(self):
        return f"Special Topic: {self.name}"
