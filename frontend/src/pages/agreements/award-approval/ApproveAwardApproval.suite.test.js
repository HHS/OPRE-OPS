import { describe, it, expect, beforeEach } from "vitest";
import suite from "./ApproveAwardApproval.suite";

describe("ApproveAwardApproval.suite", () => {
    beforeEach(() => {
        suite.reset();
    });

    it("flags a missing obligated date as required", () => {
        const res = suite.run({ obligatedDate: "" }, "obligatedDate");
        expect(res.hasErrors("obligatedDate")).toBe(true);
        expect(res.getErrors("obligatedDate")).toContain("Obligated Date is required");
    });

    it("flags a malformed date", () => {
        const res = suite.run({ obligatedDate: "13/45/2024" }, "obligatedDate");
        expect(res.hasErrors("obligatedDate")).toBe(true);
    });

    it("flags a well-formatted but invalid calendar date", () => {
        const res = suite.run({ obligatedDate: "02/31/2024" }, "obligatedDate");
        expect(res.hasErrors("obligatedDate")).toBe(true);
        expect(res.getErrors("obligatedDate")).toContain("Date must be a valid calendar date");
    });

    it("passes for a valid MM/DD/YYYY date", () => {
        const res = suite.run({ obligatedDate: "09/30/2024" }, "obligatedDate");
        expect(res.hasErrors("obligatedDate")).toBe(false);
    });
});
