import {
    convertFileSizeToMB,
    isFileValid,
    patchStatus,
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


describe("patchStatus", () => {
    it("should update status and log success message on successful patch", async () => {
        const uuid = "1234-5678-90ab-cdef";
        const statusData = { status: "uploaded" };
        const mockResponse = { success: true };
        vi.mock("frontend/src/api/patchDocumentStatus", async () => {
            return vi.fn().mockResolvedValue(mockResponse);
        })
        const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await patchStatus(uuid, statusData);

        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
        expect(consoleLogSpy).toHaveBeenCalledWith(`UUID=${uuid} - Status updated to "${statusData.status}".`);

        consoleLogSpy.mockRestore();
    });
});

describe("processUploading", () => {
    const status = "uploaded";
    const agreementId = 1;
    const uuid = "1234-5678-90ab-cdef";
    const file = { name: "test-file.txt" };

    let mockUploadDocumentToInMemory;
    let mockUploadDocumentToBlob;
    let mockPatchStatus;

    beforeEach(() => {
        mockUploadDocumentToInMemory = vi.fn();
        mockUploadDocumentToBlob = vi.fn();
        mockPatchStatus = vi.fn();
        console.error = vi.fn();
    });

    it("should upload to in-memory storage", async () => {
        const sasUrl = "https://mock.FakeDocumentRepository";

        await processUploading(sasUrl, uuid, file, agreementId, mockUploadDocumentToInMemory, mockUploadDocumentToBlob, mockPatchStatus);

         expect(console.error).not.toHaveBeenCalled();
        expect(mockUploadDocumentToInMemory).toHaveBeenCalledWith(uuid, file);
        expect(mockPatchStatus).toHaveBeenCalledWith(uuid, {
            agreement_id: agreementId,
            status: status
        });
    });

    it("should upload to Azure Blob Storage", async () => {
        const sasUrl = "https://mock.blob.core.windows.net";

        await processUploading(sasUrl, uuid, file, agreementId, mockUploadDocumentToBlob, mockUploadDocumentToBlob, mockPatchStatus);

         expect(console.error).not.toHaveBeenCalled();
        expect(mockUploadDocumentToBlob).toHaveBeenCalledWith(sasUrl, uuid, file);
        expect(mockPatchStatus).toHaveBeenCalledWith(uuid, {
            agreement_id: agreementId,
            status: status
        });
    });

    it("should log an error for invalid repository type", async () => {
        const sasUrl = "https://mock.invalid-repo";

        await processUploading(sasUrl, uuid, file, agreementId, mockUploadDocumentToInMemory, mockUploadDocumentToBlob, mockPatchStatus);

        expect(mockUploadDocumentToInMemory).not.toHaveBeenCalled();
        expect(mockUploadDocumentToBlob).not.toHaveBeenCalled();
        expect(mockPatchStatus).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith("Invalid repository type:", sasUrl);
    });

    it("should handle errors gracefully", async () => {
        const sasUrl = "https://mock.blob.core.windows.net";

        mockUploadDocumentToBlob.mockRejectedValue(new Error("Upload failed"));

        await processUploading(sasUrl, uuid, file, agreementId, mockUploadDocumentToInMemory, mockUploadDocumentToBlob, mockPatchStatus);

        expect(mockUploadDocumentToBlob).toHaveBeenCalledWith(sasUrl, uuid, file);
        expect(mockPatchStatus).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith("Error processing upload:", expect.any(Error));
    });
});
