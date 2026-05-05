import { describe, it, expect, vi, beforeEach } from "vitest";
import ExcelJS from "exceljs";
import { exportTableToXlsx } from "./tableExport.helpers";

const CURRENCY_FORMAT = '"$"#,##0.00_);("$"#,##0.00)';

vi.mock("./utils", () => ({
    getCurrentLocalTimestamp: () => "2023-01-01_12-00-00"
}));

describe("exportTableToXlsx", () => {
    const originalCreateElement = document.createElement.bind(document);
    /** @type {{ href: string; download: string; click: import("vitest").Mock }} */
    let anchor;

    beforeEach(() => {
        vi.restoreAllMocks();

        if (!URL.createObjectURL) {
            Object.defineProperty(URL, "createObjectURL", { writable: true, value: vi.fn() });
        }
        if (!URL.revokeObjectURL) {
            Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: vi.fn() });
        }
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-url");
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

        anchor = { href: "", download: "", click: vi.fn() };
        vi.spyOn(document, "createElement").mockImplementation(
            /** @type {(tagName: string, options?: ElementCreationOptions) => HTMLElement} */ (tagName, options) => {
                if (tagName === "a") return /** @type {any} */ (anchor);
                return originalCreateElement(tagName, options);
            }
        );
    });

    const readWorkbookFromBlob = async () => {
        const createObjectURL = /** @type {import("vitest").Mock} */ (/** @type {unknown} */ (URL.createObjectURL));
        const createCall = createObjectURL.mock.calls[0];
        expect(createCall, "expected a Blob to be handed to URL.createObjectURL").toBeDefined();
        /** @type {Blob} */
        const blob = createCall[0];
        const arrayBuffer = await blob.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(arrayBuffer);
        const ws = wb.getWorksheet("Sheet1");
        if (!ws) throw new Error("Worksheet 'Sheet1' not found in generated workbook");
        return ws;
    };

    /**
     * Read a row's values as a plain array (1-indexed values in ExcelJS; slice off the leading empty entry).
     * @param {import("exceljs").Worksheet} ws
     * @param {number} rowNumber
     */
    const rowValues = (ws, rowNumber) => {
        const raw = ws.getRow(rowNumber).values;
        const arr = Array.isArray(raw) ? raw : [];
        return arr.slice(1);
    };

    it("should export table data to XLSX successfully", async () => {
        const data = [
            { id: 1, name: "John Doe", age: 30 },
            { id: 2, name: "Jane Doe", age: 25 }
        ];
        const headers = ["ID", "Name", "Age"];
        /** @param {{ id: number; name: string; age: number }} item */
        const rowMapper = (item) => [item.id, item.name, item.age];

        await exportTableToXlsx({ data, headers, rowMapper, filename: "test.xlsx" });

        expect(anchor.click).toHaveBeenCalledOnce();
        expect(anchor.download).toBe("test.xlsx_2023-01-01_12-00-00.xlsx");

        const ws = await readWorkbookFromBlob();
        expect(rowValues(ws, 1)).toEqual(headers);
        expect(rowValues(ws, 2)).toEqual([1, "John Doe", 30]);
        expect(rowValues(ws, 3)).toEqual([2, "Jane Doe", 25]);
    });

    it("should throw an error if required parameters are missing", async () => {
        await expect(exportTableToXlsx(/** @type {any} */ ({}))).rejects.toThrow("Missing required parameters");
    });

    it("should apply currency formatting to specified columns", async () => {
        const data = [{ id: 1, name: "Project A", budget: 1000.5, cost: 800.25 }];
        const headers = ["ID", "Name", "Budget", "Cost"];
        /** @param {{ id: number; name: string; budget: number; cost: number }} item */
        const rowMapper = (item) => [item.id, item.name, item.budget, item.cost];

        await exportTableToXlsx({ data, headers, rowMapper, currencyColumns: [2, 3] });

        const ws = await readWorkbookFromBlob();
        expect(ws.getCell("C2").numFmt).toBe(CURRENCY_FORMAT);
        expect(ws.getCell("D2").numFmt).toBe(CURRENCY_FORMAT);
    });

    it("should handle empty currencyColumns array", async () => {
        const data = [{ id: 1, name: "Test", amount: 100 }];
        const headers = ["ID", "Name", "Amount"];
        /** @param {{ id: number; name: string; amount: number }} item */
        const rowMapper = (item) => [item.id, item.name, item.amount];

        await exportTableToXlsx({ data, headers, rowMapper, currencyColumns: [] });

        const ws = await readWorkbookFromBlob();
        expect(ws.getCell("C2").numFmt).toBeFalsy();
    });

    it("should only format numeric values in currency columns", async () => {
        const data = [
            { id: 1, name: "Project", budget: 1000.5 },
            { id: 2, name: "Task", budget: "N/A" }
        ];
        const headers = ["ID", "Name", "Budget"];
        /** @param {{ id: number; name: string; budget: number | string }} item */
        const rowMapper = (item) => [item.id, item.name, item.budget];

        await exportTableToXlsx({ data, headers, rowMapper, currencyColumns: [2] });

        const ws = await readWorkbookFromBlob();
        expect(ws.getCell("C2").numFmt).toBe(CURRENCY_FORMAT);
        expect(ws.getCell("C3").numFmt).toBeFalsy();
    });
});

describe("exportMultiSheetToXlsx", () => {
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

    it("should throw if no sheets are provided", async () => {
        const { exportMultiSheetToXlsx } = await import("./tableExport.helpers");

        await expect(exportMultiSheetToXlsx({ sheets: [] })).rejects.toThrow("At least one sheet is required");
        await expect(exportMultiSheetToXlsx({})).rejects.toThrow("At least one sheet is required");
    });

    it("should create a workbook with multiple sheets", async () => {
        const { exportMultiSheetToXlsx } = await import("./tableExport.helpers");

        vi.mocked(XLSX.utils.aoa_to_sheet).mockReturnValue({});

        const sheets = [
            {
                name: "All",
                headers: ["ID", "Name"],
                rows: [
                    [1, "Alice"],
                    [2, "Bob"]
                ]
            },
            {
                name: "Step 1",
                headers: ["ID", "Name"],
                rows: [[1, "Alice"]]
            }
        ];

        await exportMultiSheetToXlsx({ sheets, filename: "test" });

        // Should create one workbook and append two sheets
        expect(XLSX.utils.book_new).toHaveBeenCalledTimes(1);
        expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
        expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), "All");
        expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), "Step 1");
        expect(XLSX.write).toHaveBeenCalled();
    });

    it("should apply currency formatting to specified columns per sheet", async () => {
        const { exportMultiSheetToXlsx } = await import("./tableExport.helpers");

        const mockWorksheet = {
            "!ref": "A1:C2",
            C2: { v: 500.0 }
        };

        vi.mocked(XLSX.utils.aoa_to_sheet).mockReturnValue(mockWorksheet);
        vi.mocked(XLSX.utils.decode_range).mockReturnValue({ s: { r: 0, c: 0 }, e: { r: 1, c: 2 } });
        vi.mocked(XLSX.utils.encode_cell).mockImplementation(({ r, c }) => {
            const cols = ["A", "B", "C"];
            return `${cols[c]}${r + 1}`;
        });

        const sheets = [
            {
                name: "Sheet1",
                headers: ["ID", "Name", "Amount"],
                rows: [[1, "Test", 500.0]],
                currencyColumns: [2]
            }
        ];

        await exportMultiSheetToXlsx({ sheets });

        expect(mockWorksheet.C2.z).toBe('"$"#,##0.00_);("$"#,##0.00)');
    });
});
