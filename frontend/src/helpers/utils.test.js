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
    formatDateToMonthDayYear
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
