import { describe, it, expect, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";

// Mock the utils module
const mockGetCurrentLocalTimestamp = vi.fn(() => "2023-01-01_12-00-00");
vi.mock("./utils", () => ({
    getCurrentLocalTimestamp: mockGetCurrentLocalTimestamp
}));

// Mock the XLSX library
vi.mock("xlsx", () => ({
    utils: {
        aoa_to_sheet: vi.fn(),
        book_new: vi.fn(() => ({})),
        book_append_sheet: vi.fn(),
        decode_range: vi.fn(),
        encode_cell: vi.fn()
    },
    write: vi.fn(() => new Uint8Array(10))
}));

describe("exportTableToXlsx", () => {
    const originalCreateElement = document.createElement.bind(document);

    beforeEach(() => {
        vi.clearAllMocks();

        if (!URL.createObjectURL) {
            Object.defineProperty(URL, "createObjectURL", {
                writable: true,
                value: vi.fn()
            });
        }

        if (!URL.revokeObjectURL) {
            Object.defineProperty(URL, "revokeObjectURL", {
                writable: true,
                value: vi.fn()
            });
        }

        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

        vi.spyOn(document, "createElement").mockImplementation((tagName, options) => {
            if (tagName === "a") {
                return {
                    href: "",
                    download: "",
                    click: vi.fn()
                };
            }

            return originalCreateElement(tagName, options);
        });
    });

    it("should export table data to XLSX successfully", async () => {
        // Import the function after mocks are set up
        const { exportTableToXlsx } = await import("./tableExport.helpers");

        const data = [
            { id: 1, name: "John Doe", age: 30 },
            { id: 2, name: "Jane Doe", age: 25 }
        ];
        const headers = ["ID", "Name", "Age"];
        const rowMapper = (item) => [item.id, item.name, item.age];
        const filename = "test.xlsx";

        await exportTableToXlsx({ data, headers, rowMapper, filename });

        // Verify XLSX processing
        expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([headers, [1, "John Doe", 30], [2, "Jane Doe", 25]]);
        expect(XLSX.utils.book_new).toHaveBeenCalled();
        expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
        expect(XLSX.write).toHaveBeenCalled();
    });

    it("should throw an error if required parameters are missing", async () => {
        const { exportTableToXlsx } = await import("./tableExport.helpers");

        await expect(exportTableToXlsx({})).rejects.toThrow("Missing required parameters");
    });

    it("should apply currency formatting to specified columns", async () => {
        const { exportTableToXlsx } = await import("./tableExport.helpers");

        const data = [{ id: 1, name: "Project A", budget: 1000.5, cost: 800.25 }];
        const headers = ["ID", "Name", "Budget", "Cost"];
        const rowMapper = (item) => [item.id, item.name, item.budget, item.cost];
        const currencyColumns = [2, 3];

        // Create a mock worksheet
        const mockWorksheet = {
            "!ref": "A1:D2",
            C2: { v: 1000.5 },
            D2: { v: 800.25 }
        };

        vi.mocked(XLSX.utils.aoa_to_sheet).mockReturnValue(mockWorksheet);
        vi.mocked(XLSX.utils.decode_range).mockReturnValue({ s: { r: 0, c: 0 }, e: { r: 1, c: 3 } });
        vi.mocked(XLSX.utils.encode_cell).mockImplementation(({ r, c }) => {
            const cols = ["A", "B", "C", "D"];
            return `${cols[c]}${r + 1}`;
        });

        await exportTableToXlsx({ data, headers, rowMapper, currencyColumns });

        // Verify currency formatting was applied
        expect(mockWorksheet.C2.z).toBe('"$"#,##0.00_);("$"#,##0.00)');
        expect(mockWorksheet.D2.z).toBe('"$"#,##0.00_);("$"#,##0.00)');
    });

    it("should handle empty currencyColumns array", async () => {
        const { exportTableToXlsx } = await import("./tableExport.helpers");

        const data = [{ id: 1, name: "Test", amount: 100 }];
        const headers = ["ID", "Name", "Amount"];
        const rowMapper = (item) => [item.id, item.name, item.amount];
        const currencyColumns = [];

        const mockWorksheet = { "!ref": "A1:C2" };
        vi.mocked(XLSX.utils.aoa_to_sheet).mockReturnValue(mockWorksheet);

        await exportTableToXlsx({ data, headers, rowMapper, currencyColumns });

        // Should not call decode_range when currencyColumns is empty
        expect(XLSX.utils.decode_range).not.toHaveBeenCalled();
    });

    it("should only format numeric values in currency columns", async () => {
        const { exportTableToXlsx } = await import("./tableExport.helpers");

        const data = [
            { id: 1, name: "Project", budget: 1000.5 },
            { id: 2, name: "Task", budget: "N/A" }
        ];
        const headers = ["ID", "Name", "Budget"];
        const rowMapper = (item) => [item.id, item.name, item.budget];
        const currencyColumns = [2];

        const mockWorksheet = {
            "!ref": "A1:C3",
            C2: { v: 1000.5 },
            C3: { v: "N/A" }
        };

        vi.mocked(XLSX.utils.aoa_to_sheet).mockReturnValue(mockWorksheet);
        vi.mocked(XLSX.utils.decode_range).mockReturnValue({ s: { r: 0, c: 0 }, e: { r: 2, c: 2 } });
        vi.mocked(XLSX.utils.encode_cell).mockImplementation(({ r, c }) => {
            const cols = ["A", "B", "C"];
            return `${cols[c]}${r + 1}`;
        });

        await exportTableToXlsx({ data, headers, rowMapper, currencyColumns });

        // Only numeric values should be formatted
        expect(mockWorksheet.C2.z).toBe('"$"#,##0.00_);("$"#,##0.00)');
        expect(mockWorksheet.C3.z).toBeUndefined();
    });
});
