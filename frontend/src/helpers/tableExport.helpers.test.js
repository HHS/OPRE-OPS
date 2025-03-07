import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { exportTableToCsv } from "./tableExport.helpers";
import Papa from "papaparse";

describe("exportTableToCsv", () => {
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

    it("should export table data to CSV", async () => {
        const data = [
            { id: 1, name: "John Doe", age: 30 },
            { id: 2, name: "Jane Doe", age: 25 }
        ];
        const headers = ["ID", "Name", "Age"];
        const rowMapper = (item) => [item.id, item.name, item.age];
        const filename = "test.csv";

        // Mock the createElement and click functions
        const createElementSpy = vi.spyOn(document, "createElement");
        const clickSpy = vi.fn();
        createElementSpy.mockReturnValue({
            click: clickSpy,
            setAttribute: vi.fn(),
            style: {}
        });

        await exportTableToCsv({ data, headers, rowMapper, filename });

        // Verify the CSV content
        Papa.unparse([headers, ...data.map(rowMapper)]);
        expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
        expect(createElementSpy).toHaveBeenCalledWith("a");
        expect(clickSpy).toHaveBeenCalled();
        expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:url");

        // Restore mocks
        createElementSpy.mockRestore();
    });

    it("should throw an error if required parameters are missing", async () => {
        await expect(exportTableToCsv({})).rejects.toThrow("Missing required parameters");
    });
});
