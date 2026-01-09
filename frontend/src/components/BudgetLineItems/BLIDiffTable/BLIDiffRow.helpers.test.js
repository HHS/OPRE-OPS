import { getChangeRequestTypes } from "./BLIDiffRow.helpers";

describe("BLIDiffRow.helpers", () => {
    describe("getChangeRequestTypes", () => {
        const mockBudgetLine = {
            change_requests_in_review: [
                {
                    has_budget_change: true,
                    requested_change_data: { amount: 100000 }
                },
                {
                    has_proc_shop_change: true,
                    requested_change_data: { awarding_entity_id: 2 }
                }
            ]
        };

        it("should return awarding_entity_id when isProcShopChange is true, isBLIInReview is true, and has_proc_shop_change is true", () => {
            const result = getChangeRequestTypes(
                false, // isBudgetChange
                true, // isBLIInReview
                true, // isProcShopChange
                mockBudgetLine,
                false, // isStatusChange
                "" // changeRequestStatus
            );

            expect(result).toContain("awarding_entity_id");
        });

        it("should return empty array when isProcShopChange is true but has_proc_shop_change is false", () => {
            const budgetLineWithoutProcShopChange = {
                change_requests_in_review: [
                    {
                        has_budget_change: true,
                        has_proc_shop_change: false,
                        requested_change_data: { amount: 100000 }
                    }
                ]
            };

            const result = getChangeRequestTypes(
                false, // isBudgetChange
                true, // isBLIInReview
                true, // isProcShopChange
                budgetLineWithoutProcShopChange,
                false, // isStatusChange
                "" // changeRequestStatus
            );

            expect(result).not.toContain("awarding_entity_id");
            expect(result).toEqual([]);
        });

        it("should return empty array when isProcShopChange is true but isBLIInReview is false", () => {
            const result = getChangeRequestTypes(
                false, // isBudgetChange
                false, // isBLIInReview <- FALSE
                true, // isProcShopChange
                mockBudgetLine,
                false, // isStatusChange
                "" // changeRequestStatus
            );

            expect(result).not.toContain("awarding_entity_id");
            expect(result).toEqual([]);
        });

        it("should return budget change keys when isBudgetChange is true", () => {
            const result = getChangeRequestTypes(
                true, // isBudgetChange
                true, // isBLIInReview
                false, // isProcShopChange
                mockBudgetLine,
                false, // isStatusChange
                "" // changeRequestStatus
            );

            expect(result).toContain("amount");
        });
    });
});
