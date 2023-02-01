import luigi
import openpyxl
from data_tools.src.etl_data_from_excel.excel_models import AllBudgetCurrent
from openpyxl import Workbook
from pyexcel_io import save_data
from pyexcel_io.constants import DB_SQL, DEFAULT_SHEET_NAME
from pyexcel_io.database.common import SQLTableImportAdapter, SQLTableImporter
from sqlalchemy.future import create_engine
from sqlalchemy.orm import Session


class ExtractBudgetSummaryExcel(luigi.Task):
    def output(self):
        ...

    def run(self):
        workbook = openpyxl.load_workbook(
            "/Users/jdeangelis/PycharmProjects/OPRE-OPS-2/data-tools/data/REDACTED-FY22_Budget_Summary-10-12-22.xlsm",
            data_only=True,
            read_only=True,
            keep_vba=False,
            keep_links=False,
        )
        sheet = workbook.worksheets["All Budget - Cur"]

        for row in sheet:
            print(row)

        engine = create_engine()
        # create session and add objects
        with Session(engine) as session, session.begin():
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
            save_data(importer, {adapter.get_name()})

    if __name__ == "__main__":
        luigi.run()
