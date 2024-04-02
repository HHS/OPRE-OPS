import { getProcurementShopSubTotal } from "./agreement.helpers";

describe("getProcurementShopSubTotal", () => {
    let agreement;
    let budgetLines;

    beforeEach(() => {
        agreement = {
            procurement_shop: {
                fee: 10
            },
            budget_line_items: [{ amount: 100 }, { amount: 200 }]
        };
        budgetLines = [{ amount: 50 }, { amount: 150 }];
    });

    it("returns 0 if procurement_shop is not present", () => {
        agreement.procurement_shop = null;
        const result = getProcurementShopSubTotal(agreement);
        expect(result).toBe(0);
    });

    it("calculates total based on budgetLines if provided", () => {
        const result = getProcurementShopSubTotal(agreement, budgetLines);
        expect(result).toBe(2000); // Assuming calculateTotal multiplies amount by fee
    });

    it("calculates total based on agreement.budget_line_items if budgetLines not provided", () => {
        const result = getProcurementShopSubTotal(agreement);
        expect(result).toBe(3000); // Assuming calculateTotal multiplies amount by fee
    });
});
