import { beforeEach, describe, expect, it } from "vitest";
import suite from "./suite";

describe("ProcurementTrackerStepThree Validation Suite", () => {
    beforeEach(() => {
        suite.reset();
    });

    it("validates solicitation start date format", () => {
        const result = suite.run({ solicitationPeriodStartDate: "2024-01-31" }, "solicitationPeriodStartDate");

        expect(result.hasErrors("solicitationPeriodStartDate")).toBe(true);
        expect(result.getErrors("solicitationPeriodStartDate")).toContain("Date must be MM/DD/YYYY");
    });

    it("validates solicitation end date format", () => {
        const result = suite.run({ solicitationPeriodEndDate: "2024-01-31" }, "solicitationPeriodEndDate");

        expect(result.hasErrors("solicitationPeriodEndDate")).toBe(true);
        expect(result.getErrors("solicitationPeriodEndDate")).toContain("Date must be MM/DD/YYYY");
    });

    it("requires solicitation end date to be after solicitation start date", () => {
        const result = suite.run(
            {
                solicitationPeriodStartDate: "02/10/2026",
                solicitationPeriodEndDate: "02/09/2026"
            },
            "solicitationPeriodEndDate"
        );

        expect(result.hasErrors("solicitationPeriodEndDate")).toBe(true);
        expect(result.getErrors("solicitationPeriodEndDate")).toContain("End date must be after start date");
    });

    it("accepts solicitation end date after solicitation start date", () => {
        const result = suite.run(
            {
                solicitationPeriodStartDate: "02/10/2026",
                solicitationPeriodEndDate: "02/12/2026"
            },
            "solicitationPeriodEndDate"
        );

        expect(result.hasErrors("solicitationPeriodEndDate")).toBe(false);
    });
});
