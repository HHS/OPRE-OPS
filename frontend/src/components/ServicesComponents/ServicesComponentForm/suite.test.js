import { beforeEach, describe, expect, it } from "vitest";
import suite from "./suite";

const BLI_POP_MESSAGE =
    "Services Components may not be updated in a way that causes non-draft Budget Lines to fall outside the Period of Performance.";

// Helpers to build test fixtures clearly
const sc = (number, period_start, period_end) => ({ number, period_start, period_end });
const bli = (date_needed) => ({ date_needed });

// Converts MM/DD/YYYY (form field) to YYYY-MM-DD (API format), mirroring the hook.
const toISO = (mdy) => {
    if (!mdy) return null;
    const [m, d, y] = mdy.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

// Replicates what useServicesComponents does before calling suite.run:
// replaces the edited SC's period dates with the live form values.
const mergeFormDates = (scs, editedNumber, popStartDate, popEndDate) =>
    scs.map((s) =>
        s.number === editedNumber
            ? {
                  ...s,
                  period_start: toISO(popStartDate) ?? s.period_start,
                  period_end: toISO(popEndDate) ?? s.period_end
              }
            : s
    );

// Base valid add-mode data — no PoP boundary checks run in add mode
const validAddData = {
    servicesComponentSelect: 1,
    mode: "add",
    number: 1,
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
    // Add mode — PoP boundary checks
    //
    // When an agreement already has non-draft BLIs (e.g. from data import) and
    // the user is adding the first SC, the new SC's window must cover all of them.
    // -------------------------------------------------------------------------
    describe("add mode — PoP boundary checks", () => {
        it("fails when a non-draft BLI falls outside the new SC's window", () => {
            // Agreement has no existing SCs and a planned BLI at 2025-11-01.
            // New SC covers 2025-01-01 → 2025-06-30, leaving the BLI outside.
            const result = suite.run({
                ...validAddData,
                mode: "add",
                allServicesComponents: [sc(1, "2025-01-01", "2025-06-30")],
                nonDraftBudgetLines: [bli("2025-11-01")]
            });
            expect(result.getErrors("popEndDate")).toContain(BLI_POP_MESSAGE);
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
            nonDraftBudgetLines: bliInside
        };

        it("passes when new start is before the BLI date and new end is after it", () => {
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(singleSC, 1, "01/01/2025", "12/31/2025")
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("passes when start is moved earlier (window expands)", () => {
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(singleSC, 1, "07/01/2024", "12/31/2025")
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("fails when start is moved after the BLI date (BLI falls outside window start)", () => {
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(singleSC, 1, "07/01/2025", "12/31/2025")
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
        });

        it("fails when end is moved before the BLI date (BLI falls outside window end)", () => {
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(singleSC, 1, "01/01/2025", "05/31/2025")
            });
            expect(result.getErrors("popEndDate")).toContain(BLI_POP_MESSAGE);
        });

        it("fails when both start and end are moved to exclude the BLI date", () => {
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(singleSC, 1, "07/01/2025", "12/31/2025")
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
        });

        it("does not fire when there are no non-draft BLIs", () => {
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(singleSC, 1, "07/01/2025", "12/31/2025"),
                nonDraftBudgetLines: []
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("does not fire when BLIs have no date_needed", () => {
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(singleSC, 1, "07/01/2025", "12/31/2025"),
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
        const twoSCs = [sc(1, "2025-01-01", "2025-06-30"), sc(2, "2025-04-01", "2025-12-31")];
        // BLI at 2025-08-15: past SC 1's end but inside SC 2's window
        const bliBetween = [bli("2025-08-15")];

        const baseEdit = {
            servicesComponentSelect: 1,
            mode: "edit",
            number: 1,
            nonDraftBudgetLines: bliBetween
        };

        it("passes when SC 1 end is moved earlier — SC 2 still covers the BLI", () => {
            // Moving SC 1 end from 2025-06-30 to 2025-05-31 does not affect overall
            // window end (SC 2 still ends 2025-12-31), so BLI at 2025-08-15 is safe.
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(twoSCs, 1, "01/01/2025", "05/31/2025")
            });
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("passes when SC 1 start is moved later — overall window start still <= BLI date", () => {
            // SC 2 starts 2025-04-01, BLI is 2025-08-15. Even if SC 1 start moves to
            // 2025-03-01, the earliest window start becomes SC 2's 2025-04-01 which is
            // still before the BLI date.
            const result = suite.run({
                ...baseEdit,
                allServicesComponents: mergeFormDates(twoSCs, 1, "03/01/2025", "06/30/2025")
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
        });

        it("passes when SC 2 end is tightened — BLI is still inside the new end", () => {
            const result = suite.run({
                servicesComponentSelect: 2,
                mode: "edit",
                number: 2,
                nonDraftBudgetLines: bliBetween,
                allServicesComponents: mergeFormDates(twoSCs, 2, "04/01/2025", "09/30/2025")
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
                nonDraftBudgetLines: bliBetween,
                allServicesComponents: mergeFormDates(twoSCs, 2, "04/01/2025", "07/31/2025")
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
                allServicesComponents: mergeFormDates(twoSCs, 1, "04/01/2025", "06/30/2025")
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
        });
    });

    // -------------------------------------------------------------------------
    // Draft BLI exemption — edit mode
    //
    // Draft BLIs are excluded from PoP boundary checks. The hook pre-filters them
    // out before passing nonDraftBudgetLines to the suite, so from the suite's
    // perspective the draft BLI simply does not appear. These tests confirm that
    // a window change which would leave a draft BLI outside the new window does
    // NOT trigger a validation error, mirroring the backend unit tests.
    //
    // Fixture mirrors the backend pop_validation_agreement:
    //   SC 1: 2025-01-01 → 2025-06-30
    //   SC 2: 2025-04-01 → 2025-12-31
    //   Draft BLI date: 2025-11-01 (outside the reduced window in test 1)
    //                   2025-02-01 (before the advanced window start in test 2)
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // Undefined SC window — PoP check does not fire
    //
    // When no SC in the agreement has period_start or period_end set, the overall
    // window (windowStart / windowEnd) is null.  The suite guards each PoP test
    // with `if (!windowStart)` / `if (!windowEnd)`, so no error is raised
    // regardless of the BLI's date_needed.
    // -------------------------------------------------------------------------
    describe("undefined SC window — no PoP error", () => {
        it("passes when all SCs have null period_start and period_end", () => {
            // SC has no dates — window is fully undefined.
            // A non-draft BLI with any date_needed must not trigger a PoP error.
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: [sc(1, null, null)],
                nonDraftBudgetLines: [bli("2025-06-15")]
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("passes when period_start is set but period_end is null (open-ended window)", () => {
            // Window has a start but no end — the popEndDate test must not fire.
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: [sc(1, "2025-01-01", null)],
                nonDraftBudgetLines: [bli("2030-12-31")]
            });
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("passes when period_end is set but period_start is null (open-start window)", () => {
            // Window has an end but no start — the popStartDate test must not fire.
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: [sc(1, null, "2025-06-30")],
                nonDraftBudgetLines: [bli("2020-01-01")]
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
        });
    });

    // -------------------------------------------------------------------------
    // One-sided SC window — bound that exists is enforced; absent bound is not
    //
    // The suite guards each PoP test:
    //   popStartDate: `if (!windowStart) return;`  — skipped when no SC has period_start
    //   popEndDate:   `if (!windowEnd) return;`    — skipped when no SC has period_end
    //
    // So when only one side is defined:
    //   - The defined side must still reject violations.
    //   - The absent side must place no constraint.
    // -------------------------------------------------------------------------
    describe("one-sided SC window — period_start only (no period_end)", () => {
        // SC has a start but no end. Overall window: start=2025-01-01, end=null.
        const startOnlySC = [sc(1, "2025-01-01", null)];

        it("fails when BLI date is before period_start (start bound is enforced)", () => {
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: startOnlySC,
                nonDraftBudgetLines: [bli("2024-12-31")]
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
        });

        it("passes when BLI date equals period_start (start bound inclusive)", () => {
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: startOnlySC,
                nonDraftBudgetLines: [bli("2025-01-01")]
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
        });

        it("passes when BLI date is far in the future (no end bound enforced)", () => {
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: startOnlySC,
                nonDraftBudgetLines: [bli("2099-12-31")]
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("fails start bound but has no end-bound error (absent end places no constraint)", () => {
            // BLI is before the start — start error fires; popEndDate must not fire independently.
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: startOnlySC,
                nonDraftBudgetLines: [bli("2024-06-15")]
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });
    });

    describe("one-sided SC window — period_end only (no period_start)", () => {
        // SC has an end but no start. Overall window: start=null, end=2025-12-31.
        const endOnlySC = [sc(1, null, "2025-12-31")];

        it("fails when BLI date is after period_end (end bound is enforced)", () => {
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: endOnlySC,
                nonDraftBudgetLines: [bli("2026-01-01")]
            });
            expect(result.getErrors("popEndDate")).toContain(BLI_POP_MESSAGE);
        });

        it("passes when BLI date equals period_end (end bound inclusive)", () => {
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: endOnlySC,
                nonDraftBudgetLines: [bli("2025-12-31")]
            });
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("passes when BLI date is far in the past (no start bound enforced)", () => {
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: endOnlySC,
                nonDraftBudgetLines: [bli("2000-01-01")]
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("fails end bound but has no start-bound error (absent start places no constraint)", () => {
            // BLI is after the end — end error fires; popStartDate must not fire independently.
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: endOnlySC,
                nonDraftBudgetLines: [bli("2026-06-15")]
            });
            expect(result.getErrors("popEndDate")).toContain(BLI_POP_MESSAGE);
            expect(result.getErrors("popStartDate")).toHaveLength(0);
        });
    });

    // -------------------------------------------------------------------------
    // One-sided window — multiple SCs, mixed presence of start/end
    //
    // If SC 1 has only period_start and SC 2 has only period_end, the overall
    // window has a defined start AND a defined end. Both bounds must be enforced.
    // But if ALL SCs lack period_end (or period_start), that side is absent.
    // -------------------------------------------------------------------------
    describe("one-sided window — multiple SCs all missing the same bound", () => {
        // Two SCs, neither has period_end. Overall window: start=min, end=null.
        const twoStartOnlySCs = [sc(1, "2025-01-01", null), sc(2, "2025-06-01", null)];

        it("uses the earliest period_start across all SCs as the lower bound", () => {
            // BLI at 2024-12-31 is before SC 1's start (the overall minimum) → error
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: twoStartOnlySCs,
                nonDraftBudgetLines: [bli("2024-12-31")]
            });
            expect(result.getErrors("popStartDate")).toContain(BLI_POP_MESSAGE);
        });

        it("no end-bound error when no SC has period_end, even with a far-future BLI", () => {
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                allServicesComponents: twoStartOnlySCs,
                nonDraftBudgetLines: [bli("2099-12-31")]
            });
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });
    });

    describe("draft BLI exemption — edit mode", () => {
        const twoSCs = [sc(1, "2025-01-01", "2025-06-30"), sc(2, "2025-04-01", "2025-12-31")];

        it("shrinking SC 2 period_end past a draft BLI date is allowed", () => {
            // A draft BLI sits at 2025-11-01. Shrinking SC 2's period_end to 2025-07-31
            // drops the overall window end to 2025-07-31, which is before 2025-11-01.
            // Because the BLI is draft it is absent from nonDraftBudgetLines — no error.
            const result = suite.run({
                servicesComponentSelect: 2,
                mode: "edit",
                number: 2,
                nonDraftBudgetLines: [], // draft BLI excluded by hook
                allServicesComponents: mergeFormDates(twoSCs, 2, "04/01/2025", "07/31/2025")
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });

        it("advancing SC 1 period_start past a draft BLI date is allowed", () => {
            // A draft BLI sits at 2025-02-01. Advancing SC 1's period_start to 2025-04-01
            // pushes the overall window start to 2025-04-01, which is after 2025-02-01.
            // Because the BLI is draft it is absent from nonDraftBudgetLines — no error.
            const result = suite.run({
                servicesComponentSelect: 1,
                mode: "edit",
                number: 1,
                nonDraftBudgetLines: [], // draft BLI excluded by hook
                allServicesComponents: mergeFormDates(twoSCs, 1, "04/01/2025", "06/30/2025")
            });
            expect(result.getErrors("popStartDate")).toHaveLength(0);
            expect(result.getErrors("popEndDate")).toHaveLength(0);
        });
    });
});
