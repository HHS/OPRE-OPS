import * as XLSX from "@e965/xlsx";
import { getCurrentLocalTimestamp } from "./utils";

const CURRENCY_FORMAT = '"$"#,##0.00_);("$"#,##0.00)';

/**
 * Apply the currency number format to numeric cells in the given columns (skips the header row).
 * @param {import("@e965/xlsx").WorkSheet} worksheet
 * @param {any[][]} rows
 * @param {number[]} currencyColumns
 */
const applyCurrencyFormat = (worksheet, rows, currencyColumns) => {
    currencyColumns.forEach((colIndex) => {
        rows.forEach((_row, rowIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
            const cell = worksheet[cellAddress];
            if (cell && cell.t === "n") {
                cell.z = CURRENCY_FORMAT;
            }
        });
    });
};

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

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    applyCurrencyFormat(worksheet, rows, currencyColumns);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

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

    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
        const worksheet = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
        applyCurrencyFormat(worksheet, sheet.rows, sheet.currencyColumns || []);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }

    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
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
