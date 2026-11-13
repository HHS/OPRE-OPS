import { describe, expect, it } from "vitest";
import { getAgreementTotalCardValues } from "./AgreementBLIAccordion.helpers";

const agreement = {
    procurement_shop: { abbr: "GCS", fee_percentage: 5 },
    budget_line_items: [
        { id: 1, status: "PLANNED", amount: 1000 },
        { id: 2, status: "DRAFT", amount: 500 },
        { id: 3, status: "OBLIGATED", amount: 2000 }
    ]
};

describe("getAgreementTotalCardValues", () => {
    it("totals the non-Draft budget lines plus procurement shop fees", () => {
        expect(getAgreementTotalCardValues(agreement, [], false)).toEqual({
            budgetLines: [agreement.budget_line_items[0], agreement.budget_line_items[2]],
            subtotal: 3000,
            fees: 150,
            total: 3150
        });
    });

    it("adds the selected Draft budget lines after the change", () => {
        const selectedDraft = agreement.budget_line_items[1];

        const { subtotal, fees, total } = getAgreementTotalCardValues(agreement, [selectedDraft], true);

        expect(subtotal).toBe(3500);
        expect(fees).toBe(175);
        expect(total).toBe(3675);
    });
});
