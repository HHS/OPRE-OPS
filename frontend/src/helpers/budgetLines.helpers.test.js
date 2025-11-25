import {
    BLI_STATUS,
    getBudgetLineCreatedDate,
    getBudgetByStatus,
    getNonDRAFTBudgetLines,
    hasBlIsInReview,
    groupByServicesComponent,
    isBLIPermanent,
    canLabel,
    BLILabel,
    getAgreementTypesCount,
    areAllBudgetLinesInReview,
    getTooltipLabel,
    getProcurementShopFeeTooltip,
    getProcurementShopLabel
} from "./budgetLines.helpers";
import { budgetLine, agreement } from "../tests/data";

describe("getBudgetLineCreatedDate", () => {
    it("should return a human readable date", () => {
        const result = getBudgetLineCreatedDate(budgetLine);

        expect(result).toBe("May 27, 2024");
    });
    it("should return today's date if no created date is provided", () => {
        const result = getBudgetLineCreatedDate({});
        const today = new Date();

        expect(result).toBe(
            `${today.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}`
        );
    });
    it("should return today's date if created date is null", () => {
        const result = getBudgetLineCreatedDate({ created_on: null });
        const today = new Date();

        expect(result).toBe(
            `${today.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}`
        );
    });
});
describe("getBudgetByStatus", () => {
    it("should return an array of budget lines filtered by status", () => {
        const result = getBudgetByStatus(agreement.budget_line_items, [BLI_STATUS.DRAFT]);

        expect(result).toHaveLength(2);

        for (const bli of result) {
            expect(bli.status).toBe(BLI_STATUS.DRAFT);
        }
    });
    it("should return an empty array if no budget lines match the status", () => {
        const result = getBudgetByStatus(agreement.budget_line_items, ["NOT_A_STATUS"]);

        expect(result).toHaveLength(0);
    });
    it("should return budget lines with the given status", () => {
        const budgetLines = [
            { status: "DRAFT" },
            { status: "PLANNED" },
            { status: "EXECUTING" },
            { status: "OBLIGATED" }
        ];
        const result = getBudgetByStatus(budgetLines, [BLI_STATUS.DRAFT, BLI_STATUS.PLANNED]);
        expect(result).toEqual([{ status: "DRAFT" }, { status: "PLANNED" }]);
    });
});
describe("getNonDRAFTBudgetLines", () => {
    it("should return an array of budget lines that are not in draft status", () => {
        const budgetLines = [
            { status: "DRAFT" },
            { status: "PLANNED" },
            { status: "EXECUTING" },
            { status: "OBLIGATED" }
        ];

        const result = getNonDRAFTBudgetLines(budgetLines);
        expect(result).toHaveLength(3);
    });
    it("should return an empty array if all budget lines are in draft status", () => {
        const result = getNonDRAFTBudgetLines(agreement.budget_line_items); // they are all in draft status
        expect(result).toHaveLength(0);
    });
    it("should return an empty array if no budget lines are provided", () => {
        const result = getNonDRAFTBudgetLines([]);
        expect(result).toHaveLength(0);
    });
    it.fails("should throw an error if no budget lines are provided", () => {
        const result = getNonDRAFTBudgetLines(null);
        expect(result).toThrowError(/budgetLine must be an object/i);
    });
});
describe("hasBlIsInReview", () => {
    it("should return false if none of the budget lines is in_review", () => {
        const budgetLines = agreement.budget_line_items.map((bli) => ({ ...bli, in_review: false }));
        const result = hasBlIsInReview(budgetLines);

        expect(result).toBe(false);
    });
    it("should return true if at least one of the budget lines is in_review", () => {
        const budgetLines = agreement.budget_line_items.map((bli) => ({ ...bli, in_review: true }));

        const result = hasBlIsInReview(budgetLines);

        expect(result).toBe(true);
    });
    it("should return false if no budget lines are provided", () => {
        const result = hasBlIsInReview([]);

        expect(result).toBe(false);
    });
    it.fails("should throw an error if no budget lines are provided", () => {
        const result = hasBlIsInReview(null);

        expect(result).toThrowError(/budgetLine must be an object/i);
    });
});
describe("groupByServicesComponent", () => {
    it("should group budget lines by services component", () => {
        const budgetLines = [
            { services_component_id: 1, services_component_number: 10, serviceComponentGroupingLabel: "10-1.1" },
            { services_component_id: 2, services_component_number: 20, serviceComponentGroupingLabel: "20-1.1" },
            { services_component_id: 1, services_component_number: 10, serviceComponentGroupingLabel: "10-1.1" },
            { services_component_id: 3, services_component_number: 30, serviceComponentGroupingLabel: "30-1.1" },
            { services_component_id: 1, services_component_number: 10, serviceComponentGroupingLabel: "10-1.1" }
        ];
        const result = groupByServicesComponent(budgetLines);

        expect(result).toEqual([
            {
                servicesComponentNumber: 10,
                serviceComponentGroupingLabel: "10-1.1",
                budgetLines: [
                    {
                        services_component_id: 1,
                        services_component_number: 10,
                        serviceComponentGroupingLabel: "10-1.1"
                    },
                    {
                        services_component_id: 1,
                        services_component_number: 10,
                        serviceComponentGroupingLabel: "10-1.1"
                    },
                    { services_component_id: 1, services_component_number: 10, serviceComponentGroupingLabel: "10-1.1" }
                ]
            },
            {
                servicesComponentNumber: 20,
                serviceComponentGroupingLabel: "20-1.1",
                budgetLines: [
                    { services_component_id: 2, services_component_number: 20, serviceComponentGroupingLabel: "20-1.1" }
                ]
            },
            {
                servicesComponentNumber: 30,
                serviceComponentGroupingLabel: "30-1.1",
                budgetLines: [
                    { services_component_id: 3, services_component_number: 30, serviceComponentGroupingLabel: "30-1.1" }
                ]
            }
        ]);
    });
    it("should return an empty array if no budget lines are provided", () => {
        const result = groupByServicesComponent([]);

        expect(result).toEqual([]);
    });
    it.fails("should throw an error if no budget lines are provided", () => {
        const result = groupByServicesComponent(null);

        expect(result).toThrowError(/budgetLine must be an object/i);
    });
});
describe("isBLIPermanent", () => {
    it("should return true if the budget line is permanent", () => {
        const result = isBLIPermanent(budgetLine);

        expect(result).toBe(true);
    });
    it("should return false if the budget line is not permanent", () => {
        const result = isBLIPermanent({});

        expect(result).toBe(false);
    });
    it("should return false if no budget line is provided", () => {
        const result = isBLIPermanent(null);

        expect(result).toBe(false);
    });
});
describe("canLabel", () => {
    it("should return the can label of the budget line", () => {
        const result = canLabel(budgetLine);

        expect(result).toBe("G994426");
    });
    it("should return TBD if the budget line has no can", () => {
        const result = canLabel({});

        expect(result).toBe("TBD");
    });
    it.fails("should throw an error if no budget line is provided", () => {
        const result = canLabel(null);

        expect(result).toThrowError(/budgetLine must be an object/i);
    });
});
describe("BLILabel", () => {
    it("should return the BLI label (id) of the budget line", () => {
        const result = BLILabel(budgetLine);

        expect(result).toBe(1);
    });
    it("should return the BLI label (id) with different id value", () => {
        const updatedBLI = { ...budgetLine, id: 2 };
        const result = BLILabel(updatedBLI);

        expect(result).toBe(2);
    });
    it("should return TBD if the budget line has no id", () => {
        const result = BLILabel({});

        expect(result).toBe("TBD");
    });
    it.fails("should throw an error if no budget line is provided", () => {
        const result = BLILabel(null);

        expect(result).toThrowError(/budgetLine must be an object/i);
    });
});

