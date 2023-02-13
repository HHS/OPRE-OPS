import sys

import luigi.contrib.postgres
import openpyxl
from data_tools.src.pipeline_data_from_excel.ops_task import OPSTask
from data_tools.src.pipeline_data_from_excel.utils import clean_rows
from models import *
from pyexcel_io import save_data
from pyexcel_io.constants import DB_SQL
from pyexcel_io.database.common import SQLTableImportAdapter, SQLTableImporter
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
        workbook = openpyxl.load_workbook(
            EXCEL_FILE_NAME,
            data_only=True,
            read_only=True,
            keep_vba=False,
            keep_links=False,
        )
        self._log_message("Excel file successfully extracted.")

        sheet = workbook["All Budget - Cur"]

        data_rows = [list(row) for row in sheet.iter_rows(min_row=2, values_only=True)]

        non_empty_data_rows = clean_rows(data_rows)

        self._log_message("Creating All Tables...")
        BaseModel.metadata.create_all(self.engine)
        self._log_message("...Tables created.")

        # Delete all pre-existing records
        with Session(self.engine) as session, session.begin():
            self._log_message("Deleting --> existing staging data.")
            session.query(AllBudgetCurrent).delete()
            self._log_message("Staging data deleted.")

        with Session(self.engine) as session, session.begin():
            importer = SQLTableImporter(session)
            adapter = SQLTableImportAdapter(AllBudgetCurrent)
            adapter.column_names = [
                "CAN",
                "Sys_Budget_ID",
                "Project_Title",
                "CIG_Name",
                "CIG_Type",
                "Line_Desc",
                "Date_Needed",
                "Amount",
                "PSCFee_Amount",
                "Status",
                "Comments",
                "Total_Bud_Cur",
                "All_Bud_Prev",
                "Delta",
            ]
            importer.append(adapter)

            self._log_message("Loading --> Data to staging table.")
            save_data(
                importer, {adapter.get_name(): non_empty_data_rows}, file_type=DB_SQL
            )
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
                task_meta=task.task_meta,
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
                task_meta=task.task_meta,
                status="FAIL",
            )
        )


if __name__ == "__main__":
    from dateutil import parser

    run_date_from_cmd = parser.parse(sys.argv[2])

    luigi.build([ExtractExcelLoadTable(run_date_from_cmd)], local_scheduler=True)
