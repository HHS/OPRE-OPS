import {
    getCurrentFiscalYear,
    calculatePercent,
    convertCodeForDisplay,
    fiscalYearFromDate,
    renderField,
    toSlugCase,
    toTitleCaseFromSlug,
    toLowerCaseFromSlug,
    fromUpperCaseToTitleCase,
    timeAgo,
    formatDateToMonthDayYear,
    computeDisplayPercent,
    computeDisplayPercents,
    applyMinimumArcValue
} from "./utils";

test("current federal fiscal year is calculated correctly", () => {
    const lastDay = new Date("September 30, 2022");
    const firstDay = new Date("October 1, 2022");

    expect(getCurrentFiscalYear(lastDay)).toEqual("2022");
    expect(getCurrentFiscalYear(firstDay)).toEqual("2023");
});

test("percent is calculated correctly", () => {
    expect(calculatePercent(2, 4)).toEqual(50);
    expect(calculatePercent(3, 4)).toEqual(75);
    expect(calculatePercent(7, 4)).toEqual(175);
    expect(calculatePercent(0, 4)).toEqual(0);
});

test("codes are converted for display correctly", () => {
    expect(() => convertCodeForDisplay("__foo__", "test_code")).toThrow("Invalid list name");
    expect(convertCodeForDisplay("agreementType", "__foo__")).toEqual("__foo__");
    expect(convertCodeForDisplay("agreementType", "GRANT")).toEqual("Grant");
    expect(convertCodeForDisplay("agreementReason", "NEW_REQ")).toEqual("New Requirement");
    expect(convertCodeForDisplay("changeToTypes", "amount")).toEqual("Amount");
    expect(convertCodeForDisplay("changeToTypes", "can_id")).toEqual("CAN");
    expect(convertCodeForDisplay("changeToTypes", "date_needed")).toEqual("Obligate By Date");
    expect(convertCodeForDisplay("changeToTypes", "status")).toEqual("Status");
    expect(convertCodeForDisplay("budgetLineItemPropertyLabels", "services_component")).toEqual("Services Component");
    expect(convertCodeForDisplay("contractType", "HYBRID")).toEqual("Hybrid");
    expect(convertCodeForDisplay("contractType", "FIRM_FIXED_PRICE")).toEqual("Firm Fixed Price (FFP)");
    expect(convertCodeForDisplay("contractType", "TIME_AND_MATERIALS")).toEqual("Time & Materials (T&M)");
    expect(convertCodeForDisplay("contractType", "COST_PLUS_FIXED_FEE")).toEqual("Cost Plus Fixed Fee (CPFF)");
    expect(convertCodeForDisplay("contractType", "COST_PLUS_AWARD_FEE")).toEqual("Cost Plus Award Fee (CPAF)");
});

test("fiscal year are calculated correctly", () => {
    expect(fiscalYearFromDate(null)).toEqual("TBD");
    expect(fiscalYearFromDate("--")).toEqual("TBD");
    expect(fiscalYearFromDate("2033-01-01")).toEqual(2033);
    expect(fiscalYearFromDate("2033-09-30")).toEqual(2033);
    expect(fiscalYearFromDate("2033-10-01")).toEqual(2034);
});

test("renderField converts values correctly for display", () => {
    expect(renderField("No Matching Class", "No Matching Field", "anything")).toEqual("anything");
    expect(renderField(null, "date_needed", null)).toEqual(null);
    expect(renderField(null, "amount", 1222333)).toEqual("$1,222,333.00");
    expect(renderField(null, "agreement_reason", null)).toEqual(null);
    expect(renderField(null, "agreement_reason", "RECOMPETE")).toEqual("Recompete");
    expect(renderField(null, "agreement_type", "CONTRACT")).toEqual("Contract");
});

test("renders slug from a string", () => {
    expect(toSlugCase("Budget Change")).toEqual("budget-change");
    expect(toSlugCase("Status Change")).toEqual("status-change");
    expect(toSlugCase("Budget Change Request")).toEqual("budget-change-request");
    expect(toSlugCase("Status Change Request")).toEqual("status-change-request");
    expect(toSlugCase("")).toEqual("");
    expect(toSlugCase(null)).toEqual("");
    expect(toSlugCase(undefined)).toEqual("");
    expect(toSlugCase(true)).toEqual("");
});

