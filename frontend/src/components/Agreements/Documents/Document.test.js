import {
    convertFileSizeToMB,
    downloadFileFromMemory,
    isFileValid,
    processUploading,
    sanitizeDownloadFilename,
    uploadDocumentToInMemory
} from "./Document.js";
import { describe, vi } from "vitest";

test("convertFileSizeToMB should convert bytes to megabytes correctly", () => {
    expect(convertFileSizeToMB(1048576)).toBe(1);
    expect(convertFileSizeToMB(2097152)).toBe(2);
    expect(convertFileSizeToMB(5242880)).toBe(5);
});

describe("isFileValid", () => {
    test("should return true for valid file types", () => {
        const file = { name: "document.pdf" };
        expect(isFileValid(file)).toBe(true);

        const file2 = { name: "spreadsheet.xlsx" };
        expect(isFileValid(file2)).toBe(true);

        const file3 = { name: "presentation.docx" };
        expect(isFileValid(file3)).toBe(true);
    });

    test("should return false for invalid file types", () => {
        const file = { name: "document.txt" };
        expect(isFileValid(file)).toBe(false);

        const file2 = { name: "image.png" };
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

describe("sanitizeDownloadFilename", () => {
    it("returns a safe fallback for non-string input", () => {
        expect(sanitizeDownloadFilename(null)).toBe("document");
        expect(sanitizeDownloadFilename(undefined)).toBe("document");
        expect(sanitizeDownloadFilename(123)).toBe("document");
        expect(sanitizeDownloadFilename("")).toBe("document");
    });

    it("strips path separators", () => {
        expect(sanitizeDownloadFilename("../../../etc/passwd")).toBe("_.._.._etc_passwd");
        expect(sanitizeDownloadFilename("foo\\bar\\baz.pdf")).toBe("foo_bar_baz.pdf");
    });

    it("strips leading dots that could hide the file on disk", () => {
        expect(sanitizeDownloadFilename("...hidden.pdf")).toBe("hidden.pdf");
    });

    it("strips ASCII control characters and DEL", () => {
        expect(sanitizeDownloadFilename("report\r\nevil.pdf")).toBe("report__evil.pdf");
        expect(sanitizeDownloadFilename("name\x00with\x1Fnull.pdf")).toBe("name_with_null.pdf");
        expect(sanitizeDownloadFilename("del\x7Fchar.pdf")).toBe("del_char.pdf");
    });

    it("preserves normal file names", () => {
        expect(sanitizeDownloadFilename("quarterly-report.xlsx")).toBe("quarterly-report.xlsx");
        expect(sanitizeDownloadFilename("Agreement_1234.docx")).toBe("Agreement_1234.docx");
        expect(sanitizeDownloadFilename("My Report (Final).pdf")).toBe("My Report (Final).pdf");
    });
});

describe("triggerDownload (via downloadFileFromMemory)", () => {
    const originalCreateElement = document.createElement.bind(document);
    /** @type {{ href: string; download: string; click: import("vitest").Mock }} */
    let anchor;
    /** @type {import("vitest").Mock} */
    let appendChildSpy;

    beforeEach(async () => {
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
        appendChildSpy = /** @type {any} */ (vi.spyOn(document.body, "appendChild"));
        console.error = vi.fn();

        // Seed the in-memory store with a file keyed by a known uuid.
        const file = new File(["payload"], "..report/with\\slashes.pdf", { type: "application/pdf" });
        await uploadDocumentToInMemory("uuid-test", file);
    });

    it("does not attach the anchor to the DOM (avoids DOM-XSS sink)", () => {
        downloadFileFromMemory("uuid-test");
        expect(anchor.click).toHaveBeenCalledOnce();
        expect(appendChildSpy).not.toHaveBeenCalled();
    });

    it("sanitizes the download filename before assigning it to a.download", () => {
        downloadFileFromMemory("uuid-test");
        expect(anchor.download).toBe("report_with_slashes.pdf");
    });
});
