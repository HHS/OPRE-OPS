import sys

import luigi
from data_tools.src.etl_data_from_excel.extract_excel_load_table import ExtractExcelLoadTable
from data_tools.src.etl_data_from_excel.load_research_projects_business_rules import LoadResearchProjectsBusinessRules
from models import *
from sqlalchemy.future import create_engine, select
from sqlalchemy.orm import Session


class LoadResearchProjects(luigi.Task):
    run_date = luigi.DateSecondParameter()
    _task_complete = False
    _engine = create_engine(
        "postgresql://postgres:local_password@localhost:5432/postgres"  # pragma: allowlist secret
    )

    def complete(self):
        return self._task_complete

    def requires(self):
        return ExtractExcelLoadTable(self.run_date)

    def run(self):
        BaseModel.metadata.create_all(self._engine)

        with Session(self._engine) as session, session.begin():
            all_budget_current = session.scalars(
                select(AllBudgetCurrent)
                .where(AllBudgetCurrent.Project_Title != "Placeholder")
                .where(AllBudgetCurrent.Project_Title != "OPRE")
            ).all()
            all_research_projects = session.scalars(select(ResearchProject)).all()

            research_projects_to_create = (
                LoadResearchProjectsBusinessRules.apply_business_rules(
                    all_budget_current, all_research_projects
                )
            )

            session.add_all(research_projects_to_create)

        # add task metadata
        with Session(self._engine) as session, session.begin():
            session.add(
                ETLTaskStatus(
                    workflow_name="etl_data_from_excel",
                    task_name="load_research_projects",
                    run_at=self.run_date,
                    comments="",
                )
            )

        self._task_complete = True


if __name__ == "__main__":
    import datetime

    run_date = datetime.datetime.fromisoformat(sys.argv[2])

    luigi.build([LoadResearchProjects(run_date)], local_scheduler=True)
