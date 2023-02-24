from typing import List, Optional

from models.portfolios import Portfolio
from models.research_projects import ResearchProject
from sqlalchemy import select


class ResearchProjectHelper:
    @staticmethod
    def get_list(portfolio: Portfolio, fiscal_year: int) -> Optional[List[ResearchProject]]:
        stmt = select(ResearchProject)

        return stmt
