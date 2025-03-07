import Papa from "papaparse";

/**
 * Helper function to export table data to CSV
 * @param {Object} params - Parameters for the export
 * @param {React.RefObject<HTMLTableElement>} params.tableRef - Reference to the table element
 * @param {[]} params.data - Array of data to be exported
 * @param {[] string} params.headers - Array of headers for the table
 * @param {Function} params.rowMapper - Function to map each data item to a row array
 * @param {string} params.filename - Name of the CSV file
 */
export const exportTableToCsv = async ({ tableRef, data, headers, rowMapper, filename }) => {
    if (!tableRef.current) return;

    // Map the data to rows
    const rows = data.map(rowMapper);

    // Combine headers and rows
    const csvData = [headers, ...rows];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};
