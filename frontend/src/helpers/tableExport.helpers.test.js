import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { exportTableToXlsx } from "./tableExport.helpers";
import * as XLSX from "xlsx";

// Mock XLSX module
vi.mock("xlsx", () => ({
    utils: {
        aoa_to_sheet: vi.fn(() => ({})),
        book_new: vi.fn(() => ({})),
        book_append_sheet: vi.fn()
    },
    write: vi.fn(() => new Uint8Array(10))
}));

describe("exportTableToXlsx", () => {
    let createObjectURLSpy;
    let revokeObjectURLSpy;

    beforeAll(() => {
        global.URL = { createObjectURL: vi.fn(() => "blob:url"), revokeObjectURL: vi.fn() };
        createObjectURLSpy = vi.spyOn(global.URL, "createObjectURL");
        revokeObjectURLSpy = vi.spyOn(global.URL, "revokeObjectURL");
    });

    afterAll(() => {
        createObjectURLSpy.mockRestore();
        revokeObjectURLSpy.mockRestore();
    });

    it("should export table data to XLSX", async () => {
        const data = [
            { id: 1, name: "John Doe", age: 30 },
            { id: 2, name: "Jane Doe", age: 25 }
        ];
        const headers = ["ID", "Name", "Age"];
        const rowMapper = (item) => [item.id, item.name, item.age];
        const filename = "test.xlsx";

        // Mock the createElement and click functions
        const createElementSpy = vi.spyOn(document, "createElement");
        const clickSpy = vi.fn();
        createElementSpy.mockReturnValue({
            href: "",
            download: "",
            click: clickSpy,
            setAttribute: vi.fn(),
            style: {}
        });

        await exportTableToXlsx({ data, headers, rowMapper, filename });

        // Verify XLSX processing
        const expectedRows = data.map(rowMapper);
        const expectedExcelData = [headers, ...expectedRows];

        expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(expectedExcelData);
        expect(XLSX.utils.book_new).toHaveBeenCalled();
        expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), "Sheet1");
        expect(XLSX.write).toHaveBeenCalledWith(expect.any(Object), { bookType: "xlsx", type: "array" });

        // Verify download mechanics
        expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
        expect(createElementSpy).toHaveBeenCalledWith("a");
        expect(clickSpy).toHaveBeenCalled();
        expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:url");

        // Restore mocks
        createElementSpy.mockRestore();
    });

    it("should throw an error if required parameters are missing", async () => {
        await expect(exportTableToXlsx({})).rejects.toThrow("Missing required parameters");
    });
});
