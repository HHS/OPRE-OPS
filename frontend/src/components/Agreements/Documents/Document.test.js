import {
    convertFileSizeToMB,
    isFileValid,
    processUploading,
} from "./Document.js";
import {describe, vi} from "vitest"

test("convertFileSizeToMB should convert bytes to megabytes correctly", () => {
    expect(convertFileSizeToMB(1048576)).toBe(1);
    expect(convertFileSizeToMB(2097152)).toBe(2);
    expect(convertFileSizeToMB(5242880)).toBe(5);
});

describe("isFileValid", () => {
    test("should return true for valid file types", () => {
        const file = {name: "document.pdf"};
        expect(isFileValid(file)).toBe(true);

        const file2 = {name: "spreadsheet.xlsx"};
        expect(isFileValid(file2)).toBe(true);

        const file3 = {name: "presentation.docx"};
        expect(isFileValid(file3)).toBe(true);
    });

    test("should return false for invalid file types", () => {
        const file = {name: "document.txt"};
        expect(isFileValid(file)).toBe(false);

        const file2 = {name: "image.png"};
        expect(isFileValid(file2)).toBe(false);

        expect(isFileValid(null)).toBe(false);
    });
});

describe("processUploading", () => {
    const agreementId = 1;
    const uuid = "1234-5678-90ab-cdef";
    const file = { name: "test-file.txt" };

    let mockUploadDocumentToInMemory;
    let mockUploadDocumentToBlob;

    beforeEach(() => {
        mockUploadDocumentToInMemory = vi.fn();
        mockUploadDocumentToBlob = vi.fn();
        console.error = vi.fn();
    });

    it("should upload to in-memory storage", async () => {
        const sasUrl = "https://mock.FakeDocumentRepository";

        await processUploading(sasUrl, uuid, file, agreementId, mockUploadDocumentToInMemory, mockUploadDocumentToBlob);

        expect(console.error).not.toHaveBeenCalled();
        expect(mockUploadDocumentToInMemory).toHaveBeenCalledWith(uuid, file);
    });

    it("should upload to Azure Blob Storage", async () => {
        const sasUrl = "https://mock.ops.opre.acf.gov";

        await processUploading(sasUrl, uuid, file, agreementId, mockUploadDocumentToBlob, mockUploadDocumentToBlob);

         expect(console.error).not.toHaveBeenCalled();
        expect(mockUploadDocumentToBlob).toHaveBeenCalledWith(sasUrl, uuid, file);
    });

    it("should log an error for invalid repository type", async () => {
        const sasUrl = "https://mock.invalid-repo";

        await processUploading(sasUrl, uuid, file, agreementId, mockUploadDocumentToInMemory, mockUploadDocumentToBlob);

        expect(mockUploadDocumentToInMemory).not.toHaveBeenCalled();
        expect(mockUploadDocumentToBlob).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith("Invalid repository type:", sasUrl);
    });

    it("should handle errors gracefully", async () => {
        const sasUrl = "https://mock.ops.opre.acf.gov";

        mockUploadDocumentToBlob.mockRejectedValue(new Error("Upload failed"));

        await processUploading(sasUrl, uuid, file, agreementId, mockUploadDocumentToInMemory, mockUploadDocumentToBlob);

        expect(mockUploadDocumentToBlob).toHaveBeenCalledWith(sasUrl, uuid, file);
        expect(console.error).toHaveBeenCalledWith("Error processing upload:", expect.any(Error));
    });
});
