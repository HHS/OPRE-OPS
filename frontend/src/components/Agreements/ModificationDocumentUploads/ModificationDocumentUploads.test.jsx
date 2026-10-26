import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ModificationDocumentUploads from "./ModificationDocumentUploads";

describe("ModificationDocumentUploads", () => {
    it("shows every slot disabled until document upload is available in OPS", () => {
        render(<ModificationDocumentUploads />);

        const slots = [
            "Contract Modification Memo",
            "Revised Independent Government Cost Estimate (IGCE)",
            "Certificate of Funding",
            "Revised Statement of Requirements (SOW/PWS)",
            "Additional Documents (if applicable)"
        ];
        slots.forEach((label) => expect(screen.getByRole("button", { name: `Upload File: ${label}` })).toBeDisabled());
    });
});
