import { beforeEach, describe, expect, it } from "vitest";
import suite from "./suite";

const BLI_POP_MESSAGE =
    "Services Components may not be updated in a way that causes non-draft Budget Lines to fall outside the Period of Performance.";

// Helpers to build test fixtures clearly
const sc = (number, period_start, period_end) => ({ number, period_start, period_end });
const bli = (date_needed) => ({ date_needed });

// Base valid add-mode data — no PoP boundary checks run in add mode
const validAddData = {
    servicesComponentSelect: 1,
    mode: "add",
    number: 1,
    popStartDate: "01/01/2025",
    popEndDate: "12/31/2025",
    allServicesComponents: [],
    nonDraftBudgetLines: []
};

describe("ServicesComponentForm Validation Suite", () => {
    beforeEach(() => {
        suite.reset();
    });

    // -------------------------------------------------------------------------
    // Basic required-field validation (mode-agnostic)
    // -------------------------------------------------------------------------
    describe("servicesComponentSelect required field", () => {
        it("passes when a SC number is selected", () => {
            const result = suite.run(validAddData);
            expect(result.getErrors("servicesComponentSelect")).toHaveLength(0);
        });

        it("fails when servicesComponentSelect is 0 (nothing selected)", () => {
            const result = suite.run({ ...validAddData, servicesComponentSelect: 0 });
            expect(result.getErrors("servicesComponentSelect")).toContain("This is required information");
        });
    });

    // -------------------------------------------------------------------------
    // Add mode — PoP boundary checks must NOT run
    // -------------------------------------------------------------------------
    describe("add mode — no PoP boundary checks", () => {
        it("does not run PoP checks when mode is add, even with a BLI outside any SC window", () => {
            const result = suite.run({
                ...validAddData,
                mode: "add",
                allServicesComponents: [sc(1, "2025-01-01", "2025-06-30")],
                nonDraftBudgetLines: [bli("2025-11-01")] // outside the SC window
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });
    });

    // -------------------------------------------------------------------------
    // Single Services Component — edit mode
    // -------------------------------------------------------------------------
    describe("single SC — edit mode", () => {
        // SC 1: 2025-01-01 → 2025-12-31
        // BLI obligate date: 2025-06-15 (well inside the window)
        const singleSC = [sc(1, "2025-01-01", "2025-12-31")];
        const bliInside = [bli("2025-06-15")];

        const baseEdit = {
            servicesComponentSelect: 1,
            mode: "edit",
            number: 1,
            allServicesComponents: singleSC,
            nonDraftBudgetLines: bliInside
        };

        it("passes when new start is before the BLI date and new end is after it", () => {
            const result = suite.run({
                ...baseEdit,
                popStartDate: "01/01/2025",
                popEndDate: "12/31/2025"
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("passes when start is moved earlier (window expands)", () => {
            const result = suite.run({
                ...baseEdit,
                popStartDate: "07/01/2024", // earlier than original
                popEndDate: "12/31/2025"
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("fails when start is moved after the BLI date (BLI falls outside window start)", () => {
            const result = suite.run({
                ...baseEdit,
                popStartDate: "07/01/2025", // after the BLI date of 2025-06-15
                popEndDate: "12/31/2025"
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
        });

        it("fails when end is moved before the BLI date (BLI falls outside window end)", () => {
            const result = suite.run({
                ...baseEdit,
                popStartDate: "01/01/2025",
                popEndDate: "05/31/2025" // before the BLI date of 2025-06-15
            });
            expect(result.getErrors("popEndDate")).toContain(BLI_POP_MESSAGE);
        });

        it("fails when both start and end are moved to exclude the BLI date", () => {
            const result = suite.run({
                ...baseEdit,
                popStartDate: "07/01/2025", // after BLI date
                popEndDate: "12/31/2025"
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
        });

        it("does not fire when there are no non-draft BLIs", () => {
            const result = suite.run({
                ...baseEdit,
                popStartDate: "07/01/2025",
                popEndDate: "12/31/2025",
                nonDraftBudgetLines: []
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("does not fire when BLIs have no date_needed", () => {
            const result = suite.run({
                ...baseEdit,
                popStartDate: "07/01/2025",
                popEndDate: "12/31/2025",
                nonDraftBudgetLines: [bli(null), bli(null)]
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });
    });

    // -------------------------------------------------------------------------
    // Two Services Components — edit mode
    //
    // SC 1: 2025-01-01 → 2025-06-30
    // SC 2: 2025-04-01 → 2025-12-31
    //
    // The BLI lives at 2025-08-15 — inside SC 2's window but outside SC 1's end.
    // Overall window: 2025-01-01 → 2025-12-31 (driven by SC 1 start, SC 2 end).
    // -------------------------------------------------------------------------
    describe("two SCs — BLI falls between SC 1 end and SC 2 end", () => {
        const twoSCs = [
            sc(1, "2025-01-01", "2025-06-30"),
            sc(2, "2025-04-01", "2025-12-31")
        ];
        // BLI at 2025-08-15: past SC 1's end but inside SC 2's window
        const bliBetween = [bli("2025-08-15")];

        const baseEdit = {
            servicesComponentSelect: 1,
            mode: "edit",
            number: 1,
            allServicesComponents: twoSCs,
            nonDraftBudgetLines: bliBetween
        };

        it("passes when SC 1 end is moved earlier — SC 2 still covers the BLI", () => {
            // Moving SC 1 end from 2025-06-30 to 2025-05-31 does not affect overall
            // window end (SC 2 still ends 2025-12-31), so BLI at 2025-08-15 is safe.
            const result = suite.run({
                ...baseEdit,
                popStartDate: "01/01/2025",
                popEndDate: "05/31/2025" // earlier SC 1 end
            });
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("passes when SC 1 start is moved later — overall window start still <= BLI date", () => {
            // SC 2 starts 2025-04-01, BLI is 2025-08-15. Even if SC 1 start moves to
            // 2025-03-01, the earliest window start becomes SC 2's 2025-04-01 which is
            // still before the BLI date.
            const result = suite.run({
                ...baseEdit,
                popStartDate: "03/01/2025", // later than original 2025-01-01
                popEndDate: "06/30/2025"
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
        });

        it("passes when SC 2 end is tightened — BLI is still inside the new end", () => {
            const result = suite.run({
                servicesComponentSelect: 2,
                mode: "edit",
                number: 2,
                allServicesComponents: twoSCs,
                nonDraftBudgetLines: bliBetween,
                popStartDate: "04/01/2025",
                popEndDate: "09/30/2025" // tightened but still after BLI 2025-08-15
            });
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("fails when SC 2 end is moved before the BLI date — no other SC covers it", () => {
            // SC 1 ends 2025-06-30, SC 2 new end 2025-07-31 — both before 2025-08-15.
            // Overall window end becomes 2025-07-31 which is before the BLI date.
            const result = suite.run({
                servicesComponentSelect: 2,
                mode: "edit",
                number: 2,
                allServicesComponents: twoSCs,
                nonDraftBudgetLines: bliBetween,
                popStartDate: "04/01/2025",
                popEndDate: "07/31/2025" // before BLI 2025-08-15
            });
            expect(result.getErrors("popEndDate")).toContain(BLI_POP_MESSAGE);
        });

        it("fails when SC 1 start is moved past overall window start and SC 2 start is also after BLI date", () => {
            // Force a situation where window start exceeds earliest BLI date.
            // Add a second BLI at 2025-03-01 (before both SCs' starts if we move them).
            const earlyBli = [bli("2025-03-01"), bli("2025-08-15")];
            // Move SC 1 start to 2025-04-01 (same as SC 2). New window start = 2025-04-01,
            // which is after the early BLI date 2025-03-01.
            const result = suite.run({
                ...baseEdit,
                nonDraftBudgetLines: earlyBli,
                popStartDate: "04/01/2025", // SC 1 start moved to match SC 2 start
                popEndDate: "06/30/2025"
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
        });
    });
});
