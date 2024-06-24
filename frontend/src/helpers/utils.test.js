import {
    getCurrentFiscalYear,
    calculatePercent,
    convertCodeForDisplay,
    fiscalYearFromDate,
    renderField
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
});

test("fiscal year are calculated correctly", () => {
    expect(fiscalYearFromDate(null)).toEqual(null);
    expect(fiscalYearFromDate("--")).toEqual(null);
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
