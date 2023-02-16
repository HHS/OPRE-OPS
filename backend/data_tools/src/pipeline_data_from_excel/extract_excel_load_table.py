import json
import sys

import luigi.contrib.postgres
import pandas as pd
from data_tools.src.pipeline_data_from_excel.ops_task import OPSTask
from models import *
from sqlalchemy import insert
from sqlalchemy.orm import Session

EXCEL_FILE_NAME = "data_tools/data/REDACTED-FY22_Budget_Summary-10-12-22.xlsm"


class ExtractExcelLoadTable(OPSTask):
    run_date = luigi.DateSecondParameter()
    _task_complete = False

    def __init__(self, run_date):
        super().__init__(run_date)

    def complete(self):
        return self._task_complete

    def run(self):
        self._log_message("Running --> ExtractExcelLoadTable")

        self._log_message(f"Extracting from Excel file --> {EXCEL_FILE_NAME}")
        colnames = [
            "CAN",
            "Sys_Budget_ID",
            "Project Title",
            "CIG Name",
            "CIG Type",
            "Line Desc",
            "Date Needed",
            "Amount",
            "PSCFee Amount",
            "Status",
            "Comments",
            "Total Bud Cur",
            "All Bud Prev",
            "Delta",
        ]
        df = pd.read_excel(
            EXCEL_FILE_NAME, sheet_name="All Budget - Cur", usecols=colnames, dtype=str
        )

        coldict = {col: col.replace(" ", "_") for col in colnames}
        df.rename(columns=coldict, inplace=True)

        self._log_message("Excel file successfully extracted.")

        self._log_message("Creating All Tables...")
        BaseModel.metadata.create_all(self.engine)
        self._log_message("...Tables created.")

        # Delete all pre-existing records
        with Session(self.engine) as session, session.begin():
            self._log_message("Deleting --> existing staging data.")
            session.query(AllBudgetCurrent).delete()
            self._log_message("Staging data deleted.")

        with Session(self.engine) as session, session.begin():
            self._log_message("Loading --> Data to staging table.")
            data_to_write = df.to_dict(orient="records")
            insert_stmt = insert(AllBudgetCurrent).values(data_to_write)
            session.execute(insert_stmt)
            self._log_message("Data loaded to staging table.")

        self._log_message("ExtractExcelLoadTable --> COMPLETE")
        self._task_complete = True


@ExtractExcelLoadTable.event_handler(luigi.Event.SUCCESS)
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


@ExtractExcelLoadTable.event_handler(luigi.Event.FAILURE)
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

    luigi.build([ExtractExcelLoadTable(run_date_from_cmd)], local_scheduler=True)
