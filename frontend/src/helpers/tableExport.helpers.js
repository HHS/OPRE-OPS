import Papa from "papaparse";

/**
 * Helper function to export table data to CSV
 * @param {Object} params - Parameters for the export
 * @param {any[]} params.data - Array of data to be exported
 * @param {string[]} params.headers - Array of headers for the table
 * @param {() => void} params.rowMapper - Function to map each data item to a row array
 * @param {string} [params.filename] - Name of the CSV file
 */
export const exportTableToCsv = async ({ data, headers, rowMapper, filename = "export.csv" }) => {
    if (!data || !headers || !rowMapper) {
        throw new Error("Missing required parameters");
    }

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
