import * as XLSX from "xlsx";
import { getCurrentLocalTimestamp } from "./utils";

/**
 * Helper function to export table data to CSV
 * @param {Object} params - Parameters for the export
 * @param {any[]} params.data - Array of data to be exported
 * @param {string[]} params.headers - Array of headers for the table
 * @param {() => void} params.rowMapper - Function to map each data item to a row array
 * @param {string} [params.filename] - Name of the CSV file
 */
export const exportTableToXlsx = async ({ data, headers, rowMapper, filename = "export.xlsx" }) => {
    if (!data || !headers || !rowMapper) {
        throw new Error("Missing required parameters");
    }

    // Map the data to rows
    const rows = data.map(rowMapper).filter(row => row !== undefined);

    // Combine headers and rows
    const excelData = [headers, ...rows];

    // Create a new workbook and add the data
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
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
