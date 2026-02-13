import {
    BLI_STATUS,
    getBudgetLineCreatedDate,
    getBudgetByStatus,
    getNonDRAFTBudgetLines,
    hasBlIsInReview,
    hasAnyBliInSelectedStatus,
    groupByServicesComponent,
    isBLIPermanent,
    canLabel,
    BLILabel,
    getAgreementTypesCount,
    areAllBudgetLinesInReview,
    getTooltipLabel,
    getProcurementShopFeeTooltip,
    getProcurementShopLabel,
    calculateProcShopFeePercentage
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

    it("should include services component without budget lines", () => {
        const budgetLines = [
            { services_component_id: 1, services_component_number: 10, serviceComponentGroupingLabel: "10" }
        ];
        const servicesComponents = [
            { id: 1, number: 10, sub_component: null },
            { id: 2, number: 20, sub_component: null }
        ];
        const result = groupByServicesComponent(budgetLines, servicesComponents);

        expect(result).toEqual([
            {
                servicesComponentNumber: 10,
                serviceComponentGroupingLabel: "10",
                budgetLines: [
                    { services_component_id: 1, services_component_number: 10, serviceComponentGroupingLabel: "10" }
                ]
            },
            {
                servicesComponentNumber: 20,
                serviceComponentGroupingLabel: "20",
                budgetLines: []
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
        agreement: { procurement_shop: { abbr: "DEF", current_fee: { fee: 3 } } }
    };

    it("returns correct tooltip for obligated with procurement_shop_fee", () => {
        expect(getProcurementShopFeeTooltip(obligatedBLI)).toBe("FY 2024 Fee Rate: ABC 5%");
    });
    it("returns correct tooltip for planned with agreement", () => {
        expect(getProcurementShopFeeTooltip(plannedBLI)).toBe("Current Fee Rate: DEF 3%");
    });
    it("returns correct tooltip for obligated with null procurement_shop_fee", () => {
        const bli = {
            status: BLI_STATUS.OBLIGATED,
            procurement_shop_fee: null,
            agreement: { procurement_shop: { abbr: "XYZ", current_fee: { fee: 3 } } },
            fiscal_year: 2023
        };
        expect(getProcurementShopFeeTooltip(bli)).toBe("FY 2023 Fee Rate: XYZ 3%");
    });
    it("returns correct tooltip for missing agreement and procurement_shop_fee", () => {
        const bli = { status: BLI_STATUS.PLANNED };
        expect(getProcurementShopFeeTooltip(bli)).toBe("Current Fee Rate:  0%");
    });
});

describe("getProcurementShopLabel", () => {
    const obligatedBLI = {
        status: BLI_STATUS.OBLIGATED,
        procurement_shop_fee: { fee: 5, procurement_shop: { abbr: "ABC" } },
        fiscal_year: 2024,
        agreement: { procurement_shop: { abbr: "ABC", current_fee: { fee: 5 } } }
    };
    const plannedBLI = {
        status: BLI_STATUS.PLANNED,
        agreement: { procurement_shop: { abbr: "DEF", current_fee: { fee: 7 } } }
    };

    it("returns correct label for obligated BLI", () => {
        expect(getProcurementShopLabel(obligatedBLI)).toBe("ABC - FY 2024 Fee Rate : 5%");
    });
    it("returns correct label for planned BLI", () => {
        expect(getProcurementShopLabel(plannedBLI)).toBe("DEF - Current Fee Rate : 7%");
    });
    it("returns correct label for obligated with no agreement procurement_shop", () => {
        const bli = {
            status: BLI_STATUS.OBLIGATED,
            procurement_shop_fee: { fee: 5, procurement_shop: { abbr: "ABC" } },
            fiscal_year: 2024,
            agreement: {}
        };
        expect(getProcurementShopLabel(bli)).toBe("ABC - FY 2024 Fee Rate : 5%");
    });
    it("returns correct label for planned with no agreement procurement_shop", () => {
        const bli = {
            status: BLI_STATUS.PLANNED,
            agreement: {}
        };
        expect(getProcurementShopLabel(bli)).toBe("TBD - Current Fee Rate : 0%");
    });
    it("returns TBD if no agreement", () => {
        expect(getProcurementShopLabel({})).toBe("TBD - Current Fee Rate : 0%");
    });
});

describe("hasAnyBliInSelectedStatus", () => {
    it("should return true when any budget line has the selected status", () => {
        const budgetLines = [
            { id: 1, status: BLI_STATUS.DRAFT },
            { id: 2, status: BLI_STATUS.PLANNED },
            { id: 3, status: BLI_STATUS.OBLIGATED }
        ];
        const result = hasAnyBliInSelectedStatus(budgetLines, BLI_STATUS.OBLIGATED);
        expect(result).toBe(true);
    });

    it("should return false when no budget line has the selected status", () => {
        const budgetLines = [
            { id: 1, status: BLI_STATUS.DRAFT },
            { id: 2, status: BLI_STATUS.PLANNED },
            { id: 3, status: BLI_STATUS.EXECUTING }
        ];
        const result = hasAnyBliInSelectedStatus(budgetLines, BLI_STATUS.OBLIGATED);
        expect(result).toBe(false);
    });

    it("should return false when budget lines array is empty", () => {
        const result = hasAnyBliInSelectedStatus([], BLI_STATUS.OBLIGATED);
        expect(result).toBe(false);
    });

    it("should return false when budget lines is null", () => {
        const result = hasAnyBliInSelectedStatus(null, BLI_STATUS.OBLIGATED);
        expect(result).toBe(false);
    });

    it("should return false when budget lines is undefined", () => {
        const result = hasAnyBliInSelectedStatus(undefined, BLI_STATUS.OBLIGATED);
        expect(result).toBe(false);
    });

    it("should handle all BLI_STATUS values correctly", () => {
        const budgetLines = [
            { id: 1, status: BLI_STATUS.DRAFT },
            { id: 2, status: BLI_STATUS.PLANNED },
            { id: 3, status: BLI_STATUS.EXECUTING },
            { id: 4, status: BLI_STATUS.OBLIGATED }
        ];

        expect(hasAnyBliInSelectedStatus(budgetLines, BLI_STATUS.DRAFT)).toBe(true);
        expect(hasAnyBliInSelectedStatus(budgetLines, BLI_STATUS.PLANNED)).toBe(true);
        expect(hasAnyBliInSelectedStatus(budgetLines, BLI_STATUS.EXECUTING)).toBe(true);
        expect(hasAnyBliInSelectedStatus(budgetLines, BLI_STATUS.OBLIGATED)).toBe(true);
    });

    it("should return true when multiple budget lines have the selected status", () => {
        const budgetLines = [
            { id: 1, status: BLI_STATUS.OBLIGATED },
            { id: 2, status: BLI_STATUS.PLANNED },
            { id: 3, status: BLI_STATUS.OBLIGATED }
        ];
        const result = hasAnyBliInSelectedStatus(budgetLines, BLI_STATUS.OBLIGATED);
        expect(result).toBe(true);
    });

    // NOTE: For determining if an agreement is awarded, use the agreement.is_awarded property
    // instead of checking if any BLI has OBLIGATED status. The tests above are still valid
    // for other use cases like checking individual BLI statuses.
    it("should not be used to determine if agreement is awarded - use agreement.is_awarded instead", () => {
        // This test documents the old pattern that should not be used anymore
        const budgetLines = [{ id: 1, status: BLI_STATUS.OBLIGATED }];

        // Old pattern (deprecated for award status):
        const oldPatternResult = hasAnyBliInSelectedStatus(budgetLines, BLI_STATUS.OBLIGATED);

        // New pattern (recommended for award status):
        const mockAgreement = { is_awarded: true };
        const newPatternResult = mockAgreement.is_awarded;

        // Both might be true, but agreement.is_awarded is the authoritative source
        expect(oldPatternResult).toBe(true);
        expect(newPatternResult).toBe(true);

        // The key difference is that agreement.is_awarded is calculated by the backend
        // and considers more than just BLI status (e.g., contract execution, etc.)
    });
});

describe("calculateProcShopFeePercentage", () => {
    it("returns fee from procurement_shop_fee when present", () => {
        const bli = { procurement_shop_fee: { fee: 5 } };
        expect(calculateProcShopFeePercentage(bli)).toBe(5);
    });

    it("returns 0 when procurement_shop_fee is present but fee is null", () => {
        const bli = { procurement_shop_fee: { fee: null } };
        expect(calculateProcShopFeePercentage(bli)).toBe(0);
    });

    it("returns 0 when procurement_shop_fee has fee of 0", () => {
        const bli = { procurement_shop_fee: { fee: 0 } };
        expect(calculateProcShopFeePercentage(bli)).toBe(0);
    });

    it("falls back to agreement.procurement_shop.current_fee.fee when procurement_shop_fee is null", () => {
        const bli = {
            procurement_shop_fee: null,
            agreement: { procurement_shop: { current_fee: { fee: 3 } } }
        };
        expect(calculateProcShopFeePercentage(bli)).toBe(3);
    });

    it("falls back to agreement.procurement_shop.current_fee.fee when procurement_shop_fee is undefined", () => {
        const bli = {
            agreement: { procurement_shop: { current_fee: { fee: 7 } } }
        };
        expect(calculateProcShopFeePercentage(bli)).toBe(7);
    });

    it("returns 0 when agreement has no current_fee", () => {
        const bli = { agreement: { procurement_shop: {} } };
        expect(calculateProcShopFeePercentage(bli)).toBe(0);
    });

    it("returns 0 when agreement.procurement_shop.current_fee is null", () => {
        const bli = { agreement: { procurement_shop: { current_fee: null } } };
        expect(calculateProcShopFeePercentage(bli)).toBe(0);
    });

    it("returns 0 when no procurement_shop_fee, no agreement, and no fallback", () => {
        expect(calculateProcShopFeePercentage({})).toBe(0);
    });

    it("returns 0 when agreement is null", () => {
        const bli = { procurement_shop_fee: null, agreement: null };
        expect(calculateProcShopFeePercentage(bli)).toBe(0);
    });
});
