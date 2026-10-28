import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ModificationDocumentUploads from "./ModificationDocumentUploads";

/** True for a DisabledButtonWithTooltip: a disabled button inside a focusable, aria-disabled wrapper. */
const isDisabledWithReachableTooltip = (name) => {
    const matches = screen.getAllByRole("button", { name });
    const button = matches.find((el) => el.tagName === "BUTTON");
    const wrapper = matches.find((el) => el.tagName === "DIV");
    return (
        Boolean(button?.disabled) &&
        wrapper?.getAttribute("tabindex") === "0" &&
        wrapper?.getAttribute("aria-disabled") === "true"
    );
};

describe("ModificationDocumentUploads", () => {
    it("shows every upload action disabled until document upload is available in OPS", () => {
        render(<ModificationDocumentUploads />);

        const documents = [
            "Contract Modification Memo",
            "Revised Independent Government Cost Estimate (IGCE)",
            "Certificate of Funding",
            "Revised Statement of Requirements (SOW/PWS)",
            "Additional Documents"
        ];
        documents.forEach((label) => expect(isDisabledWithReachableTooltip(`Upload file: ${label}`)).toBe(true));
    });
});