describe("getAgreementTypesCount helpers", () => {
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

describe("areAllBudgetLinesInReview helpers", () => {
    const allBudgetlinesInReview = [{ in_review: true }, { in_review: true }, { in_review: true }, { in_review: true }];
    const notAllBudgetlinesInReview = [
        { in_review: true },
        { in_review: true },
        { in_review: false },
        { in_review: false }
    ];

    test("Should return true if all budgetLines are in review", () => {
        const result = areAllBudgetLinesInReview(allBudgetlinesInReview);
        expect(result).toBe(true);
    });
    test("Should return false if not all budgetLines are in review", () => {
        const result = areAllBudgetLinesInReview(notAllBudgetlinesInReview);
        expect(result).toBe(false);
    });
    test("Should return false if no budgetLines are provided", () => {
        const result = areAllBudgetLinesInReview([]);
        expect(result).toBe(false);
    });
});

describe("getTooltipLabel", () => {
    it("returns the executing-status tooltip", () => {
        const result = getTooltipLabel({ status: BLI_STATUS.EXECUTING });
        expect(result).toBe("If you need to edit a budget line in Executing Status, please contact the budget team");
    });
    it("returns the obligated-status tooltip", () => {
        const result = getTooltipLabel({ status: BLI_STATUS.OBLIGATED });
        expect(result).toBe("Obligated budget lines cannot be edited");
    });
    it("returns an empty string for any other status", () => {
        const result = getTooltipLabel({ status: "SOMETHING_ELSE" });
        expect(result).toBe("");
    });
    it("returns an empty string if passed null or undefined", () => {
        expect(getTooltipLabel(null)).toBe("");
        expect(getTooltipLabel(undefined)).toBe("");
    });
});

describe("getProcurementShopFeeTooltip", () => {
    const obligatedBLI = {
        status: BLI_STATUS.OBLIGATED,
        procurement_shop_fee: { fee: 5, procurement_shop: { abbr: "ABC" } },
        fiscal_year: 2024
    };
    const plannedBLI = {
        status: BLI_STATUS.PLANNED,
        agreement: { awarding_entity_id: 2 }
    };
    const currentProcShopFeePercentage = 3;

    it("returns correct tooltip for obligated with procurement_shop_fee", () => {
        expect(getProcurementShopFeeTooltip(obligatedBLI, currentProcShopFeePercentage)).toBe(
            "FY 2024 Fee Rate: ABC 5%"
        );
    });
    it("returns correct tooltip for planned with agreement", () => {
        expect(getProcurementShopFeeTooltip(plannedBLI, currentProcShopFeePercentage)).toBe("Current Fee Rate:  3%");
    });
    it("returns correct tooltip for obligated with null procurement_shop_fee", () => {
        const bli = {
            status: BLI_STATUS.OBLIGATED,
            procurement_shop_fee: null,
            agreement: { procurement_shop: { abbr: "XYZ", fee_percentage: 3 } },
            fiscal_year: 2023
        };
        expect(getProcurementShopFeeTooltip(bli, currentProcShopFeePercentage)).toBe("FY 2023 Fee Rate: XYZ 3%");
    });
    it("returns correct tooltip for missing agreement and procurement_shop_fee", () => {
        const bli = { status: BLI_STATUS.PLANNED };
        expect(getProcurementShopFeeTooltip(bli, currentProcShopFeePercentage)).toBe("Current Fee Rate:  3%");
    });
});

describe("getProcurementShopLabel", () => {
    const obligatedBLI = {
        status: BLI_STATUS.OBLIGATED,
        procurement_shop_fee: { fee: 5, procurement_shop: { abbr: "ABC" } },
        fiscal_year: 2024,
        agreement: { procurement_shop: { abbr: "ABC", fee_percentage: 5 } }
    };
    const plannedBLI = {
        status: BLI_STATUS.PLANNED,
        agreement: { procurement_shop: { abbr: "DEF", fee_percentage: 7 } }
    };
    const currentProcShopFeePercentage = 3;

    it("returns correct label for obligated with explicit code", () => {
        expect(getProcurementShopLabel(obligatedBLI, "ZZZ", currentProcShopFeePercentage)).toBe(
            "ZZZ - FY 2024 Fee Rate : 5%"
        );
    });
    it("returns correct label for planned with explicit code", () => {
        expect(getProcurementShopLabel(plannedBLI, "YYY", currentProcShopFeePercentage)).toBe(
            "YYY - Current Fee Rate :  3%"
        );
    });
    it("returns correct label for obligated with no code", () => {
        expect(getProcurementShopLabel(obligatedBLI, undefined, currentProcShopFeePercentage)).toBe(
            "TBD - FY 2024 Fee Rate : 5%"
        );
    });
    it("returns correct label for planned with no code", () => {
        expect(getProcurementShopLabel(plannedBLI, undefined, currentProcShopFeePercentage)).toBe(
            "TBD - Current Fee Rate :  3%"
        );
    });
    it("returns N/A if no code or agreement", () => {
        expect(getProcurementShopLabel({}, undefined, currentProcShopFeePercentage)).toBe(
            "TBD - Current Fee Rate :  3%"
        );
    });
});
