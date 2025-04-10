import { getProcurementShopSubTotal } from "./agreement.helpers";
import { BLI_STATUS } from "./budgetLines.helpers";

describe("getProcurementShopSubTotal", () => {
    /** @type {import("../components/Agreements/AgreementTypes").Agreement} */
    let agreement;
    /** @type {import("../components/BudgetLineItems/BudgetLineTypes").BudgetLine[]} */
    let budgetLines;

    beforeEach(() => {
        agreement = {
            procurement_shop: {
                fee: 10
            },
            budget_line_items: [
                { amount: 100, status: BLI_STATUS.DRAFT },
                { amount: 200, status: "APPROVED" }
            ]
        };
        budgetLines = [
            { amount: 50, status: BLI_STATUS.DRAFT },
            { amount: 150, status: "APPROVED" }
        ];
    });

    it("returns 0 if procurement_shop is not present", () => {
        agreement.procurement_shop = null;
        const result = getProcurementShopSubTotal(agreement);
        expect(result).toBe(0);
    });

    it("excludes DRAFT budget lines before approval", () => {
        const result = getProcurementShopSubTotal(agreement, budgetLines, false);
        // Only the APPROVED budget line (150 * 10)
        expect(result).toBe(1500);
    });

    it("includes all budget lines after approval", () => {
        const result = getProcurementShopSubTotal(agreement, budgetLines, true);
        // Both DRAFT and APPROVED budget lines ((50 + 150) * 10)
        expect(result).toBe(2000);
    });

    it("handles empty or undefined amounts", () => {
        budgetLines = [
            { amount: undefined, status: BLI_STATUS.DRAFT },
            { amount: 100, status: "APPROVED" }
        ];
        const result = getProcurementShopSubTotal(agreement, budgetLines, true);
        // Should treat undefined amount as 0
        expect(result).toBe(1000);
    });

    it("calculates total based on agreement.budget_line_items if budgetLines not provided", () => {
        const result = getProcurementShopSubTotal(agreement, [], true);
        // Both DRAFT and APPROVED budget lines from agreement ((100 + 200) * 10)
        expect(result).toBe(3000);
    });
});
