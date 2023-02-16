import json
import sys

import luigi
from data_tools.src.pipeline_data_from_excel.load_cans import LoadCANs
from data_tools.src.pipeline_data_from_excel.load_research_projects import LoadResearchProjects
from data_tools.src.pipeline_data_from_excel.ops_task import OPSTask
from models import *
from sqlalchemy.orm import Session


class LoadSpreadsheet(OPSTask):
    run_date = luigi.DateSecondParameter()
    _task_complete = False

    def __init__(self, run_date):
        super().__init__(run_date)

    def complete(self):
        return self._task_complete

    def requires(self):
        return [LoadResearchProjects(self.run_date), LoadCANs(self.run_date)]

    def run(self):
        self._log_message("Running --> LoadSpreadsheet")
        self._log_message("LoadSpreadsheet --> COMPLETE")
        self._task_complete = True


@LoadSpreadsheet.event_handler(luigi.Event.SUCCESS)
def success(task):
    with Session(task.engine) as session, session.begin():
        session.add(
            ETLTaskStatus(
                workflow_name="etl_data_from_excel",
                task_name=task.task_module,
                run_at=task.run_date,
                task_meta=json.dumps(task.task_meta),
                status="SUCCESS",
            )
        )


@LoadSpreadsheet.event_handler(luigi.Event.FAILURE)
def fail(task):
    with Session(task.engine) as session, session.begin():
        session.add(
            ETLTaskStatus(
                workflow_name="etl_data_from_excel",
                task_name=task.task_module,
                run_at=task.run_date,
                task_meta=json.dumps(task.task_meta),
                status="FAIL",
            )
        )


if __name__ == "__main__":
    from dateutil import parser

    run_date_from_cmd = parser.parse(sys.argv[2])

    luigi.build([LoadSpreadsheet(run_date_from_cmd)], local_scheduler=True)
