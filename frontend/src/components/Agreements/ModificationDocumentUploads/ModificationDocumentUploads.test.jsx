import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ModificationDocumentUploads from "./ModificationDocumentUploads";

const addDocumentMock = vi.fn();
const updateDocumentStatusMock = vi.fn();
const processUploadingMock = vi.fn();

vi.mock("../../../api/opsAPI", () => ({
    useAddDocumentMutation: () => [addDocumentMock],
    useUpdateDocumentStatusMutation: () => [updateDocumentStatusMock]
}));

vi.mock("../Documents/Document", async (importOriginal) => ({
    ...(await importOriginal()),
    processUploading: (...args) => processUploadingMock(...args)
}));

const pickFile = (documentType, name) => {
    // The file input is hidden behind the button and has no accessible name.
    // eslint-disable-next-line testing-library/no-node-access
    const input = document.getElementById(`mod-document-${documentType}`);
    fireEvent.change(input, { target: { files: [new File(["x"], name)] } });
};

describe("ModificationDocumentUploads", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        addDocumentMock.mockReturnValue({
            unwrap: () => Promise.resolve({ url: "FakeDocumentRepository/abc", uuid: "abc" })
        });
        updateDocumentStatusMock.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    });

    it("uploads a picked file to the agreement with the slot's document type", async () => {
        render(<ModificationDocumentUploads agreementId={42} />);

        pickFile("contract-modification-memo", "memo.pdf");

        await waitFor(() =>
            expect(updateDocumentStatusMock).toHaveBeenCalledWith({
                document_id: "abc",
                data: { agreement_id: 42, status: "uploaded" }
            })
        );
        expect(addDocumentMock).toHaveBeenCalledWith(
            expect.objectContaining({
                agreement_id: 42,
                document_type: "CONTRACT_MODIFICATION_MEMO",
                document_name: "memo.pdf"
            })
        );
        expect(processUploadingMock).toHaveBeenCalled();
        expect(await screen.findByText("memo.pdf")).toBeInTheDocument();
    });

    it("rejects a file type that can't be uploaded", () => {
        render(<ModificationDocumentUploads agreementId={42} />);

        pickFile("certification-of-funding", "funding.exe");

        expect(screen.getByRole("alert")).toHaveTextContent("Invalid file type");
        expect(addDocumentMock).not.toHaveBeenCalled();
    });

    it("reports a failed upload", async () => {
        addDocumentMock.mockReturnValue({ unwrap: () => Promise.reject(new Error("500")) });
        render(<ModificationDocumentUploads agreementId={42} />);

        pickFile("additional-document", "notes.docx");

        expect(await screen.findByRole("alert")).toHaveTextContent("Failed to upload document");
    });
});
