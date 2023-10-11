import { setActionableBudgetLines, anyBudgetLinesByStatus } from "./ReviewAgreement.helpers";

describe("setActionableBudgetLines", () => {
    const agreement = {
        budget_line_items: [
            { id: 1, status: "DRAFT" },
            { id: 2, status: "PLANNED" },
            { id: 3, status: "EXECUTING" }
        ]
    };

    it("returns draft budget line items when action is 'Change Draft Budget Lines to Planned Status'", () => {
        const result = setActionableBudgetLines(agreement, "Change Draft Budget Lines to Planned Status");
        expect(result).toEqual([{ id: 1, status: "DRAFT" }]);
    });

    it("returns planned budget line items when action is 'Change Planned Budget Lines to Executing Status'", () => {
        const result = setActionableBudgetLines(agreement, "Change Planned Budget Lines to Executing Status");
        expect(result).toEqual([{ id: 2, status: "PLANNED" }]);
    });

    it("returns an empty array when action is not recognized", () => {
        const result = setActionableBudgetLines(agreement, "Invalid Action");
        expect(result).toEqual([]);
    });
});
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
