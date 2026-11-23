import { describe, expect, it } from "vitest";
import {
    getAgreementWideActiveTracker,
    getCurrentProcurementTracker,
    getNextModificationNumber,
    getRequiredStepTypes,
    getRequiredSteps,
    getTrackerBudgetLines,
    isContractModTracker
} from "./procurementTracker.helpers";

const initialAward = { id: 1, status: "COMPLETED", award_type: "NEW_AWARD", created_on: "2025-01-01T00:00:00" };
const modTracker = (overrides = {}) => ({
    id: 2,
    status: "ACTIVE",
    award_type: "MODIFICATION",
    agreement_mod_id: 7,
    created_on: "2026-11-02T00:00:00",
    steps: [],
    ...overrides
});

describe("isContractModTracker", () => {
    it("is true only for a MODIFICATION tracker linked to a mod", () => {
        expect(isContractModTracker(modTracker())).toBe(true);
        expect(isContractModTracker(modTracker({ agreement_mod_id: null }))).toBe(false);
        expect(isContractModTracker(initialAward)).toBe(false);
        expect(isContractModTracker(undefined)).toBe(false);
    });
});

describe("getCurrentProcurementTracker", () => {
    it("returns the newest tracker, whatever order the list is in", () => {
        expect(getCurrentProcurementTracker([initialAward, modTracker()])?.id).toBe(2);
        expect(getCurrentProcurementTracker([modTracker(), initialAward])?.id).toBe(2);
    });

    it("returns the newest tracker even when it is completed and an older one is active", () => {
        const olderActive = modTracker({ id: 3, created_on: "2026-01-01T00:00:00" });
        const newerCompleted = modTracker({ id: 4, status: "COMPLETED", created_on: "2026-06-01T00:00:00" });
        expect(getCurrentProcurementTracker([olderActive, newerCompleted])?.id).toBe(4);
    });

    it("ignores inactive trackers", () => {
        const inactive = modTracker({ id: 5, status: "INACTIVE", created_on: "2027-01-01T00:00:00" });
        expect(getCurrentProcurementTracker([initialAward, inactive])?.id).toBe(1);
    });

    it("prefers the active tracker when dates tie", () => {
        const completed = { id: 9, status: "COMPLETED" };
        const active = { id: 8, status: "ACTIVE" };
        expect(getCurrentProcurementTracker([completed, active])?.id).toBe(8);
    });

    it("returns undefined for no trackers", () => {
        expect(getCurrentProcurementTracker(undefined)).toBeUndefined();
        expect(getCurrentProcurementTracker([])).toBeUndefined();
    });
});

describe("getAgreementWideActiveTracker", () => {
    it("ignores an active contract mod tracker", () => {
        const activeInitialAward = { ...initialAward, status: "ACTIVE" };
        expect(getAgreementWideActiveTracker([modTracker(), activeInitialAward])?.id).toBe(1);
        expect(getAgreementWideActiveTracker([modTracker()])).toBeUndefined();
    });
});

describe("getRequiredStepTypes / getRequiredSteps", () => {
    const asIsSteps = [
        { step_number: 6, step_type: "AWARD", status: "PENDING" },
        { step_number: 1, step_type: "ACQUISITION_PLANNING", status: "ACTIVE" },
        { step_number: 2, step_type: "PRE_SOLICITATION", status: "SKIPPED" },
        { step_number: 3, step_type: "SOLICITATION", status: "SKIPPED" },
        { step_number: 4, step_type: "EVALUATION", status: "SKIPPED" },
        { step_number: 5, step_type: "PRE_AWARD", status: "PENDING" }
    ];

    it("drops the skipped steps of an As-Is mod, in step order", () => {
        const tracker = modTracker({ steps: asIsSteps });
        expect(getRequiredStepTypes(tracker)).toEqual(["ACQUISITION_PLANNING", "PRE_AWARD", "AWARD"]);
        expect(getRequiredSteps(tracker).map((step) => step.step_number)).toEqual([1, 5, 6]);
    });

    it("keeps all six steps when none are skipped, or with no tracker", () => {
        expect(getRequiredStepTypes({ steps: [] })).toHaveLength(6);
        expect(getRequiredStepTypes(undefined)).toHaveLength(6);
    });
});

describe("getTrackerBudgetLines", () => {
    const lines = [{ id: 1 }, { id: 2 }, { id: 3 }];

    it("returns only a contract mod's own budget lines", () => {
        expect(getTrackerBudgetLines(modTracker({ budget_line_item_ids: [2, 3] }), lines)).toEqual([
            { id: 2 },
            { id: 3 }
        ]);
    });

    it("returns every budget line for the initial award or no tracker", () => {
        expect(getTrackerBudgetLines(initialAward, lines)).toEqual(lines);
        expect(getTrackerBudgetLines(undefined, lines)).toEqual(lines);
        expect(getTrackerBudgetLines(modTracker(), undefined)).toEqual([]);
    });
});

describe("getNextModificationNumber", () => {
    const withAwardNumber = (id, modificationNumber) =>
        modTracker({ id, steps: [{ step_type: "AWARD", modification_number: modificationNumber }] });

    it("starts the first mod on P00001 (the initial award's Base doesn't count)", () => {
        const current = modTracker({ id: 10 });
        expect(getNextModificationNumber([withAwardNumber(1, "Base"), current], current)).toBe("P00001");
    });

    it("continues after the highest number used by the agreement's other trackers", () => {
        const current = withAwardNumber(10, null);
        const trackers = [
            withAwardNumber(1, "Base"),
            withAwardNumber(2, "P00003"),
            withAwardNumber(3, "P00001"),
            current
        ];
        expect(getNextModificationNumber(trackers, current)).toBe("P00004");
    });

    it("ignores the current tracker's own stored number", () => {
        const current = withAwardNumber(10, "P00005");
        expect(getNextModificationNumber([withAwardNumber(2, "P00001"), current], current)).toBe("P00002");
    });

    it("returns blank once every number is used", () => {
        const current = modTracker({ id: 10 });
        expect(getNextModificationNumber([withAwardNumber(2, "P00020"), current], current)).toBe("");
    });
});
