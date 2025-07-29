import * as XLSX from "xlsx";
import { getCurrentLocalTimestamp } from "./utils";

/**
 * Helper function to export table data to XLSX
 * @param {Object} params - Parameters for the export
 * @param {any[] | undefined} params.data - Array of data to be exported
 * @param {string[]} params.headers - Array of headers for the table
 * @param {() => void} params.rowMapper - Function to map each data item to a row array
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

    // Map the data to rows
    const rows = data.map(rowMapper).filter((row) => row !== undefined);

    // Combine headers and rows
    const excelData = [headers, ...rows];

    // Create a new workbook and add the data
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);

    // Apply currency formatting to specified columns
    if (currencyColumns.length > 0 && worksheet["!ref"]) {
        const range = XLSX.utils.decode_range(worksheet["!ref"]);

        // Apply currency format to each specified column (skip header row)
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            for (const colIndex of currencyColumns) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: colIndex });
                if (worksheet[cellAddress] && typeof worksheet[cellAddress].v === "number") {
                    worksheet[cellAddress].z = '"$"#,##0.00_);("$"#,##0.00)';
                }
            }
        }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Write the workbook to a file
    const currentTimeStamp = getCurrentLocalTimestamp();
    const downloadFilename = `${filename}_${currentTimeStamp}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
};
