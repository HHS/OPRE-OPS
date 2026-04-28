import { describe, it, expect } from "vitest";
import { formatActivePeriod, getTableHeadings } from "./ProjectFundingCANsTable.constants";

describe("getTableHeadings", () => {
    it("returns 5 column headings", () => {
        expect(getTableHeadings(2025)).toHaveLength(5);
    });

    it("uses a two-digit year in the FY funding column", () => {
        const headings = getTableHeadings(2025);
        expect(headings[3]).toBe("FY 25 Project Funding");
    });

    it("updates the FY column for different years", () => {
        expect(getTableHeadings(2024)[3]).toBe("FY 24 Project Funding");
        expect(getTableHeadings(2027)[3]).toBe("FY 27 Project Funding");
    });

    it("always includes CAN, Portfolio, Active Period, and Lifetime columns", () => {
        const headings = getTableHeadings(2025);
        expect(headings[0]).toBe("CAN");
        expect(headings[1]).toBe("Portfolio");
        expect(headings[2]).toBe("Active Period");
        expect(headings[4]).toBe("Lifetime Project Funding");
    });
});

describe("formatActivePeriod", () => {
    it("formats 1 as '1 Year'", () => {
        expect(formatActivePeriod(1)).toBe("1 Year");
    });

    it("formats values > 1 as 'N Years'", () => {
        expect(formatActivePeriod(5)).toBe("5 Years");
        expect(formatActivePeriod(3)).toBe("3 Years");
    });

    it("returns 'TBD' for null", () => {
        expect(formatActivePeriod(null)).toBe("TBD");
    });

    it("returns 'TBD' for undefined", () => {
        expect(formatActivePeriod(undefined)).toBe("TBD");
    });
});