test("renders titlecase from slug", () => {
    expect(toTitleCaseFromSlug("budget-change")).toEqual("Budget Change");
    expect(toTitleCaseFromSlug("status-change")).toEqual("Status Change");
    expect(toTitleCaseFromSlug("budget-change-request")).toEqual("Budget Change Request");
    expect(toTitleCaseFromSlug("status-change-request")).toEqual("Status Change Request");
    expect(toTitleCaseFromSlug("")).toEqual("");
    expect(toTitleCaseFromSlug(null)).toEqual("");
    expect(toTitleCaseFromSlug(undefined)).toEqual("");
    expect(toTitleCaseFromSlug(true)).toEqual("");
});

test("renders lowercase from slug", () => {
    expect(toLowerCaseFromSlug("budget-change")).toEqual("budget change");
    expect(toLowerCaseFromSlug("status-change")).toEqual("status change");
    expect(toLowerCaseFromSlug("budget-change-request")).toEqual("budget change request");
    expect(toLowerCaseFromSlug("status-change-request")).toEqual("status change request");
    expect(toLowerCaseFromSlug("")).toEqual("");
    expect(toLowerCaseFromSlug(null)).toEqual("");
    expect(toLowerCaseFromSlug(undefined)).toEqual("");
    expect(toLowerCaseFromSlug(true)).toEqual("");
});

test("renders uppercase to titlecase", () => {
    expect(fromUpperCaseToTitleCase("BUDGET-CHANGE")).toEqual("Budget Change");
    expect(fromUpperCaseToTitleCase("STATUS-CHANGE")).toEqual("Status Change");
    expect(fromUpperCaseToTitleCase("BUDGET-CHANGE-REQUEST")).toEqual("Budget Change Request");
    expect(fromUpperCaseToTitleCase("STATUS-CHANGE-REQUEST")).toEqual("Status Change Request");
    expect(fromUpperCaseToTitleCase("ACQUISITION_PLANNING")).toEqual("Acquisition Planning");
    expect(fromUpperCaseToTitleCase("PRE_SOLICITATION")).toEqual("Pre Solicitation");
    expect(fromUpperCaseToTitleCase("SOLICITATION   PHASE")).toEqual("Solicitation Phase");
    expect(fromUpperCaseToTitleCase("")).toEqual("");
    expect(fromUpperCaseToTitleCase(null)).toEqual("");
    expect(fromUpperCaseToTitleCase(undefined)).toEqual("");
    expect(fromUpperCaseToTitleCase(true)).toEqual("");
});

