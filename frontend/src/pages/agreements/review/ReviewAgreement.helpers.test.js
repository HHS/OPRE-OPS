import { anyBudgetLinesByStatus } from "./ReviewAgreement.helpers";

describe("anyBudgetLinesByStatus", () => {
    const agreement = {
        budget_line_items: [
            { id: 1, status: "DRAFT" },
            { id: 2, status: "PLANNED" },
            { id: 3, status: "EXECUTING" }
        ]
    };

    it("returns true when there are budget line items with the given status", () => {
        const result = anyBudgetLinesByStatus(agreement, "DRAFT");
        expect(result).toBeTruthy();
    });

    it("returns false when there are no budget line items with the given status", () => {
        const result = anyBudgetLinesByStatus(agreement, "CLOSED");
        expect(result).toBeFalsy();
    });

    it("returns false when the agreement has no budget line items", () => {
        const agreementWithoutBudgetLines = {};
        const result = anyBudgetLinesByStatus(agreementWithoutBudgetLines, "DRAFT");
        expect(result).toBeFalsy();
    });
});
