import { budgetLine } from "../../../tests/data";
import { getAgreementTypesCount } from "./PortfolioSpending.helpers";

describe("PortfolioSpending helpers", () => {
    test("Should handle budgetLines without agreements", () => {
        const budgetlines = [{ ...budgetLine, agreement: null }];
        const result = getAgreementTypesCount(budgetlines);
        expect(result).toEqual([]);
    });

    test("getAgreementTypesCount should return correct counts", () => {
        const budgetlines = [
            { agreement: { name: "Agreement 1", agreement_type: "Type A" } },
            { agreement: { name: "Agreement 2", agreement_type: "Type B" } },
            { agreement: { name: "Agreement 1", agreement_type: "Type A" } },
            { agreement: { name: "", agreement_type: "Type C" } }
        ];
        const expectedCounts = [
            {
                count: 1,
                type: "Type A"
            },
            {
                count: 1,
                type: "Type B"
            }
        ];
        const result = getAgreementTypesCount(budgetlines);
        expect(result).toEqual(expectedCounts);
    });
});
