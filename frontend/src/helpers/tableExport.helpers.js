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

/**
 * Helper function to export data to a multi-sheet XLSX file
 * @param {Object} params - Parameters for the export
 * @param {Object[]} params.sheets - Array of sheet definitions
 * @param {string} params.sheets[].name - Sheet tab name
 * @param {string[]} params.sheets[].headers - Column headers
 * @param {any[][]} params.sheets[].rows - Array of row arrays
 * @param {number[]} [params.sheets[].currencyColumns] - Column indices formatted as currency
 * @param {string} [params.filename] - Name of the XLSX file (without extension)
 */
export const exportMultiSheetToXlsx = async ({ sheets, filename = "export" }) => {
    if (!sheets || sheets.length === 0) {
        throw new Error("At least one sheet is required");
    }

    const workbook = new ExcelJS.Workbook();

    for (const sheet of sheets) {
        const worksheet = workbook.addWorksheet(sheet.name);

        worksheet.addRow(sheet.headers);
        sheet.rows.forEach((row) => worksheet.addRow(row));

        const currencyColumns = sheet.currencyColumns || [];
        currencyColumns.forEach((colIndex) => {
            const column = worksheet.getColumn(colIndex + 1);
            column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
                if (rowNumber === 1) return;
                if (typeof cell.value === "number") {
                    cell.numFmt = CURRENCY_FORMAT;
                }
            });
        });
    }

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
