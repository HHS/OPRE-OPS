from typing import List

from data_tools.src.etl_data_from_excel.etl_business_rules import ETLBusinessRules
from models import *


class LoadResearchProjectsBusinessRules(ETLBusinessRules):
    @staticmethod
    def apply_business_rules(
        data: List[AllBudgetCurrent],
        existing_research_projects: List[ResearchProject] = [],
    ) -> List[ResearchProject]:
        research_projects = [
            ResearchProject(title=record.Project_Title)
            for record in data
            if all(
                record.Project_Title != proj.title
                for proj in existing_research_projects
            )
        ]
        # Remove dup ResearchProject titles
        result = []
        project_titles = set()
        for record in research_projects:
            if record.title not in project_titles:
                result.append(record)
                project_titles.add(record.title)

        return result