describe("timeAgo", () => {
    beforeEach(() => {
        // Mock the current date to be fixed
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2023-01-01T12:00:00Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("handles null and undefined input", () => {
        expect(timeAgo(null)).toBeNull();
        expect(timeAgo(undefined)).toBeNull();
    });

    test("shows 'now' for very recent dates", () => {
        const date = new Date("2023-01-01T11:59:57Z"); // 3 seconds ago
        expect(timeAgo(date)).toBe("now");
    });

    test("shows seconds for recent dates", () => {
        const date = new Date("2023-01-01T11:59:30Z"); // 30 seconds ago
        expect(timeAgo(date)).toBe("30 seconds ago");
    });

    test("shows 'about a minute ago' for ~1 minute", () => {
        const date = new Date("2023-01-01T11:58:35Z"); // 85 seconds ago
        expect(timeAgo(date)).toBe("about a minute ago");
    });

    test("shows minutes for < 1 hour", () => {
        const date = new Date("2023-01-01T11:30:00Z"); // 30 minutes ago
        expect(timeAgo(date)).toBe("30 minutes ago");
    });

    test("shows hours for < 24 hours", () => {
        const date = new Date("2023-01-01T06:00:00Z"); // 6 hours ago
        expect(timeAgo(date)).toBe("6 hours ago");
    });

    test("shows full date for dates > 24 hours ago", () => {
        const date = new Date("2022-12-30T12:00:00Z"); // 2 days ago
        expect(timeAgo(date)).toBe("December 30, 2022");
    });

    test("handles ISO string dates with timezone", () => {
        expect(timeAgo("2023-01-01T11:30:00Z")).toBe("30 minutes ago");
    });

    test("handles ISO string dates without timezone", () => {
        expect(timeAgo("2023-01-01T11:30:00")).toBe("30 minutes ago");
    });
});

describe("formatDateToMonthDayYear", () => {
    test("formats valid date strings correctly", () => {
        expect(formatDateToMonthDayYear("2023-05-19")).toBe("May 19, 2023");
        expect(formatDateToMonthDayYear("2024-01-15")).toBe("January 15, 2024");
        expect(formatDateToMonthDayYear("2022-12-31")).toBe("December 31, 2022");
    });

    test("handles null and undefined values", () => {
        expect(formatDateToMonthDayYear(null)).toBeNull();
        expect(formatDateToMonthDayYear(undefined)).toBeNull();
    });

    test("handles empty string", () => {
        expect(formatDateToMonthDayYear("")).toBeNull();
    });
});

describe("computeDisplayPercent", () => {
    test("returns 0 when value is 0", () => {
        expect(computeDisplayPercent(0, 1000)).toBe(0);
    });

    test("returns 0 when total is 0", () => {
        expect(computeDisplayPercent(100, 0)).toBe(0);
    });

    test("returns rounded integer for normal values", () => {
        expect(computeDisplayPercent(500, 1000)).toBe(50);
        expect(computeDisplayPercent(333, 1000)).toBe(33);
        expect(computeDisplayPercent(996, 1000)).toBe(100);
    });

    test("returns '<1' for non-zero values that round down to 0%", () => {
        expect(computeDisplayPercent(1, 1000)).toBe("<1");
        expect(computeDisplayPercent(4, 1000)).toBe("<1");
    });

    test("returns 1 for values that round up to exactly 1%", () => {
        expect(computeDisplayPercent(5, 1000)).toBe(1);
    });

    test("returns 100 for single-item (all of total)", () => {
        expect(computeDisplayPercent(1000, 1000)).toBe(100);
    });

    test("coerces numeric strings correctly", () => {
        expect(computeDisplayPercent("500", "1000")).toBe(50);
    });

    test("returns 0 for NaN/non-finite inputs", () => {
        expect(computeDisplayPercent(NaN, 1000)).toBe(0);
        expect(computeDisplayPercent(500, NaN)).toBe(0);
        expect(computeDisplayPercent(Infinity, 1000)).toBe(0);
    });
});

describe("computeDisplayPercents", () => {
    test("returns empty array for empty input", () => {
        expect(computeDisplayPercents([])).toEqual([]);
    });

    test("returns items with percent 0 when total is 0", () => {
        const items = [
            { id: 1, value: 0 },
            { id: 2, value: 0 }
        ];
        const result = computeDisplayPercents(items);
        expect(result[0].percent).toBe(0);
        expect(result[1].percent).toBe(0);
    });

    test("dominant item gets 99 (not 100) when other non-zero peers exist", () => {
        // 996 + 2 + 1 + 1 = 1000; 996/1000 = 99.6% → rounds to 100, but peers are non-zero.
        // Per Figma spec: show plain "99%" — never ">99%".
        const items = [
            { id: 1, value: 996 },
            { id: 2, value: 2 },
            { id: 3, value: 1 },
            { id: 4, value: 1 }
        ];
        const result = computeDisplayPercents(items);
        expect(result[0].percent).toBe(99);
        expect(result[1].percent).toBe("<1");
        expect(result[2].percent).toBe("<1");
        expect(result[3].percent).toBe("<1");
    });

    test("single non-zero item gets 100 (no peers)", () => {
        const items = [
            { id: 1, value: 1000 },
            { id: 2, value: 0 }
        ];
        const result = computeDisplayPercents(items);
        expect(result[0].percent).toBe(100);
        expect(result[1].percent).toBe(0);
    });

    test("largest remainder assigns the extra point so integer labels sum to 100", () => {
        const items = [
            { id: 1, value: 333 },
            { id: 2, value: 333 },
            { id: 3, value: 334 }
        ];
        const result = computeDisplayPercents(items);
        expect(result[0].percent).toBe(33);
        expect(result[1].percent).toBe(33);
        expect(result[2].percent).toBe(34);
        expect(result.reduce((sum, item) => sum + item.percent, 0)).toBe(100);
    });

    test("largest remainder breaks ties deterministically by larger value then original order", () => {
        const items = [
            { id: 1, value: 125 },
            { id: 2, value: 125 },
            { id: 3, value: 250 },
            { id: 4, value: 500 }
        ];

        const result = computeDisplayPercents(items);

        expect(result.map((item) => item.percent)).toEqual([13, 12, 25, 50]);
    });

    test("sub-1% non-zero items show '<1'", () => {
        const items = [
            { id: 1, value: 998 },
            { id: 2, value: 1 },
            { id: 3, value: 1 }
        ];
        const result = computeDisplayPercents(items);
        expect(result[1].percent).toBe("<1");
        expect(result[2].percent).toBe("<1");
    });

    test("does not mutate original items", () => {
        const items = [
            { id: 1, value: 500 },
            { id: 2, value: 500 }
        ];
        computeDisplayPercents(items);
        expect(items[0]).not.toHaveProperty("percent");
    });

    test("coerces numeric string values correctly", () => {
        const items = [
            { id: 1, value: "500" },
            { id: 2, value: "500" }
        ];
        const result = computeDisplayPercents(items);
        expect(result[0].percent).toBe(50);
        expect(result[1].percent).toBe(50);
    });

    test("treats NaN/non-finite values as 0", () => {
        const items = [
            { id: 1, value: NaN },
            { id: 2, value: 1000 }
        ];
        const result = computeDisplayPercents(items);
        expect(result[0].percent).toBe(0);
        expect(result[1].percent).toBe(100);
    });
});

describe("applyMinimumArcValue", () => {
    test("returns items unchanged when all values are already above 1% of total", () => {
        const items = [
            { id: 1, value: 500 },
            { id: 2, value: 500 }
        ];
        const result = applyMinimumArcValue(items, 1000);
        expect(result[0].value).toBe(500);
        expect(result[1].value).toBe(500);
    });

    test("floors tiny non-zero slice up to 1% of total", () => {
        const items = [
            { id: 1, value: 999 },
            { id: 2, value: 1 } // 0.1% — below 1% floor
        ];
        const result = applyMinimumArcValue(items, 1000);
        expect(result[1].value).toBe(10); // raised to 1% of 1000
    });

    test("preserves total by reducing larger slice", () => {
        const items = [
            { id: 1, value: 999 },
            { id: 2, value: 1 }
        ];
        const result = applyMinimumArcValue(items, 1000);
        const newTotal = result.reduce((sum, item) => sum + item.value, 0);
        expect(newTotal).toBeCloseTo(1000, 5);
    });

    test("returns items unchanged when total is 0", () => {
        const items = [
            { id: 1, value: 0 },
            { id: 2, value: 0 }
        ];
        const result = applyMinimumArcValue(items, 0);
        expect(result[0].value).toBe(0);
        expect(result[1].value).toBe(0);
    });

    test("returns empty array for empty input", () => {
        expect(applyMinimumArcValue([], 0)).toEqual([]);
    });

    test("does not raise zero-value slices", () => {
        const items = [
            { id: 1, value: 1000 },
            { id: 2, value: 0 }
        ];
        const result = applyMinimumArcValue(items, 1000);
        expect(result[1].value).toBe(0);
    });

    test("floors multiple tiny slices and subtracts from the single reducible slice", () => {
        // Two tiny slices (1 each) floored to 1% of 1000 = 10 each.
        // addedValue = 18; reducible slice (998) must absorb both floor-ups.
        const items = [
            { id: 1, value: 998 },
            { id: 2, value: 1 }, // 0.1% — below 1% floor
            { id: 3, value: 1 } // 0.1% — below 1% floor
        ];
        const result = applyMinimumArcValue(items, 1000);
        expect(result[1].value).toBe(10); // raised to 1% of 1000
        expect(result[2].value).toBe(10); // raised to 1% of 1000
        // Total must still equal 1000
        const newTotal = result.reduce((sum, item) => sum + item.value, 0);
        expect(newTotal).toBeCloseTo(1000, 5);
    });

    test("returns adjusted items (with floors applied) when reducibleTotal < addedValue", () => {
        // Four tiny slices of 1 each — addedValue = 4 * 9 = 36.
        // Remaining reducible slice is only 996, but reducible budget above floor is
        // 996 - 10 = 986 which is > 36 in this case. Let's instead create an extreme
        // scenario: many tiny slices leave almost nothing to redistribute.
        // 98 items of value=1, 2 items of value=1 too — actually hard to trigger the
        // guard with integers. Instead, test the floor-only path: all items are tiny,
        // so reducibleTotal = 0 < addedValue > 0 → returns adjustedItems as-is (floors
        // applied but no redistribution).
        const items = [
            { id: 1, value: 1 }, // 1% of 200 = 2 — below floor
            { id: 2, value: 1 } // 1% of 200 = 2 — below floor
        ];
        // total=200, minValue=2. Both items below floor. reducibleTotal = 0 < addedValue = 2.
        const result = applyMinimumArcValue(items, 200);
        // Guard fires: returns adjustedItems with floors but no redistribution
        expect(result[0].value).toBe(2);
        expect(result[1].value).toBe(2);
    });
});
