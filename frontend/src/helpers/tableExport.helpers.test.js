import { describe, it, expect, vi, beforeEach } from "vitest";
import * as XLSX from "@e965/xlsx";
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
        const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array", cellStyles: true });
        const ws = wb.Sheets["Sheet1"];
        if (!ws) throw new Error("Worksheet 'Sheet1' not found in generated workbook");
        return ws;
    };

    /**
     * Read a row's values as a plain array.
     * @param {import("@e965/xlsx").WorkSheet} ws
     * @param {number} rowNumber
     */
    const rowValues = (ws, rowNumber) => {
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
        return rows[rowNumber - 1] ?? [];
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
        expect(ws["C2"].z).toBe(CURRENCY_FORMAT);
        expect(ws["D2"].z).toBe(CURRENCY_FORMAT);
    });

    it("should handle empty currencyColumns array", async () => {
        const data = [{ id: 1, name: "Test", amount: 100 }];
        const headers = ["ID", "Name", "Amount"];
        /** @param {{ id: number; name: string; amount: number }} item */
        const rowMapper = (item) => [item.id, item.name, item.amount];

        await exportTableToXlsx({ data, headers, rowMapper, currencyColumns: [] });

        const ws = await readWorkbookFromBlob();
        expect(ws["C2"].z).not.toBe(CURRENCY_FORMAT);
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
        expect(ws["C2"].z).toBe(CURRENCY_FORMAT);
        expect(ws["C3"].z).not.toBe(CURRENCY_FORMAT);
    });
});

describe("exportMultiSheetToXlsx", () => {
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
        return XLSX.read(new Uint8Array(arrayBuffer), { type: "array", cellStyles: true });
    };

    it("should throw if no sheets are provided", async () => {
        const { exportMultiSheetToXlsx } = await import("./tableExport.helpers");

        await expect(exportMultiSheetToXlsx({ sheets: [] })).rejects.toThrow("At least one sheet is required");
        await expect(exportMultiSheetToXlsx(/** @type {any} */ ({}))).rejects.toThrow("At least one sheet is required");
    });

    it("should create a workbook with multiple sheets", async () => {
        const { exportMultiSheetToXlsx } = await import("./tableExport.helpers");

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

        expect(anchor.click).toHaveBeenCalledOnce();

        const wb = await readWorkbookFromBlob();
        expect(wb.Sheets["All"]).toBeDefined();
        expect(wb.Sheets["Step 1"]).toBeDefined();

        const allSheet = wb.Sheets["All"];
        const rows = XLSX.utils.sheet_to_json(allSheet, { header: 1, raw: true });
        expect(rows[1]).toEqual([1, "Alice"]);
    });

    it("should apply currency formatting to specified columns per sheet", async () => {
        const { exportMultiSheetToXlsx } = await import("./tableExport.helpers");

        const sheets = [
            {
                name: "Sheet1",
                headers: ["ID", "Name", "Amount"],
                rows: [[1, "Test", 500.0]],
                currencyColumns: [2]
            }
        ];

        await exportMultiSheetToXlsx({ sheets });

        const wb = await readWorkbookFromBlob();
        const ws = wb.Sheets["Sheet1"];
        expect(ws["C2"].z).toBe(CURRENCY_FORMAT);
    });
});
