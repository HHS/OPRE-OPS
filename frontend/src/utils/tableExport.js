import Papa from "papaparse";

/**
 * Helper function to export table data to CSV
 * @param {Object} params - Parameters for the export
 * @param {React.RefObject<HTMLTableElement>} params.tableRef - Reference to the table element
 * @param {[]any} params.data - Array of data to be exported
 * @param {Function} params.rowMapper - Function to map each data item to a row array
 * @param {string} params.filename - Name of the CSV file
 */
export const exportTableToCsv = async ({ tableRef, data, rowMapper, filename }) => {
    if (!tableRef.current) return;

    // Get headers from th elements
    const headers = Array.from(tableRef.current.querySelectorAll("thead th")).map((header) => {
        const clone = header.cloneNode(true);
        clone.querySelectorAll(".usa-tooltip__body").forEach(
            /** @param {HTMLElement} tooltip */
            (tooltip) => tooltip.remove()
        );
        return clone.textContent?.trim();
    });

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
