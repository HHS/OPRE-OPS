import ExcelJS from "exceljs";
import { getCurrentLocalTimestamp } from "./utils";

const CURRENCY_FORMAT = '"$"#,##0.00_);("$"#,##0.00)';

/**
 * Helper function to export table data to XLSX
 * @param {Object} params - Parameters for the export
 * @param {any[] | undefined} params.data - Array of data to be exported
 * @param {string[]} params.headers - Array of headers for the table
 * @param {(item: any) => (string | number | boolean | Date | null | undefined)[]} params.rowMapper - Function to map each data item to a row array
 * @param {string} [params.filename] - Name of the XLSX file
 * @param {number[]} [params.currencyColumns] - Array of column indices that should be formatted as currency
 */
export const exportTableToXlsx = async ({
    data,
    headers,
    rowMapper,
    filename = "export.xlsx",
    currencyColumns = []
}) => {
    if (!data || !headers || !rowMapper) {
        throw new Error("Missing required parameters");
    }

    const rows = data.map(rowMapper).filter((row) => row !== undefined);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.addRow(headers);
    rows.forEach((row) => worksheet.addRow(row));

    currencyColumns.forEach((colIndex) => {
        const column = worksheet.getColumn(colIndex + 1);
        column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            if (rowNumber === 1) return;
            if (typeof cell.value === "number") {
                cell.numFmt = CURRENCY_FORMAT;
            }
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const currentTimeStamp = getCurrentLocalTimestamp();
    const downloadFilename = `${filename}_${currentTimeStamp}.xlsx`;
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
};
