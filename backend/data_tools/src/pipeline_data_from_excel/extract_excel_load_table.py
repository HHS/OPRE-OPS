import sys

import luigi.contrib.postgres
import openpyxl
from data_tools.src.pipeline_data_from_excel.ops_task import OPSTask
from data_tools.src.pipeline_data_from_excel.utils import clean_rows
from models import *
from pyexcel_io import save_data
from pyexcel_io.constants import DB_SQL
from pyexcel_io.database.common import SQLTableImportAdapter, SQLTableImporter
from sqlalchemy.future import create_engine
from sqlalchemy.orm import Session


class ExtractExcelLoadTable(OPSTask):
    run_date = luigi.DateSecondParameter()
    _task_complete = False
    _task_meta = {"log_messages": []}

    def __init__(self, run_date):
        super().__init__(run_date)

    def complete(self):
        return self._task_complete

    def run(self):
        workbook = openpyxl.load_workbook(
            "data_tools/data/REDACTED-FY22_Budget_Summary-10-12-22.xlsm",
            data_only=True,
            read_only=True,
            keep_vba=False,
            keep_links=False,
        )
        sheet = workbook["All Budget - Cur"]

        # header_row = [
        #     item.replace(" ", "_")
        #     for row in sheet.iter_rows(max_row=1, values_only=True)
        #     for item in row
        #     if item
        # ]

        data_rows = [list(row) for row in sheet.iter_rows(min_row=2, values_only=True)]

        non_empty_data_rows = clean_rows(data_rows)

        BaseModel.metadata.create_all(self._engine)

        # Delete all pre-existing records
        with Session(self._engine) as session, session.begin():
            session.query(AllBudgetCurrent).delete()

        with Session(self._engine) as session, session.begin():
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
            save_data(
                importer, {adapter.get_name(): non_empty_data_rows}, file_type=DB_SQL
            )

        # # add task metadata
        # with Session(self._engine) as session, session.begin():
        #     session.add(
        #         ETLTaskStatus(
        #             workflow_name="etl_data_from_excel",
        #             task_name="extract_excel_load_table",
        #             run_at=self.run_date,
        #             task_meta=self._task_meta,
        #         )
        #     )

        self._task_complete = True


if __name__ == "__main__":
    from dateutil import parser

    run_date_from_cmd = parser.parse(sys.argv[2])

    luigi.build([ExtractExcelLoadTable(run_date_from_cmd)], local_scheduler=True)
